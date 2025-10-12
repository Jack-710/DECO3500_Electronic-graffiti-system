const { User, Location, Stream } = require('../models');

const createSampleStreams = async () => {
  try {
    const user = await User.findOne();
    const location = await Location.findOne();
    
    if (!user || !location) {
      console.log('❌ Need users and locations first. Run seedData.js');
      return;
    }

    const streams = await Stream.bulkCreate([
      {
        title: 'Collaborative Art Session',
        creatorId: user.id,
        locationId: location.id,
        isPublic: true,
        participantCount: 3,
        maxParticipants: 8
      },
      {
        title: 'UQ Campus Doodles',
        creatorId: user.id, 
        locationId: location.id,
        isPublic: true,
        participantCount: 1,
        maxParticipants: 5
      }
    ]);

    console.log('✅ Sample streams created successfully!');
    console.log(`📊 Created ${streams.length} streams`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample streams:', error);
    process.exit(1);
  }
};

createSampleStreams();