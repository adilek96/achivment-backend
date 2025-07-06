export default function progress(
  app,
  prisma,
  { pickLang, normalizeNameTranslations, isValidCuid },
  clients
) {
  /**
   * @swagger
   * /progress:
   *   get:
   *     summary: Получить прогресс пользователей
   *     responses:
   *       200:
   *         description: OK
   *   post:
   *     summary: Создать прогресс пользователя
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               achievementId:
   *                 type: string
   *               progress:
   *                 type: string
   *                 enum: [INPROGRESS, BLOCKED, FINISHED]
   *               currentStep:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Created
   * /progress/user/{userId}:
   *   get:
   *     summary: Получить прогресс конкретного пользователя
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: OK
   * /progress/user/{id}:
   *   get:
   *     summary: Получить прогресс конкретного пользователя по ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID пользователя
   *     responses:
   *       200:
   *         description: Массив прогресса пользователя
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   userId:
   *                     type: string
   *                   achievementId:
   *                     type: string
   *                   progress:
   *                     type: string
   *                     enum: [INPROGRESS, BLOCKED, FINISHED]
   *                   currentStep:
   *                     type: integer
   *                   achievement:
   *                     type: object
   *       404:
   *         description: Пользователь не найден
   *       500:
   *         description: Ошибка сервера
   * /progress/{id}:
   *   patch:
   *     summary: Обновить прогресс
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               achievementId:
   *                 type: string
   *               progress:
   *                 type: string
   *                 enum: [INPROGRESS, BLOCKED, FINISHED]
   *               currentStep:
   *                 type: integer
   *     responses:
   *       200:
   *         description: OK
   *   delete:
   *     summary: Удалить прогресс пользователя
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: No Content
   */
  app.get("/progress", async (req, res) => {
    try {
      const progress = await prisma.userAchievementProgress.findMany({
        include: {
          achievement: true,
        },
      });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/progress/user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const progress = await prisma.userAchievementProgress.findMany({
        where: { userId: id },
        include: {
          achievement: true,
        },
      });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/progress/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const progress = await prisma.userAchievementProgress.findUnique({
        where: { id },
        include: {
          achievement: true,
        },
      });
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/progress", async (req, res) => {
    try {
      const lang = req.query.lang;
      const { userId, achievementId, progress, currentStep } = req.body;

      // Валидация обязательных полей
      if (!userId || !achievementId) {
        return res.status(400).json({
          error: "userId и achievementId являются обязательными полями",
        });
      }

      // Валидация типов данных
      if (typeof userId !== "string" || typeof achievementId !== "string") {
        return res.status(400).json({
          error: "userId и achievementId должны быть строками",
        });
      }

      if (
        currentStep !== undefined &&
        (typeof currentStep !== "number" || currentStep < 0)
      ) {
        return res.status(400).json({
          error: "currentStep должен быть неотрицательным числом",
        });
      }

      // Валидация enum значений
      const validProgressValues = ["INPROGRESS", "BLOCKED", "FINISHED"];
      if (progress && !validProgressValues.includes(progress)) {
        return res.status(400).json({
          error: `Invalid progress value. Must be one of: ${validProgressValues.join(
            ", "
          )}`,
        });
      }

      // Проверка существования достижения
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
      });
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }

      // Проверка на существующую запись прогресса
      const existingProgress = await prisma.userAchievementProgress.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
      });

      if (existingProgress) {
        return res.status(409).json({
          error: "Progress record already exists for this user and achievement",
          existingProgress,
        });
      }

      // Определение правильного статуса прогресса
      let finalProgress = "INPROGRESS";
      let finalCurrentStep = currentStep || 0;

      // Если передан BLOCKED, сохраняем его
      if (progress === "BLOCKED") {
        finalProgress = "BLOCKED";
      } else {
        // Проверяем, достигнута ли цель
        if (
          achievement.target === 0 ||
          finalCurrentStep >= achievement.target
        ) {
          finalProgress = "FINISHED";
          // Убеждаемся, что currentStep не превышает target
          if (achievement.target > 0) {
            finalCurrentStep = Math.min(finalCurrentStep, achievement.target);
          }
        } else if (progress === "FINISHED") {
          // Если пользователь явно указывает FINISHED, но цель не достигнута
          return res.status(400).json({
            error: "Cannot set progress to FINISHED when target is not reached",
            currentStep: finalCurrentStep,
            target: achievement.target,
          });
        }
      }

      const row = await prisma.userAchievementProgress.create({
        data: {
          userId,
          achievementId,
          progress: finalProgress,
          currentStep: finalCurrentStep,
        },
        include: {
          achievement: {
            include: {
              reward: true,
            },
          },
        },
      });

      // Локализуем данные достижения и награды
      const progressRecord = {
        ...row,
        achievement: {
          ...row.achievement,
          title: lang
            ? pickLang(row.achievement.title, lang)
            : normalizeNameTranslations(row.achievement.title),
          description: lang
            ? pickLang(row.achievement.description, lang)
            : normalizeNameTranslations(row.achievement.description),
          reward: row.achievement.reward
            ? {
                ...row.achievement.reward,
                title: lang
                  ? pickLang(row.achievement.reward.title, lang)
                  : normalizeNameTranslations(row.achievement.reward.title),
                description: lang
                  ? pickLang(row.achievement.reward.description, lang)
                  : normalizeNameTranslations(
                      row.achievement.reward.description
                    ),
              }
            : null,
        },
      };

      // clients.find(({ id, res }) => {
      //   if (id === userId.toString()) {
      //     console.log(id, userId);
      //     res.write(
      //       `event: progress\ndata: ${JSON.stringify(progressRecord)}\n\n`
      //     );
      //   }
      // });
      const client = clients.find((c) => c.id === userId.toString());
      if (client) {
        console.log("Отправляем SSE клиенту:", client.id);
        client.res.write(
          `event: progress\n` + `data: ${JSON.stringify(progressRecord)}\n\n`
        );
        client.res.write(`event: work\n` + `data: work\n\n`);
      }

      res.status(201).json(progressRecord);
    } catch (error) {
      console.error("Error in POST /progress:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/progress/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lang = req.query.lang;
      const { userId, achievementId, progress, currentStep } = req.body;

      // Валидация ID
      if (!id) {
        return res.status(400).json({
          error: "ID является обязательным параметром",
        });
      }

      // Валидация типов данных
      if (userId !== undefined && typeof userId !== "string") {
        return res.status(400).json({
          error: "userId должен быть строкой",
        });
      }

      if (achievementId !== undefined && typeof achievementId !== "string") {
        return res.status(400).json({
          error: "achievementId должен быть строкой",
        });
      }

      if (
        currentStep !== undefined &&
        (typeof currentStep !== "number" || currentStep < 0)
      ) {
        return res.status(400).json({
          error: "currentStep должен быть неотрицательным числом",
        });
      }

      // Валидация enum значений
      const validProgressValues = ["INPROGRESS", "BLOCKED", "FINISHED"];
      if (progress && !validProgressValues.includes(progress)) {
        return res.status(400).json({
          error: `Invalid progress value. Must be one of: ${validProgressValues.join(
            ", "
          )}`,
        });
      }

      // Проверка существования записи прогресса
      const existingProgress = await prisma.userAchievementProgress.findUnique({
        where: { id },
        include: {
          achievement: {
            include: {
              reward: true,
            },
          },
        },
      });

      if (!existingProgress) {
        return res.status(404).json({ error: "Progress record not found" });
      }

      // Если указан achievementId, проверяем его существование
      let achievement = existingProgress.achievement;
      if (achievementId && achievementId !== existingProgress.achievementId) {
        achievement = await prisma.achievement.findUnique({
          where: { id: achievementId },
        });
        if (!achievement) {
          return res.status(404).json({ error: "Achievement not found" });
        }
      }

      // Определение правильного статуса прогресса
      let finalProgress = existingProgress.progress;
      let finalCurrentStep =
        currentStep !== undefined ? currentStep : existingProgress.currentStep;

      // Если передан BLOCKED, сохраняем его
      if (progress === "BLOCKED") {
        finalProgress = "BLOCKED";
      } else if (progress) {
        // Проверяем, достигнута ли цель для FINISHED
        if (progress === "FINISHED") {
          if (achievement.target > 0 && finalCurrentStep < achievement.target) {
            return res.status(400).json({
              error:
                "Cannot set progress to FINISHED when target is not reached",
              currentStep: finalCurrentStep,
              target: achievement.target,
            });
          }
          finalProgress = "FINISHED";
        } else if (progress === "INPROGRESS") {
          // Проверяем, не достигнута ли уже цель
          if (
            achievement.target > 0 &&
            finalCurrentStep >= achievement.target
          ) {
            finalProgress = "FINISHED";
          } else {
            finalProgress = "INPROGRESS";
          }
        }
      } else {
        // Если progress не передан, определяем автоматически
        if (
          achievement.target === 0 ||
          finalCurrentStep >= achievement.target
        ) {
          finalProgress = "FINISHED";
          // Убеждаемся, что currentStep не превышает target
          if (achievement.target > 0) {
            finalCurrentStep = Math.min(finalCurrentStep, achievement.target);
          }
        } else {
          finalProgress = "INPROGRESS";
        }
      }

      const row = await prisma.userAchievementProgress.update({
        where: { id },
        data: {
          userId: userId || existingProgress.userId,
          achievementId: achievementId || existingProgress.achievementId,
          progress: finalProgress,
          currentStep: finalCurrentStep,
        },
        include: {
          achievement: {
            include: {
              reward: true,
            },
          },
        },
      });

      // Локализуем данные достижения и награды
      const progressRecord = {
        ...row,
        achievement: {
          ...row.achievement,
          title: lang
            ? pickLang(row.achievement.title, lang)
            : normalizeNameTranslations(row.achievement.title),
          description: lang
            ? pickLang(row.achievement.description, lang)
            : normalizeNameTranslations(row.achievement.description),
          reward: row.achievement.reward
            ? {
                ...row.achievement.reward,
                title: lang
                  ? pickLang(row.achievement.reward.title, lang)
                  : normalizeNameTranslations(row.achievement.reward.title),
                description: lang
                  ? pickLang(row.achievement.reward.description, lang)
                  : normalizeNameTranslations(
                      row.achievement.reward.description
                    ),
              }
            : null,
        },
      };
      // clients.find(({ id, res }) => {
      //   if (id === userId.toString()) {
      //     console.log(id, userId);
      //     res.write(
      //       `event: progress\ndata: ${JSON.stringify(progressRecord)}\n\n`
      //     );
      //   }
      // });

      const client = clients.find((c) => c.id === userId.toString());
      if (client) {
        console.log("Отправляем SSE клиенту:", client.id);
        client.res.write(
          `event: progress\n` + `data: ${JSON.stringify(progressRecord)}\n\n`
        );
        client.res.write(`event: work\n` + `data: work\n\n`);
      }

      res.json(progressRecord);
    } catch (error) {
      console.error("Error in PATCH /progress/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/progress/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id) {
        return res.status(400).json({
          error: "ID является обязательным параметром",
        });
      }

      // Проверка существования записи перед удалением
      const existingProgress = await prisma.userAchievementProgress.findUnique({
        where: { id },
      });

      if (!existingProgress) {
        return res.status(404).json({ error: "Progress record not found" });
      }

      await prisma.userAchievementProgress.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error in DELETE /progress/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/progress/user/:id/:achievementId", async (req, res) => {
    try {
      const { id, achievementId } = req.params;
      const lang = req.query.lang;

      // Валидация параметров
      if (!id || !achievementId) {
        return res.status(400).json({
          error:
            "ID пользователя и ID достижения являются обязательными параметрами",
        });
      }

      // Проверка существования достижения
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        return res.status(404).json({
          error: "Achievement not found",
          status: false,
        });
      }

      const row = await prisma.userAchievementProgress.findFirst({
        where: { userId: id, achievementId },
        include: {
          achievement: {
            include: {
              reward: true,
            },
          },
        },
      });

      if (!row) {
        return res.json({
          status: false,
          message: "Progress not found",
          userId: id,
          achievementId: achievementId,
        });
      }

      // Локализуем данные достижения и награды
      const progress = {
        ...row,
        achievement: {
          ...row.achievement,
          title: lang
            ? pickLang(row.achievement.title, lang)
            : normalizeNameTranslations(row.achievement.title),
          description: lang
            ? pickLang(row.achievement.description, lang)
            : normalizeNameTranslations(row.achievement.description),
          reward: row.achievement.reward
            ? {
                ...row.achievement.reward,
                title: lang
                  ? pickLang(row.achievement.reward.title, lang)
                  : normalizeNameTranslations(row.achievement.reward.title),
                description: lang
                  ? pickLang(row.achievement.reward.description, lang)
                  : normalizeNameTranslations(
                      row.achievement.reward.description
                    ),
              }
            : null,
        },
      };

      res.json({ progress, status: true });
    } catch (error) {
      console.error("Error in GET /progress/user/:id/:achievementId:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
