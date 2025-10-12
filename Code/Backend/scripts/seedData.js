const { User, Location, Stream, Post, Comment } = require('../models');

const seedDatabase = async () => {
  try {
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
        name: 'Physics Annexe',
        buildingCode: '6',
        latitude: -27.4982,
        longitude: 153.0141,
        activeUsers: 2
      },
      {
        name: 'Prentice Building',
        buildingCode: '42',
        latitude: -27.4990,
        longitude: 153.0150,
        activeUsers: 7
      }
    ]);

    const users = await User.bulkCreate([
      { guestId: 'guest_001', username: 'ArtLover', description: 'Digital artist exploring new mediums' },
      { guestId: 'guest_002', username: 'SketchMaster', description: 'Love collaborative drawing!' },
      { guestId: 'guest_003', username: 'DoodleQueen', description: 'Creating one doodle at a time' }
    ]);

    console.log('✅ Sample data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();