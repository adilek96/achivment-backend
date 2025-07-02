import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { getTranslation, DEFAULT_LANGUAGE } from "./lib/translations.js";

dotenv.config();

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

const app = express();
const PORT = process.env.PORT || 3005;

// CORS middleware
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://achivment-front.vercel.app",
      "https://achivment-front-git-main-achivment-front.vercel.app",
      "https://achivment-front-git-main-adilek96s-projects.vercel.app",
      "https://penny-test.fvds.ru",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Language middleware
app.use((req, res, next) => {
  // Получаем язык из заголовка Accept-Language или query параметра
  const acceptLanguage = req.headers["accept-language"];
  const queryLanguage = req.query.lang;

  let language = DEFAULT_LANGUAGE;

  if (queryLanguage) {
    language = queryLanguage;
  } else if (acceptLanguage) {
    // Парсим Accept-Language заголовок
    const languages = acceptLanguage.split(",").map((lang) => {
      const [code, quality = "1"] = lang.trim().split(";q=");
      return { code: code.split("-")[0], quality: parseFloat(quality) };
    });

    // Сортируем по качеству и берем первый поддерживаемый
    languages.sort((a, b) => b.quality - a.quality);
    const supportedLanguage = languages.find((lang) =>
      ["en", "ru", "tr", "fr", "de", "ar", "gr"].includes(lang.code)
    );

    if (supportedLanguage) {
      language = supportedLanguage.code;
    }
  }

  req.language = language;
  next();
});

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Achievement API",
      version: "1.0.0",
      description: "Документация для Achievement API",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      schemas: {
        Category: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Уникальный идентификатор категории",
            },
            key: {
              type: "string",
              description: "Ключ категории",
            },
            name: {
              type: "object",
              description: "Объект с переводами названия",
              example: {
                en: "English",
                ru: "Русский",
                tr: "Türkçe",
              },
            },
            achievements: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Achievement",
              },
            },
          },
        },
        Achievement: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            title: {
              type: "object",
              description: "Объект с переводами заголовка",
            },
            description: {
              type: "object",
              description: "Объект с переводами описания",
            },
            icon: {
              type: "string",
            },
            hidden: {
              type: "boolean",
            },
            target: {
              type: "integer",
            },
            categoryId: {
              type: "string",
            },
            reward: {
              $ref: "#/components/schemas/Reward",
              description: "Награда за достижение (может быть null)",
            },
          },
        },
        Reward: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            type: {
              type: "string",
              enum: [
                "badge",
                "bonus_crypto",
                "discount_commission",
                "cat_accessories",
                "visual_effects",
              ],
              description: "Тип награды",
            },
            title: {
              type: "object",
              description: "Объект с переводами заголовка награды",
            },
            description: {
              type: "object",
              description: "Объект с переводами описания награды",
            },
            icon: {
              type: "string",
              description: "URL иконки награды",
            },
            isApplicable: {
              type: "boolean",
              description: "Применимость награды",
            },
            details: {
              type: "object",
              description: "Дополнительные детали награды",
            },
            achievementId: {
              type: "string",
              description: "ID связанного достижения",
            },
          },
        },
      },
    },
  },
  apis: ["./index.js"],
};

const LANGS = ["ru", "en", "tr", "fr", "de", "ar", "gr"];

/* ─── Утилиты ─── */
// 1) гарантируем полный объект
function normalizeNameTranslations(name) {
  if (typeof name !== "object" || name === null) name = {}; // если name = строка/null
  return Object.fromEntries(
    LANGS.map((l) => [l, typeof name[l] === "string" ? name[l] : ""])
  );
}

// 2) вытягиваем конкретный язык (без резервного «дефолта»)
function pickLang(nameObj, lang) {
  return typeof nameObj?.[lang] === "string" ? nameObj[lang] : "";
}

const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());

// Добавляем middleware для установки правильных заголовков
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

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
    console.log("[POST /categories] req.body:", req.body);
    const nameTranslations = normalizeNameTranslations(name);
    console.log("[POST /categories] nameTranslations:", nameTranslations);
    const category = await prisma.achievementCategory.create({
      data: {
        key,
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
    console.log("[PATCH /categories/:id] nameTranslations:", nameTranslations);
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
      description: lang ? pickLang(a.description, lang) : toFull(a.description),
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

    // Конвертируем строки в объекты переводов
    const titleTranslations =
      typeof title === "string" ? { [DEFAULT_LANGUAGE]: title } : title;

    const descriptionTranslations =
      typeof description === "string"
        ? { [DEFAULT_LANGUAGE]: description }
        : description;

    const achievement = await prisma.achievement.create({
      data: {
        title: titleTranslations,
        description: descriptionTranslations,
        icon,
        hidden: hidden || false,
        target,
        categoryId,
      },
      include: {
        category: true,
      },
    });
    res.status(201).json(achievement);
  } catch (error) {
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
      description: lang ? pickLang(r.description, lang) : toFull(r.description),
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

    const reward = await prisma.reward.create({
      data: {
        type,
        title: titleTranslations,
        description: descriptionTranslations,
        icon,
        isApplicable: isApplicable || false,
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
    console.error("Request body:", req.body);
    res.status(500).json({
      error: error.message,
      details: error.stack,
      requestBody: req.body,
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
    const { userId, achievementId, progress, currentStep } = req.body;

    // Валидация enum значений
    const validProgressValues = ["INPROGRESS", "BLOCKED", "FINISHED"];
    if (progress && !validProgressValues.includes(progress)) {
      return res.status(400).json({
        error: `Invalid progress value. Must be one of: ${validProgressValues.join(
          ", "
        )}`,
      });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    let validProgress;

    if (achievement.target === 0) {
      validProgress = "FINISHED";
    } else {
      validProgress = "INPROGRESS";
      if (currentStep >= achievement.target) {
        validProgress = "FINISHED";
      }
    }

    const progressRecord = await prisma.userAchievementProgress.create({
      data: {
        userId,
        achievementId,
        progress: validProgress || "INPROGRESS",
        currentStep: currentStep || 0,
      },
      include: {
        achievement: true,
      },
    });
    res.status(201).json(progressRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/progress/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, achievementId, progress, currentStep } = req.body;

    // Валидация enum значений
    const validProgressValues = ["INPROGRESS", "BLOCKED", "FINISHED"];
    if (progress && !validProgressValues.includes(progress)) {
      return res.status(400).json({
        error: `Invalid progress value. Must be one of: ${validProgressValues.join(
          ", "
        )}`,
      });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    let validProgress;

    if (currentStep >= achievement.target) {
      validProgress = "FINISHED";
    } else {
      validProgress = "INPROGRESS";
    }

    if (progress === "BLOCKED") {
      validProgress = "BLOCKED";
    }

    const progressRecord = await prisma.userAchievementProgress.update({
      where: { id },
      data: {
        userId,
        achievementId,
        progress: validProgress,
        currentStep,
      },
      include: {
        achievement: true,
      },
    });
    res.json(progressRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/progress/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.userAchievementProgress.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/progress/user/:id/:achievementId", async (req, res) => {
  try {
    const { id, achievementId } = req.params;
    const progress = await prisma.userAchievementProgress.findFirst({
      where: { userId: id, achievementId },
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
      prisma.userAchievementProgress.count({ where: { progress: "FINISHED" } }),
      prisma.userAchievementProgress.count({
        where: { progress: "INPROGRESS" },
      }),
      prisma.userAchievementProgress.count({ where: { progress: "BLOCKED" } }),
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database URL: ${process.env.DATABASE_URL}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
});
