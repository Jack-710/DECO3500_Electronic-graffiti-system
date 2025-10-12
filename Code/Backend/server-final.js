const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"]
  }
});

app.use(express.json({ limit: '10mb' }));

// ========== DATABASE SETUP ==========
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database', 'drawing_app.sqlite'),
  logging: false
});

// Simple User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  guestId: {
    type: DataTypes.STRING,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: "Digital artist exploring collaborative creation"
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isGuest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Simple Location Model
const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  buildingCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Simple Stream Model
const Stream = sequelize.define('Stream', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  participantCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Simple Post Model
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Define relationships
User.hasMany(Stream, { foreignKey: 'creatorId' });
Stream.belongsTo(User, { foreignKey: 'creatorId' });

User.hasMany(Post, { foreignKey: 'authorId' });
Post.belongsTo(User, { foreignKey: 'authorId' });

Location.hasMany(Stream, { foreignKey: 'locationId' });
Stream.belongsTo(Location, { foreignKey: 'locationId' });

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync all models
    await sequelize.sync({ force: true }); // This recreates tables
    console.log('✅ Database schema synchronized.');
    
    // Create sample data
    await createSampleData();
    console.log('✅ Sample data created.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Create sample data
const createSampleData = async () => {
  try {
    // Create sample locations
    const locations = await Location.bulkCreate([
      {
        name: 'Advanced Engineering Building',
        buildingCode: '49',
        latitude: -27.4975,
        longitude: 153.0135,
        activeUsers: 3
      },
      {
        name: 'Learning Innovation Building',
        buildingCode: '17',
        latitude: -27.4960,
        longitude: 153.0128,
        activeUsers: 5
      },
      {
        name: 'Prentice Building',
        buildingCode: '42',
        latitude: -27.4990,
        longitude: 153.0150,
        activeUsers: 7
      }
    ]);

    // Create sample user
    const user = await User.create({
      guestId: 'sample_host',
      username: 'ArtEnthusiast',
      description: 'Love collaborative drawing!',
      followerCount: 45,
      isGuest: false
    });

    // Create sample streams
    await Stream.bulkCreate([
      {
        title: 'Collaborative Art Session',
        creatorId: user.id,
        locationId: locations[0].id,
        participantCount: 3,
        maxParticipants: 8
      },
      {
        title: 'UQ Campus Doodles',
        creatorId: user.id,
        locationId: locations[1].id,
        participantCount: 1,
        maxParticipants: 5
      }
    ]);

    // Create sample posts
    await Post.bulkCreate([
      {
        content: 'Check out this amazing collaborative drawing we made!',
        authorId: user.id,
        likeCount: 12,
        commentCount: 3
      },
      {
        content: 'The drawing session at AEB was fantastic!',
        authorId: user.id,
        likeCount: 8,
        commentCount: 1
      }
    ]);

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: '✅ Collaborative Drawing Backend is running!',
    database: 'SQLite with automatic schema',
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: "🎨 Collaborative Drawing App Backend API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      users: {
        createGuest: "POST /api/users/guest",
        getUser: "GET /api/users/:id"
      },
      locations: "GET /api/locations",
      streams: {
        list: "GET /api/streams",
        create: "POST /api/streams",
        get: "GET /api/streams/:id"
      },
      posts: {
        list: "GET /api/posts",
        create: "POST /api/posts"
      }
    }
  });
});

// Create guest user
app.post('/api/users/guest', async (req, res) => {
  try {
    const guestUser = await User.create({
      guestId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: `Guest${Math.floor(1000 + Math.random() * 9000)}`,
      isGuest: true
    });
    
    res.json({
      success: true,
      user: guestUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET version for browser testing
app.get('/api/users/guest', async (req, res) => {
  try {
    const guestUser = await User.create({
      guestId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: `Guest${Math.floor(1000 + Math.random() * 9000)}`,
      isGuest: true
    });
    
    res.json({
      success: true,
      user: guestUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all streams
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await Stream.findAll({
      include: [User, Location],
      order: [['createdAt', 'DESC']]
    });
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new stream
app.post('/api/streams', async (req, res) => {
  try {
    const { title, locationId, creatorId } = req.body;
    
    let userId = creatorId;
    if (!userId) {
      const guestUser = await User.create({
        guestId: `guest_${Date.now()}`,
        username: `Host${Math.floor(1000 + Math.random() * 9000)}`,
        isGuest: true
      });
      userId = guestUser.id;
    }
    
    let locId = locationId;
    if (!locId) {
      const firstLocation = await Location.findOne();
      locId = firstLocation?.id;
    }
    
    const stream = await Stream.create({
      title: title || 'Collaborative Drawing Session',
      locationId: locId,
      creatorId: userId
    });
    
    const completeStream = await Stream.findByPk(stream.id, {
      include: [User, Location]
    });
    
    res.status(201).json({
      success: true,
      stream: completeStream
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [User],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post
app.post('/api/posts', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    
    let userId = authorId;
    if (!userId) {
      const guestUser = await User.create({
        guestId: `guest_${Date.now()}`,
        username: `Artist${Math.floor(1000 + Math.random() * 9000)}`,
        isGuest: true
      });
      userId = guestUser.id;
    }
    
    const post = await Post.create({
      content: content || "Check out my collaborative drawing!",
      authorId: userId
    });
    
    const completePost = await Post.findByPk(post.id, {
      include: [User]
    });
    
    res.status(201).json({
      success: true,
      post: completePost
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SOCKET.IO ==========
const activeStreams = new Map();

io.on('connection', (socket) => {
  console.log('🎨 User connected:', socket.id);

  socket.on('join-stream', (data) => {
    const { streamId, username = 'Guest' } = data;
    socket.join(streamId);
    console.log(`👥 ${username} joined stream: ${streamId}`);
    
    // Initialize stream tracking
    if (!activeStreams.has(streamId)) {
      activeStreams.set(streamId, {
        participants: new Map(),
        drawings: []
      });
    }
    
    const stream = activeStreams.get(streamId);
    stream.participants.set(socket.id, { username, joinedAt: new Date() });
    
    // Notify others
    socket.to(streamId).emit('user-joined', {
      username,
      streamId,
      participantCount: stream.participants.size
    });
  });

  socket.on('drawing-data', (data) => {
    const { streamId, drawingData } = data;
    socket.to(streamId).emit('drawing-update', drawingData);
  });

  socket.on('leave-stream', (streamId) => {
    socket.leave(streamId);
    if (activeStreams.has(streamId)) {
      const stream = activeStreams.get(streamId);
      stream.participants.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`🎯 Backend server running on port ${PORT}`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`👤 Create Guest: http://localhost:${PORT}/api/users/guest`);
    console.log(`🗺️  Locations: http://localhost:${PORT}/api/locations`);
    console.log(`🎨 Streams: http://localhost:${PORT}/api/streams`);
    console.log(`📝 Posts: http://localhost:${PORT}/api/posts`);
    console.log(`⚡ Real-time collaboration ready!`);
  });
};

startServer();