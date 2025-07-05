export default function categories(
  app,
  prisma,
  { pickLang, normalizeNameTranslations, LANGS, isValidCuid, sanitizeString }
) {
  /**
   * @swagger
   * /categories:
   *   get:
   *     summary: Получить все категории
   *     parameters:
   *       - in: query
   *         name: lang
   *         schema:
   *           type: string
   *           enum: [en, ru, tr, fr, de, ar, gr]
   *         description: Код языка для переводов
   *     responses:
   *       200:
   *         description: Список категорий
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Category'
   *             example:
   *               - id: "cmcdbzw5c0000lzgwqdktz0zl"
   *                 key: "begin"
   *                 name:
   *                   en: "Beginner"
   *                   ru: "Начинающий"
   *                 achievements:
   *                   - id: "cmcdbzw5c0000lzgwqdktz0zl"
   *                     title:
   *                       en: "First Achievement"
   *                       ru: "Первое достижение"
   *                     description:
   *                       en: "Complete your first task"
   *                       ru: "Выполните первое задание"
   *                     icon: "🎯"
   *                     hidden: false
   *                     target: 1
   *                     categoryId: "cmcdbzw5c0000lzgwqdktz0zl"
   *                     reward:
   *                       id: "cmcdbzw5c0000lzgwqdktz0zl"
   *                       type: "badge"
   *                       title:
   *                         en: "First Badge"
   *                         ru: "Первый значок"
   *                       description:
   *                         en: "Your first achievement badge"
   *                         ru: "Ваш первый значок достижения"
   *                       icon: "🏆"
   *                       isApplicable: true
   *                       details: {}
   *                       achievementId: "cmcdbzw5c0000lzgwqdktz0zl"
   *   post:
   *     summary: Создать категорию
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - key
   *               - name
   *             properties:
   *               key:
   *                 type: string
   *                 description: Уникальный ключ категории
   *                 example: "beginner"
   *               name:
   *                 type: object
   *                 description: Объект с переводами названия
   *                 example:
   *                   en: "Beginner"
   *                   ru: "Начинающий"
   *                   tr: "Başlangıç"
   *     responses:
   *       201:
   *         description: Категория создана
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       400:
   *         description: Неверные данные
   *       500:
   *         description: Ошибка сервера
   * /categories/{id}:
   *   get:
   *     summary: Получить категорию по ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID категории
   *       - in: query
   *         name: lang
   *         schema:
   *           type: string
   *           enum: [en, ru, tr, fr, de, ar, gr]
   *         description: Код языка для переводов
   *     responses:
   *       200:
   *         description: Категория найдена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       404:
   *         description: Категория не найдена
   *   patch:
   *     summary: Обновить категорию
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID категории
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               key:
   *                 type: string
   *                 description: Уникальный ключ категории
   *               name:
   *                 type: object
   *                 description: Объект с переводами названия
   *                 example:
   *                   en: "Beginner"
   *                   ru: "Начинающий"
   *                   tr: "Başlangıç"
   *     responses:
   *       200:
   *         description: Категория обновлена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       404:
   *         description: Категория не найдена
   *   delete:
   *     summary: Удалить категорию
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID категории
   *     responses:
   *       204:
   *         description: Категория удалена
   *       404:
   *         description: Категория не найдена
   */
  app.get("/categories", async (req, res) => {
    try {
      const lang = req.query.lang; // ?lang=ru

      const rows = await prisma.achievementCategory.findMany({
        include: {
          achievements: { include: { reward: true } },
        },
      });
      // ── 3. Локализуем всё нужное ───────────────────────
      const categories = rows.map((row) => ({
        ...row,

        // name категории
        name: lang
          ? pickLang(row.name, lang)
          : normalizeNameTranslations(row.name),

        // title + description у достижений
        achievements: row.achievements.map((ach) => ({
          ...ach,
          title: lang
            ? pickLang(ach.title, lang)
            : normalizeNameTranslations(ach.title),
          description: lang
            ? pickLang(ach.description, lang)
            : normalizeNameTranslations(ach.description),

          reward: ach.reward
            ? {
                ...ach.reward,
                title: lang
                  ? pickLang(ach.reward.title, lang)
                  : normalizeNameTranslations(ach.reward.title),
                description: lang
                  ? pickLang(ach.reward.description, lang)
                  : normalizeNameTranslations(ach.reward.description),
              }
            : null,
        })),
      }));

      res.json(categories);
    } catch (err) {
      console.error("GET /categories:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/categories/:id", async (req, res) => {
    try {
      // 1 ⟶ нормализуем язык ("ru‑RU" → "ru")
      const rawLang = req.query.lang;
      const lang = rawLang?.split(/[-_]/)[0]?.toLowerCase();

      // 2 ⟶ берём категорию вместе с достижениями
      const row = await prisma.achievementCategory.findUnique({
        where: { id: req.params.id },
        include: { achievements: { include: { reward: true } } },
      });
      if (!row) return res.status(404).json({ error: "Category not found" });

      // 3 ⟶ локализуем всё нужное
      const category = {
        ...row,
        name: lang
          ? pickLang(row.name, lang)
          : normalizeNameTranslations(row.name),

        achievements: row.achievements.map((ach) => ({
          ...ach,
          title: lang
            ? pickLang(ach.title, lang)
            : normalizeNameTranslations(ach.title),
          description: lang
            ? pickLang(ach.description, lang)
            : normalizeNameTranslations(ach.description),

          reward: ach.reward
            ? {
                ...ach.reward,
                title: lang
                  ? pickLang(ach.reward.title, lang)
                  : normalizeNameTranslations(ach.reward.title),
                description: lang
                  ? pickLang(ach.reward.description, lang)
                  : normalizeNameTranslations(ach.reward.description),
              }
            : null,
        })),
      };

      res.json(category);
    } catch (err) {
      console.error("GET /categories/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/categories", async (req, res) => {
    try {
      const { key, name } = req.body;

      // Валидация обязательных полей
      if (!key || !name) {
        return res.status(400).json({
          error: "key и name являются обязательными полями",
        });
      }

      // Валидация и санитизация key
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey.length < 2 || sanitizedKey.length > 50) {
        return res.status(400).json({
          error: "key должен быть от 2 до 50 символов",
        });
      }

      // Проверка уникальности key
      const existingCategory = await prisma.achievementCategory.findUnique({
        where: { key: sanitizedKey },
      });

      if (existingCategory) {
        return res.status(409).json({
          error: "Category with this key already exists",
        });
      }

      // Валидация и нормализация переводов
      const nameTranslations = normalizeNameTranslations(name);

      // Проверяем, что хотя бы один перевод не пустой
      const hasValidTranslation = LANGS.some(
        (lang) => nameTranslations[lang].trim().length > 0
      );
      if (!hasValidTranslation) {
        return res.status(400).json({
          error: "At least one translation must be provided",
        });
      }

      const category = await prisma.achievementCategory.create({
        data: {
          key: sanitizedKey,
          name: nameTranslations,
        },
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Error in POST /categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { key, name } = req.body;
      console.log("[PATCH /categories/:id] req.body:", req.body);
      const nameTranslations = normalizeNameTranslations(name);
      console.log(
        "[PATCH /categories/:id] nameTranslations:",
        nameTranslations
      );
      const category = await prisma.achievementCategory.update({
        where: { id },
        data: { key, name: nameTranslations },
      });
      res.json(category);
    } catch (error) {
      console.error("Error in PATCH /categories/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.achievementCategory.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
