const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/drawing_app.sqlite'),
  logging: console.log,
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  guestId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isGuest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  },
  totalDrawings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const DrawingSession = sequelize.define('DrawingSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

const Drawing = sequelize.define('Drawing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  drawingData: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  toolsUsed: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  }
});

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
});

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
});

const DrawingParticipant = sequelize.define('DrawingParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contributionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

User.hasMany(DrawingSession, { foreignKey: 'creatorId', as: 'createdSessions' });
DrawingSession.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Drawing, { foreignKey: 'authorId', as: 'drawings' });
Drawing.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(User, {
  through: Follow,
  as: 'Followers',
  foreignKey: 'followingId'
});
User.belongsToMany(User, {
  through: Follow,
  as: 'Following',
  foreignKey: 'followerId'
});

Location.hasMany(DrawingSession, { foreignKey: 'locationId', as: 'sessions' });
DrawingSession.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

Location.hasMany(Drawing, { foreignKey: 'locationId', as: 'drawings' });
Drawing.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

DrawingSession.hasMany(Drawing, { foreignKey: 'sessionId', as: 'drawings' });
Drawing.belongsTo(DrawingSession, { foreignKey: 'sessionId', as: 'session' });

DrawingSession.hasMany(DrawingParticipant, { foreignKey: 'sessionId', as: 'participants' });
DrawingParticipant.belongsTo(DrawingSession, { foreignKey: 'sessionId', as: 'session' });
DrawingParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Drawing.hasMany(Comment, { foreignKey: 'drawingId', as: 'comments' });
Comment.belongsTo(Drawing, { foreignKey: 'drawingId', as: 'drawing' });

Drawing.hasMany(Like, { foreignKey: 'drawingId', as: 'likes' });
Like.belongsTo(Drawing, { foreignKey: 'drawingId', as: 'drawing' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');
    
    await createSampleData();
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
};

const createSampleData = async () => {
  try {
    const userCount = await User.count();
    const locationCount = await Location.count();
    
    if (userCount === 0) {
      await User.bulkCreate([
        {
          username: 'ArtExplorer',
          displayName: 'Creative Soul',
          description: 'Exploring digital art and collaboration',
          followerCount: 45,
          postCount: 12,
          isGuest: false
        },
        {
          username: 'DoodleMaster', 
          displayName: 'Sketch Artist',
          description: 'Love collaborative drawing sessions!',
          followerCount: 89,
          postCount: 23,
          isGuest: false
        }
      ]);
      console.log('✅ Sample users created');
    }
    
    if (locationCount === 0) {
      await Location.bulkCreate([
        {
          name: 'Advanced Engineering Building',
          buildingCode: '49',
          latitude: -27.4975,
          longitude: 153.0135,
          activeUsers: 3,
          totalDrawings: 15,
          description: 'Popular spot for engineering students'
        },
        {
          name: 'Learning Innovation Building',
          buildingCode: '17', 
          latitude: -27.4960,
          longitude: 153.0128,
          activeUsers: 5,
          totalDrawings: 27,
          description: 'Creative learning space'
        },
        {
          name: 'Prentice Building',
          buildingCode: '42',
          latitude: -27.4990,
          longitude: 153.0150,
          activeUsers: 7,
          totalDrawings: 34,
          description: 'Arts and humanities hub'
        }
      ]);
      console.log('✅ Sample locations created');
    }
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

syncDatabase();

module.exports = {
  User,
  Location,
  DrawingSession,
  Drawing,
  Comment,
  Like,
  Follow,
  DrawingParticipant,
  sequelize
};