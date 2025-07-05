export default function achievments(
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
   * /achievements:
   *   get:
   *     summary: Получить все достижения
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
   *     summary: Создать достижение
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: object
   *                 description: Объект с переводами заголовка
   *               description:
   *                 type: object
   *                 description: Объект с переводами описания
   *               icon:
   *                 type: string
   *               hidden:
   *                 type: boolean
   *               target:
   *                 type: integer
   *               categoryId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Created
   * /achievements/{id}:
   *   get:
   *     summary: Получить достижение по ID
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
   *         description: Achievement not found
   *   patch:
   *     summary: Обновить достижение
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
   *               title:
   *                 type: object
   *                 description: Объект с переводами заголовка
   *               description:
   *                 type: object
   *                 description: Объект с переводами описания
   *               icon:
   *                 type: string
   *               hidden:
   *                 type: boolean
   *               target:
   *                 type: integer
   *               categoryId:
   *                 type: string
   *     responses:
   *       200:
   *         description: OK
   *   delete:
   *     summary: Удалить достижение
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

  const toFull = (obj) => {
    if (typeof obj !== "object" || obj === null) obj = {};
    return Object.fromEntries(LANGS.map((l) => [l, obj[l] ?? ""]));
  };

  app.get("/achievements", async (req, res) => {
    try {
      const { lang } = req.query; // ?lang=ru
      const rows = await prisma.achievement.findMany({
        include: {
          category: true,
          reward: true,
          progress: true,
        },
      });

      const achievements = rows.map((a) => ({
        ...a,
        title: lang ? pickLang(a.title, lang) : toFull(a.title),
        description: lang
          ? pickLang(a.description, lang)
          : toFull(a.description),
      }));

      res.json(achievements);
    } catch (err) {
      console.error("GET /achievements:", err);
      res.status(500).json({ error: err.message });
    }
  });

  /* ──────────── GET /achievements/:id ──────────── */
  app.get("/achievements/:id", async (req, res) => {
    try {
      const { lang } = req.query;
      const row = await prisma.achievement.findUnique({
        where: { id: req.params.id },
        include: {
          category: true,
          reward: true,
          progress: true,
        },
      });
      if (!row) return res.status(404).json({ error: "Achievement not found" });

      const achievement = {
        ...row,
        title: lang ? pickLang(row.title, lang) : toFull(row.title),
        description: lang
          ? pickLang(row.description, lang)
          : toFull(row.description),
      };

      res.json(achievement);
    } catch (err) {
      console.error("GET /achievements/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/achievements", async (req, res) => {
    try {
      const { title, description, icon, hidden, target, categoryId } = req.body;

      // Валидация обязательных полей
      if (!title || !description || !categoryId) {
        return res.status(400).json({
          error:
            "title, description и categoryId являются обязательными полями",
        });
      }

      // Валидация categoryId
      if (!isValidCuid(categoryId)) {
        return res.status(400).json({
          error: "Invalid categoryId format",
        });
      }

      // Проверка существования категории
      const category = await prisma.achievementCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      // Валидация target
      if (target !== undefined && (typeof target !== "number" || target < 0)) {
        return res.status(400).json({
          error: "target должен быть неотрицательным числом",
        });
      }

      // Валидация icon (если передан)
      if (icon && !isValidUrl(icon) && icon.length > 100) {
        return res.status(400).json({
          error: "icon должен быть валидным URL или эмодзи",
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

      const achievement = await prisma.achievement.create({
        data: {
          title: titleNormalized,
          description: descriptionNormalized,
          icon: icon ? sanitizeString(icon) : null,
          hidden: Boolean(hidden),
          target: target || null,
          categoryId,
        },
        include: {
          category: true,
        },
      });
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Error in POST /achievements:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/achievements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, icon, hidden, target, categoryId } = req.body;

      // Конвертируем строки в объекты переводов
      const titleTranslations =
        typeof title === "string" ? { [DEFAULT_LANGUAGE]: title } : title;

      const descriptionTranslations =
        typeof description === "string"
          ? { [DEFAULT_LANGUAGE]: description }
          : description;

      const achievement = await prisma.achievement.update({
        where: { id },
        data: {
          title: titleTranslations,
          description: descriptionTranslations,
          icon,
          hidden,
          target,
          categoryId,
        },
        include: {
          category: true,
        },
      });

      res.json(achievement);
    } catch (error) {
      console.error("Error in PATCH /achievements/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/achievements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.achievement.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
