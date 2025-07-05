export default function rewards(
  app,
  prisma,
  {
    pickLang,
    normalizeNameTranslations,
    LANGS,
    DEFAULT_LANGUAGE,
    isValidCuid,
    sanitizeString,
    isValidUrl,
  }
) {
  /**
   * @swagger
   * /rewards:
   *   get:
   *     summary: Получить все награды
   *     parameters:
   *       - in: query
   *         name: lang
   *         schema:
   *           type: string
   *           enum: [en, ru, tr, fr, de, ar, gr]
   *         description: Код языка для переводов
   *     responses:
   *       200:
   *         description: OK
   *   post:
   *     summary: Создать награду
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [badge, bonus_crypto, discount_commission, cat_accessories, visual_effects]
   *               title:
   *                 type: string
   *               description:
   *                 type: object
   *                 description: Объект с переводами описания
   *               icon:
   *                 type: string
   *               isApplicable:
   *                 type: boolean
   *               details:
   *                 type: object
   *               achievementId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Created
   * /rewards/{id}:
   *   get:
   *     summary: Получить награду по ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: lang
   *         schema:
   *           type: string
   *           enum: [en, ru, tr, fr, de, ar, gr]
   *         description: Код языка для переводов
   *     responses:
   *       200:
   *         description: OK
   *       404:
   *         description: Reward not found
   *   patch:
   *     summary: Обновить награду
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
   *               type:
   *                 type: string
   *                 enum: [badge, bonus_crypto, discount_commission, cat_accessories, visual_effects]
   *               description:
   *                 type: object
   *                 description: Объект с переводами описания
   *               icon:
   *                 type: string
   *               isApplicable:
   *                 type: boolean
   *               details:
   *                 type: object
   *               achievementId:
   *                 type: string
   *     responses:
   *       200:
   *         description: OK
   *   delete:
   *     summary: Удалить награду
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
  /* ─────────── GET /rewards ─────────── */
  app.get("/rewards", async (req, res) => {
    try {
      const { lang } = req.query; // ?lang=ru
      const rows = await prisma.reward.findMany({
        include: { achievement: true },
      });

      const rewards = rows.map((r) => ({
        ...r,
        title: lang ? pickLang(r.title, lang) : toFull(r.title),
        description: lang
          ? pickLang(r.description, lang)
          : toFull(r.description),
      }));

      res.json(rewards);
    } catch (err) {
      console.error("GET /rewards:", err);
      res.status(500).json({ error: err.message });
    }
  });

  /* ─────────── GET /rewards/:id ─────────── */
  app.get("/rewards/:id", async (req, res) => {
    try {
      const { lang } = req.query;
      const row = await prisma.reward.findUnique({
        where: { id: req.params.id },
        include: { achievement: true },
      });
      if (!row) return res.status(404).json({ error: "Reward not found" });

      const reward = {
        ...row,
        title: lang ? pickLang(row.title, lang) : toFull(row.title),
        description: lang
          ? pickLang(row.description, lang)
          : toFull(row.description),
      };

      res.json(reward);
    } catch (err) {
      console.error("GET /rewards/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/rewards", async (req, res) => {
    try {
      const {
        type,
        title,
        description,
        icon,
        isApplicable,
        details,
        achievementId,
      } = req.body;

      // Валидация обязательных полей
      if (!type || !title || !description || !achievementId) {
        return res.status(400).json({
          error:
            "type, title, description и achievementId являются обязательными полями",
        });
      }

      // Валидация типа награды
      const validRewardTypes = [
        "badge",
        "bonus_crypto",
        "discount_commission",
        "cat_accessories",
        "visual_effects",
      ];
      if (!validRewardTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid reward type. Must be one of: ${validRewardTypes.join(
            ", "
          )}`,
          receivedType: type,
        });
      }

      // Валидация achievementId
      if (!isValidCuid(achievementId)) {
        return res.status(400).json({
          error: "Invalid achievementId format",
        });
      }

      // Проверка существования достижения
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        return res.status(404).json({
          error: "Achievement not found",
        });
      }

      // Проверка, что у достижения еще нет награды
      const existingReward = await prisma.reward.findUnique({
        where: { achievementId },
      });

      if (existingReward) {
        return res.status(409).json({
          error: "Achievement already has a reward",
        });
      }

      // Валидация icon (если передан)
      if (icon && !isValidUrl(icon) && icon.length > 100) {
        return res.status(400).json({
          error: "icon должен быть валидным URL или эмодзи",
        });
      }

      // Валидация details (если передан)
      if (details && (typeof details !== "object" || Array.isArray(details))) {
        return res.status(400).json({
          error: "details должен быть объектом",
        });
      }

      // Конвертируем строки в объекты переводов
      const titleTranslations =
        typeof title === "string" ? { [DEFAULT_LANGUAGE]: title } : title;

      const descriptionTranslations =
        typeof description === "string"
          ? { [DEFAULT_LANGUAGE]: description }
          : description;

      // Проверяем, что хотя бы один перевод не пустой
      const titleNormalized = normalizeNameTranslations(titleTranslations);
      const descriptionNormalized = normalizeNameTranslations(
        descriptionTranslations
      );

      const hasValidTitle = LANGS.some(
        (lang) => titleNormalized[lang].trim().length > 0
      );
      const hasValidDescription = LANGS.some(
        (lang) => descriptionNormalized[lang].trim().length > 0
      );

      if (!hasValidTitle) {
        return res.status(400).json({
          error: "At least one title translation must be provided",
        });
      }

      if (!hasValidDescription) {
        return res.status(400).json({
          error: "At least one description translation must be provided",
        });
      }

      const reward = await prisma.reward.create({
        data: {
          type,
          title: titleNormalized,
          description: descriptionNormalized,
          icon: icon ? sanitizeString(icon) : null,
          isApplicable: Boolean(isApplicable),
          details: details || {},
          achievementId,
        },
        include: {
          achievement: true,
        },
      });
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error in POST /rewards:", error);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.patch("/rewards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        type,
        title,
        description,
        icon,
        isApplicable,
        details,
        achievementId,
      } = req.body;

      // Валидация типа награды
      const validRewardTypes = [
        "badge",
        "bonus_crypto",
        "discount_commission",
        "cat_accessories",
        "visual_effects",
      ];
      if (type && !validRewardTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid reward type. Must be one of: ${validRewardTypes.join(
            ", "
          )}`,
          receivedType: type,
        });
      }

      // Конвертируем строки в объекты переводов
      const titleTranslations =
        typeof title === "string" ? { [DEFAULT_LANGUAGE]: title } : title;

      const descriptionTranslations =
        typeof description === "string"
          ? { [DEFAULT_LANGUAGE]: description }
          : description;

      const reward = await prisma.reward.update({
        where: { id },
        data: {
          type,
          title: titleTranslations,
          description: descriptionTranslations,
          icon,
          isApplicable,
          details,
          achievementId,
        },
        include: {
          achievement: true,
        },
      });

      res.json(reward);
    } catch (error) {
      console.error("Error in PATCH /rewards/:id:", error);
      console.error("Request body:", req.body);
      console.error("Request params:", req.params);
      res.status(500).json({
        error: error.message,
        details: error.stack,
        requestBody: req.body,
      });
    }
  });

  app.delete("/rewards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.reward.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
