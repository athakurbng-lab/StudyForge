import prisma from './prisma';

/**
 * Lazily checks and decays streaks on page load if days were missed.
 * If freeze tokens are available, they are automatically consumed to protect the streak.
 * Otherwise, the streak decays to 0.
 */
export async function evaluateLazyStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, streak: true, freezeTokens: true, lastStudiedAt: true }
  });

  if (!user || user.streak === 0 || !user.lastStudiedAt) {
    return user;
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const lastMidnight = new Date(user.lastStudiedAt);
  lastMidnight.setHours(0, 0, 0, 0);

  const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    const missedDays = diffDays - 1;
    if (user.freezeTokens >= missedDays) {
      // Freeze tokens protect the streak! Advance lastStudiedAt to yesterday.
      const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);
      return await prisma.user.update({
        where: { id: userId },
        data: {
          freezeTokens: { decrement: missedDays },
          lastStudiedAt: yesterdayMidnight
        }
      });
    } else {
      // Streak broken
      return await prisma.user.update({
        where: { id: userId },
        data: { streak: 0 }
      });
    }
  }

  return user;
}

/**
 * Evaluates streak progression, freeze token consumption/awards, and badge unlocks upon logging a session.
 */
export async function processSessionStreakAndBadges(userId: string, netXpChange: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  let newStreak = user.streak;
  let longestStreak = user.longestStreak;
  let tokensUsed = 0;

  const now = new Date();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  if (user.lastStudiedAt) {
    const lastMidnight = new Date(user.lastStudiedAt);
    lastMidnight.setHours(0, 0, 0, 0);

    const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day!
      newStreak += 1;
      longestStreak = Math.max(longestStreak, newStreak);
    } else if (diffDays > 1) {
      // Missed days
      const missedDays = diffDays - 1;
      if (user.freezeTokens >= missedDays) {
        tokensUsed = missedDays;
        newStreak += 1;
        longestStreak = Math.max(longestStreak, newStreak);
      } else {
        newStreak = 1;
      }
    }
    // If diffDays === 0, session was already logged today; streak stays as is.
  } else {
    // Very first session!
    newStreak = 1;
    longestStreak = 1;
  }

  // Milestone freeze token rewards
  let tokensAwarded = 0;
  if (newStreak === 7) tokensAwarded += 1;
  else if (newStreak === 14) tokensAwarded += 1;
  else if (newStreak === 30) tokensAwarded += 2;
  else if (newStreak === 60) tokensAwarded += 2;
  else if (newStreak === 100) tokensAwarded += 3;

  const finalFreezeTokens = Math.max(0, user.freezeTokens - tokensUsed + tokensAwarded);

  // Update user with new streak, XP, tokens, and lastStudiedAt
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: Math.max(0, user.totalXP + netXpChange),
      lastStudiedAt: now,
      streak: newStreak,
      longestStreak,
      freezeTokens: finalFreezeTokens
    }
  });

  // Check and unlock badges
  const eligibleBadgeSlugs: string[] = ['first-step'];
  if (newStreak >= 3) eligibleBadgeSlugs.push('consistent');
  if (newStreak >= 7) eligibleBadgeSlugs.push('week-warrior');
  if (newStreak >= 30) eligibleBadgeSlugs.push('iron-will');
  if (newStreak >= 100) eligibleBadgeSlugs.push('century');
  if (user.totalXP + netXpChange >= 1000) eligibleBadgeSlugs.push('elite');

  const currentHour = now.getHours();
  if (currentHour >= 23 || currentHour < 4) eligibleBadgeSlugs.push('night-owl');
  if (currentHour >= 4 && currentHour < 6) eligibleBadgeSlugs.push('early-bird');

  for (const slug of eligibleBadgeSlugs) {
    const badge = await prisma.badge.findUnique({ where: { slug } });
    if (badge) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        create: { userId, badgeId: badge.id },
        update: {}
      });
    }
  }
}
