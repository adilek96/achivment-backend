export default function stats(app, prisma) {
  /**
   * @swagger
   * /api/stats:
   *   get:
   *     summary: Получить статистику API
   *     responses:
   *       200:
   *         description: Статистика системы
   */
  app.get("/api/stats", async (req, res) => {
    try {
      const [
        categoriesCount,
        achievementsCount,
        rewardsCount,
        progressCount,
        completedProgress,
        inProgressCount,
        blockedProgress,
        hiddenAchievements,
        visibleAchievements,
        applicableRewards,
      ] = await Promise.all([
        prisma.achievementCategory.count(),
        prisma.achievement.count(),
        prisma.reward.count(),
        prisma.userAchievementProgress.count(),
        prisma.userAchievementProgress.count({
          where: { progress: "FINISHED" },
        }),
        prisma.userAchievementProgress.count({
          where: { progress: "INPROGRESS" },
        }),
        prisma.userAchievementProgress.count({
          where: { progress: "BLOCKED" },
        }),
        prisma.achievement.count({ where: { hidden: true } }),
        prisma.achievement.count({ where: { hidden: false } }),
        prisma.reward.count({ where: { isApplicable: true } }),
      ]);

      res.json({
        categories: categoriesCount,
        achievements: achievementsCount,
        rewards: rewardsCount,
        progress: progressCount,
        progressStats: {
          completed: completedProgress,
          inProgress: inProgressCount,
          blocked: blockedProgress,
        },
        achievementStats: {
          hidden: hiddenAchievements,
          visible: visibleAchievements,
        },
        rewardStats: {
          applicable: applicableRewards,
          total: rewardsCount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
