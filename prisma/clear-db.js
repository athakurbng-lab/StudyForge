const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🔄 Starting complete database wipe for fresh start...');

  const tableNames = [
    'SessionAccessRequest',
    'Watcher',
    'StudySession',
    'MessageReaction',
    'Message',
    'Announcement',
    'JoinRequest',
    'GroupMember',
    'Group',
    'ScoreChallenge',
    'ChallengeToken',
    'UserBadge',
    'SavedQuote',
    'Notification',
    'WeeklyReport',
    'User',
  ];

  for (const table of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`✅ Cleared table: ${table}`);
    } catch (err) {
      console.log(`⚠️ Note on ${table}: ${err.message}`);
    }
  }

  console.log('\n✨ All tables successfully wiped!');
}

clearDatabase()
  .catch((e) => {
    console.error('❌ Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
