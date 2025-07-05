export default function health(app, prisma) {
  // Health check endpoint
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Проверка состояния приложения
   *     responses:
   *       200:
   *         description: OK
   */
  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /health/db:
   *   get:
   *     summary: Проверка подключения к базе данных
   *     responses:
   *       200:
   *         description: OK
   */
  app.get("/health/db", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "OK", database: "connected" });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        database: "disconnected",
        error: error.message,
      });
    }
  });
}
