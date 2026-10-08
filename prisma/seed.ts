const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Baseline Tasks
  const baselines = [
    { id: 1, description: 'Re-read 1 page of familiar notes', xpAnchor: 5, examContext: 'All' },
    { id: 2, description: 'Watch 10 min intro lecture passively', xpAnchor: 12, examContext: 'All' },
    { id: 3, description: 'Solve 5 basic recall questions', xpAnchor: 18, examContext: 'All' },
    { id: 4, description: 'Watch 30 min standard lecture', xpAnchor: 25, examContext: 'All' },
    { id: 5, description: 'Solve 10 standard MCQs (NCERT level)', xpAnchor: 32, examContext: 'All' },
    { id: 6, description: 'Write 200-word summary from memory', xpAnchor: 40, examContext: 'All' },
    { id: 7, description: 'Solve 10 Reasoning/Quant questions', xpAnchor: 48, examContext: 'SSC, Bank' },
    { id: 8, description: 'Solve 5 application-level problems', xpAnchor: 55, examContext: 'JEE, CAT' },
    { id: 9, description: 'Write 1 UPSC Mains answer (150 words, timed)', xpAnchor: 62, examContext: 'UPSC' },
    { id: 10, description: 'Watch 60 min advanced lecture + structured notes', xpAnchor: 65, examContext: 'All' },
    { id: 11, description: 'Solve 10 previous-year Bank PO/SSC CGL questions', xpAnchor: 70, examContext: 'Bank, SSC' },
    { id: 12, description: 'Full Current Affairs + Static GK revision (50+ facts)', xpAnchor: 72, examContext: 'UPSC, Bank, SSC' },
    { id: 13, description: 'Solve 10 advanced questions (JEE Adv / NEET level)', xpAnchor: 78, examContext: 'JEE, NEET' },
    { id: 14, description: 'Write 2 full UPSC Mains answers (250 words, timed)', xpAnchor: 88, examContext: 'UPSC' },
    { id: 15, description: 'Write 2 timed essays under strict exam conditions', xpAnchor: 95, examContext: 'All' },
  ]

  for (const b of baselines) {
    await prisma.baselineTask.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    })
  }

  // Seed Badges
  const badges = [
    { slug: 'first-step', name: 'First Step', description: 'Log your first study session', icon: '👶', condition: 'first_session' },
    { slug: 'consistent', name: 'Consistent', description: 'Maintain a 3-day study streak', icon: '✨', condition: 'streak_3' },
    { slug: 'week-warrior', name: 'Week Warrior', description: 'Maintain a 7-day study streak', icon: '🔥', condition: 'streak_7' },
    { slug: 'iron-will', name: 'Iron Will', description: 'Maintain a 30-day study streak', icon: '💪', condition: 'streak_30' },
    { slug: 'century', name: 'Century', description: 'Maintain a 100-day study streak', icon: '🏅', condition: 'streak_100' },
    { slug: 'elite', name: 'Elite', description: 'Earn 1,000 total XP', icon: '💎', condition: 'xp_1000' },
    { slug: 'night-owl', name: 'Night Owl', description: 'Log a session after 11 PM', icon: '🦉', condition: 'time_night' },
    { slug: 'early-bird', name: 'Early Bird', description: 'Log a session before 6 AM', icon: '🌅', condition: 'time_early' },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    })
  }

  console.log('Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
