const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { 
  User, 
  Location, 
  DrawingSession, 
  Drawing, 
  Comment, 
  Like,
  DrawingParticipant 
} = require('./models');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const activeSessions = new Map();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: '✅ Collaborative Drawing Backend is running!',
    database: 'SQLite with full data persistence',
    activeSessions: activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/users/guest', async (req, res) => {
  try {
    const guestUser = await User.create({
      guestId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: `Guest${Math.floor(1000 + Math.random() * 9000)}`,
      isGuest: true,
      description: "New to collaborative drawing"
    });
    
    res.json({
      success: true,
      user: {
        id: guestUser.id,
        guestId: guestUser.guestId,
        username: guestUser.username,
        displayName: guestUser.displayName,
        description: guestUser.description,
        followerCount: guestUser.followerCount,
        postCount: guestUser.postCount,
        isGuest: guestUser.isGuest
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Drawing,
          as: 'drawings',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/drawings', async (req, res) => {
  try {
    const drawings = await Drawing.findAll({
      where: { authorId: req.params.id },
      include: [
        { model: User, as: 'author' },
        { model: Location, as: 'location' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(drawings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.findAll({
      order: [['name', 'ASC']]
    });
    
    const enhancedLocations = await Promise.all(
      locations.map(async (location) => {
        const activeSessionCount = await DrawingSession.count({
          where: { 
            locationId: location.id,
            isActive: true 
          }
        });
        
        const recentDrawings = await Drawing.count({
          where: { 
            locationId: location.id,
            createdAt: {
              [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });
        
        return {
          ...location.toJSON(),
          activeSessionCount,
          recentDrawings,
          realTimeActiveUsers: Array.from(activeSessions.values()).filter(
            session => session.locationId === location.id
          ).reduce((sum, session) => sum + session.participants.size, 0)
        };
      })
    );
    
    res.json(enhancedLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await DrawingSession.findAll({
      where: { isActive: true },
      include: [
        { model: User, as: 'creator' },
        { model: Location, as: 'location' },
        { 
          model: DrawingParticipant, 
          as: 'participants',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['startedAt', 'DESC']]
    });
    
    const enhancedSessions = sessions.map(session => {
      const activeSession = activeSessions.get(session.id);
      return {
        ...session.toJSON(),
        realTimeParticipantCount: activeSession ? activeSession.participants.size : 0,
        isLive: !!activeSession
      };
    });
    
    res.json(enhancedSessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { title, locationId, creatorId, description, maxParticipants = 10 } = req.body;
    
    const session = await DrawingSession.create({
      title: title || 'Collaborative Drawing Session',
      description,
      locationId,
      creatorId,
      maxParticipants,
      isActive: true,
      startedAt: new Date()
    });
    
    const completeSession = await DrawingSession.findByPk(session.id, {
      include: [
        { model: User, as: 'creator' },
        { model: Location, as: 'location' }
      ]
    });
    
    res.status(201).json({
      success: true,
      session: completeSession
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drawings', async (req, res) => {
  try {
    const { title, drawingData, sessionId, authorId, locationId, duration, toolsUsed } = req.body;
    
    const drawing = await Drawing.create({
      title,
      drawingData: JSON.stringify(drawingData),
      sessionId,
      authorId,
      locationId,
      duration,
      toolsUsed: JSON.stringify(toolsUsed || []),
      createdAt: new Date()
    });
    
    if (locationId) {
      await Location.increment('totalDrawings', { where: { id: locationId } });
    }
    
    if (authorId) {
      await User.increment('postCount', { where: { id: authorId } });
    }
    
    const completeDrawing = await Drawing.findByPk(drawing.id, {
      include: [
        { model: User, as: 'author' },
        { model: Location, as: 'location' },
        { model: DrawingSession, as: 'session' }
      ]
    });
    
    res.status(201).json({
      success: true,
      drawing: completeDrawing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations/:id/drawings', async (req, res) => {
  try {
    const drawings = await Drawing.findAll({
      where: { locationId: req.params.id },
      include: [
        { model: User, as: 'author' },
        { model: DrawingSession, as: 'session' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json(drawings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drawings/:id', async (req, res) => {
  try {
    const drawing = await Drawing.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author' },
        { model: Location, as: 'location' },
        { model: DrawingSession, as: 'session' },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author' }],
          order: [['createdAt', 'ASC']]
        },
        {
          model: Like,
          as: 'likes',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!drawing) {
      return res.status(404).json({ error: 'Drawing not found' });
    }
    
    await drawing.increment('viewCount');
    
    res.json(drawing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { content, drawingId, authorId } = req.body;
    
    const comment = await Comment.create({
      content,
      drawingId,
      authorId,
      createdAt: new Date()
    });
    
    const completeComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author' }]
    });
    
    res.status(201).json({
      success: true,
      comment: completeComment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drawings/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const existingLike = await Like.findOne({
      where: { drawingId: req.params.id, userId }
    });
    
    if (existingLike) {
      await existingLike.destroy();
      await Drawing.decrement('likeCount', { where: { id: req.params.id } });
      res.json({ success: true, liked: false });
    } else {
      await Like.create({
        drawingId: req.params.id,
        userId
      });
      await Drawing.increment('likeCount', { where: { id: req.params.id } });
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


io.on('connection', (socket) => {
  console.log('🎨 User connected:', socket.id);

  socket.on('join-session', async (data) => {
    const { sessionId, userId, username } = data;
    
    try {
      const session = await DrawingSession.findByPk(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      socket.join(sessionId);
      
      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
          participants: new Map(),
          drawings: [],
          locationId: session.locationId
        });
      }
      
      const activeSession = activeSessions.get(sessionId);
      activeSession.participants.set(socket.id, { userId, username, joinedAt: new Date() });
      
      await DrawingParticipant.create({
        sessionId,
        userId,
        joinedAt: new Date()
      });

      await session.update({ 
        participantCount: activeSession.participants.size 
      });
      
      const sessionDrawings = await Drawing.findAll({
        where: { sessionId },
        include: [{ model: User, as: 'author' }],
        order: [['createdAt', 'ASC']],
        limit: 100
      });
      
      socket.emit('session-history', { 
        drawings: sessionDrawings,
        participants: Array.from(activeSession.participants.values())
      });
      
      socket.to(sessionId).emit('user-joined', {
        userId,
        username,
        sessionId,
        participantCount: activeSession.participants.size
      });
      
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('drawing-data', async (data) => {
    const { sessionId, drawingData, userId } = data;
    
    if (activeSessions.has(sessionId)) {
      const activeSession = activeSessions.get(sessionId);
      activeSession.drawings.push({
        ...drawingData,
        userId,
        timestamp: new Date().toISOString()
      });
    }
    
    socket.to(sessionId).emit('drawing-update', {
      ...drawingData,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('save-drawing', async (data) => {
    const { sessionId, drawingData, userId, title, duration, toolsUsed } = data;
    
    try {
      const drawing = await Drawing.create({
        title: title || 'Collaborative Drawing',
        drawingData: JSON.stringify(drawingData),
        sessionId,
        authorId: userId,
        duration,
        toolsUsed: JSON.stringify(toolsUsed || [])
      });
      
      io.to(sessionId).emit('drawing-saved', {
        drawingId: drawing.id,
        title: drawing.title,
        authorId: userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error saving drawing:', error);
      socket.emit('error', { message: 'Failed to save drawing' });
    }
  });

  socket.on('leave-session', async (sessionId) => {
    await handleUserLeave(socket, sessionId);
  });

  socket.on('disconnect', async () => {
    console.log('❌ User disconnected:', socket.id);
    
    for (const [sessionId, activeSession] of activeSessions.entries()) {
      if (activeSession.participants.has(socket.id)) {
        await handleUserLeave(socket, sessionId);
      }
    }
  });
});

async function handleUserLeave(socket, sessionId) {
  socket.leave(sessionId);
  
  if (activeSessions.has(sessionId)) {
    const activeSession = activeSessions.get(sessionId);
    const userData = activeSession.participants.get(socket.id);
    activeSession.participants.delete(socket.id);
    
    try {
      await DrawingParticipant.update(
        { leftAt: new Date() },
        { 
          where: { 
            sessionId, 
            userId: userData?.userId,
            leftAt: null 
          } 
        }
      );
      
      const session = await DrawingSession.findByPk(sessionId);
      if (session) {
        await session.update({ 
          participantCount: activeSession.participants.size 
        });
      }
      
      if (activeSession.participants.size === 0) {
        activeSessions.delete(sessionId);
        
        if (session) {
          await session.update({ 
            isActive: false,
            endedAt: new Date() 
          });
        }
      } else {
        socket.to(sessionId).emit('user-left', {
          userId: userData?.userId,
          username: userData?.username,
          sessionId,
          participantCount: activeSession.participants.size
        });
      }
    } catch (error) {
      console.error('Error handling user leave:', error);
    }
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎯 Backend running on port ${PORT}`);
  console.log(`📊 Database: SQLite with full data persistence`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`👤 User Management: Ready`);
  console.log(`🎨 Drawing Persistence: Ready`);
  console.log(`💬 Comment System: Ready`);
  console.log(`❤️  Like System: Ready`);
  console.log(`⚡ Real-time Collaboration: Ready`);
});