import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import helmet from "helmet";
import { DEFAULT_LANGUAGE } from "./lib/translations.js";
import stats from "./api/stats.js";
import health from "./api/health.js";
import categories from "./api/categories.js";
import achievments from "./api/achievments.js";
import rewards from "./api/rewards.js";
import progress from "./api/progress.js";

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

// Security middleware
app.use(helmet());

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
      "https://test.aquadaddy.app",
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
      description:
        "Полнофункциональная система отслеживания достижений с API, SSE (Server-Sent Events) и админ-панелью. Поддерживает многоязычность, real-time уведомления и полный CRUD для всех сущностей.",
    },
    servers: [
      {
        url: "http://localhost:3005",
        description: "Development server",
      },
      {
        url: "https://test.aquadaddy.app",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        Category: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Уникальный идентификатор категории (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            key: {
              type: "string",
              description: "Уникальный ключ категории",
              example: "beginner",
            },
            name: {
              type: "object",
              description: "Объект с переводами названия",
              example: {
                en: "Beginner",
                ru: "Начинающий",
                tr: "Başlangıç",
                fr: "Débutant",
                de: "Anfänger",
                ar: "مبتدئ",
                gr: "Αρχάριος",
              },
            },
            achievements: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Achievement",
              },
              description: "Список достижений в категории",
            },
          },
          required: ["id", "key", "name"],
        },
        Achievement: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Уникальный идентификатор достижения (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            title: {
              type: "object",
              description: "Объект с переводами заголовка",
              example: {
                en: "First Achievement",
                ru: "Первое достижение",
              },
            },
            description: {
              type: "object",
              description: "Объект с переводами описания",
              example: {
                en: "Complete your first task",
                ru: "Выполните первое задание",
              },
            },
            icon: {
              type: "string",
              description: "URL иконки или эмодзи",
              example: "🎯",
            },
            hidden: {
              type: "boolean",
              description: "Скрытое достижение",
              example: false,
            },
            target: {
              type: "integer",
              description: "Целевое значение для завершения",
              example: 1,
            },
            categoryId: {
              type: "string",
              description: "ID связанной категории (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            category: {
              $ref: "#/components/schemas/Category",
              description: "Связанная категория",
            },
            reward: {
              $ref: "#/components/schemas/Reward",
              description: "Награда за достижение (может быть null)",
            },
            progress: {
              type: "array",
              items: {
                $ref: "#/components/schemas/UserAchievementProgress",
              },
              description: "Прогресс пользователей по достижению",
            },
          },
          required: ["id", "title", "description", "categoryId"],
        },
        Reward: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Уникальный идентификатор награды (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
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
              example: "badge",
            },
            title: {
              type: "object",
              description: "Объект с переводами заголовка награды",
              example: {
                en: "First Badge",
                ru: "Первый значок",
              },
            },
            description: {
              type: "object",
              description: "Объект с переводами описания награды",
              example: {
                en: "Your first achievement badge",
                ru: "Ваш первый значок достижения",
              },
            },
            icon: {
              type: "string",
              description: "URL иконки награды или эмодзи",
              example: "🏆",
            },
            isApplicable: {
              type: "boolean",
              description: "Применимость награды",
              example: true,
            },
            details: {
              type: "object",
              description: "Дополнительные детали награды (JSON)",
              example: {
                amount: 100,
                currency: "USDT",
              },
            },
            achievementId: {
              type: "string",
              description: "ID связанного достижения (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            achievement: {
              $ref: "#/components/schemas/Achievement",
              description: "Связанное достижение",
            },
          },
          required: ["id", "type", "title", "description", "achievementId"],
        },
        UserAchievementProgress: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Уникальный идентификатор прогресса (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            userId: {
              type: "string",
              description: "ID пользователя",
              example: "user123",
            },
            achievementId: {
              type: "string",
              description: "ID достижения (CUID)",
              example: "cmcdbzw5c0000lzgwqdktz0zl",
            },
            progress: {
              type: "string",
              enum: ["INPROGRESS", "BLOCKED", "FINISHED"],
              description: "Статус прогресса",
              example: "INPROGRESS",
            },
            currentStep: {
              type: "integer",
              description: "Текущий шаг прогресса",
              example: 2,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Дата создания",
              example: "2024-01-15T10:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Дата обновления",
              example: "2024-01-15T10:30:00.000Z",
            },
            achievement: {
              $ref: "#/components/schemas/Achievement",
              description: "Связанное достижение",
            },
          },
          required: ["id", "userId", "achievementId", "progress"],
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Описание ошибки",
              example: "Invalid categoryId format",
            },
          },
          required: ["error"],
        },
        Stats: {
          type: "object",
          properties: {
            categories: {
              type: "integer",
              description: "Количество категорий",
              example: 5,
            },
            achievements: {
              type: "integer",
              description: "Количество достижений",
              example: 25,
            },
            rewards: {
              type: "integer",
              description: "Количество наград",
              example: 20,
            },
            progress: {
              type: "integer",
              description: "Общее количество записей прогресса",
              example: 150,
            },
            progressStats: {
              type: "object",
              properties: {
                completed: {
                  type: "integer",
                  description: "Завершенные достижения",
                  example: 80,
                },
                inProgress: {
                  type: "integer",
                  description: "Достижения в процессе",
                  example: 60,
                },
                blocked: {
                  type: "integer",
                  description: "Заблокированные достижения",
                  example: 10,
                },
              },
            },
            achievementStats: {
              type: "object",
              properties: {
                hidden: {
                  type: "integer",
                  description: "Скрытые достижения",
                  example: 5,
                },
                visible: {
                  type: "integer",
                  description: "Видимые достижения",
                  example: 20,
                },
              },
            },
            rewardStats: {
              type: "object",
              properties: {
                applicable: {
                  type: "integer",
                  description: "Применимые награды",
                  example: 18,
                },
                total: {
                  type: "integer",
                  description: "Общее количество наград",
                  example: 20,
                },
              },
            },
          },
        },
      },
      parameters: {
        LangParam: {
          name: "lang",
          in: "query",
          description: "Код языка для переводов",
          schema: {
            type: "string",
            enum: ["en", "ru", "tr", "fr", "de", "ar", "gr"],
          },
          example: "ru",
        },
        IdParam: {
          name: "id",
          in: "path",
          required: true,
          description: "Уникальный идентификатор (CUID)",
          schema: {
            type: "string",
            pattern: "^c[a-z0-9]{24}$",
          },
          example: "cmcdbzw5c0000lzgwqdktz0zl",
        },
        ClientIdParam: {
          name: "clientId",
          in: "query",
          required: true,
          description: "Уникальный идентификатор клиента для SSE",
          schema: {
            type: "string",
          },
          example: "user123",
        },
      },
    },
  },
  apis: ["./index.js", "./api/*.js"],
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

/* ─── Валидация ─── */
// Функция для валидации CUID
function isValidCuid(id) {
  return (
    typeof id === "string" && id.length >= 25 && /^c[a-z0-9]{24}$/.test(id)
  );
}

// Функция для валидации объекта переводов
function isValidTranslations(obj) {
  if (!obj || typeof obj !== "object") return false;
  return LANGS.every((lang) => typeof obj[lang] === "string");
}

// Функция для санитизации строк
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.trim().replace(/[<>]/g, "");
}

// Функция для валидации URL
function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());

// Добавляем middleware для установки правильных заголовков (кроме SSE)
app.use((req, res, next) => {
  // Не устанавливаем Content-Type для SSE endpoint
  if (req.path === "/api/achievements-events") {
    return next();
  }
  res.setHeader("Content-Type", "application/json");
  next();
});

// Передаем зависимости в API модули
const dependencies = {
  pickLang,
  normalizeNameTranslations,
  LANGS,
  DEFAULT_LANGUAGE,
  isValidCuid,
  sanitizeString,
  isValidUrl,
};

// Хранилище клиентов
let clients = [];

/**
 * @swagger
 * /api/achievements-events:
 *   get:
 *     summary: Server-Sent Events endpoint для real-time уведомлений
 *     description: |
 *       Устанавливает SSE соединение для получения real-time уведомлений о достижениях.
 *       Поддерживает множественные подключения, автоматические heartbeat сообщения
 *       и graceful отключение при закрытии соединения.
 *     parameters:
 *       - $ref: '#/components/parameters/ClientIdParam'
 *     responses:
 *       200:
 *         description: SSE соединение установлено
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             examples:
 *               connection_established:
 *                 summary: Сообщение о подключении
 *                 value: "data: соединение установлено\n\ndata: user123\n\n"
 *               heartbeat:
 *                 summary: Heartbeat сообщение
 *                 value: "data: heartbeat 2024-01-15T10:30:00.000Z\n\n"
 *               achievement_event:
 *                 summary: Событие достижения
 *                 value: 'data: {"type": "achievement_completed", "userId": "user123", "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"}\n\n'
 *       400:
 *         description: Client ID не предоставлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Client ID is required"
 *     x-code-samples:
 *       - lang: JavaScript
 *         source: |
 *           const eventSource = new EventSource('/api/achievements-events?clientId=user123');
 *
 *           eventSource.onmessage = function(event) {
 *             console.log('Получено событие:', event.data);
 *           };
 *
 *           eventSource.onerror = function(error) {
 *             console.error('Ошибка SSE:', error);
 *           };
 */
// SSE endpoint
app.get("/api/achievements-events", (req, res) => {
  const clientId = req.query.clientId?.toString();

  if (!clientId) {
    return res.status(400).json({ error: "Client ID is required" });
  }

  console.log(
    "SSE connection attempt from:",
    req.ip,
    "with clientId:",
    clientId
  );

  // Удаляем существующего клиента
  clients = clients.filter((c) => c.id !== clientId);

  // Заголовки
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  // Приветствие
  res.write(`data: соединение установлено\n\n`);
  res.write(`data: ${clientId}\n\n`);

  // Сохраняем клиента
  const client = { id: clientId, res };
  clients.push(client);
  console.log(`Client ${clientId} connected. Total clients: ${clients.length}`);

  // Ping каждые 30 сек
  const interval = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  // Очистка при отключении
  req.on("close", () => {
    clearInterval(interval);
    clients = clients.filter((c) => c.id !== clientId);
    console.log(
      `Client ${clientId} disconnected. Total clients: ${clients.length}`
    );
  });

  // Обработка ошибок
  req.on("error", (err) => {
    clearInterval(interval);
    clients = clients.filter((c) => c.id !== clientId);
    console.error(`Request error with client ${clientId}:`, err.message);
  });

  res.on("error", (err) => {
    clearInterval(interval);
    clients = clients.filter((c) => c.id !== clientId);
    console.error(`Response error with client ${clientId}:`, err.message);
  });
});
/**
 * @swagger
 * /api/achievements-events:
 *   options:
 *     summary: CORS preflight для SSE endpoint
 *     description: Обрабатывает CORS preflight запросы для SSE соединений
 *     responses:
 *       200:
 *         description: CORS headers установлены
 *         headers:
 *           Access-Control-Allow-Origin:
 *             description: Разрешенные origins
 *             schema:
 *               type: string
 *               example: "*"
 *           Access-Control-Allow-Methods:
 *             description: Разрешенные методы
 *             schema:
 *               type: string
 *               example: "GET, OPTIONS"
 *           Access-Control-Allow-Headers:
 *             description: Разрешенные заголовки
 *             schema:
 *               type: string
 *               example: "Cache-Control"
 */
// Preflight CORS
app.options("/api/achievements-events", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
  res.status(204).end();
});

setInterval(() => {
  clients.forEach((client) => {
    client.res.write(`data: SSE heartbeat\n\n`); // ping
  });
}, 30000); // каждые 30 сек

health(app, prisma);
categories(app, prisma, dependencies);
achievments(app, prisma, dependencies);
rewards(app, prisma, dependencies);
// progress(app, prisma, dependencies, clients);
stats(app, prisma);

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
      if (achievement.target === 0 || finalCurrentStep >= achievement.target) {
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
                : normalizeNameTranslations(row.achievement.reward.description),
            }
          : null,
      },
    };

    /* ---------- SSE‑оповещение ---------- */

    const client = clients.find((c) => c.id.toString() === userId.toString());
    if (client) {
      try {
        client.res.write(
          `event: progress\ndata: ${JSON.stringify(progressRecord)}\n\n`
        );
      } catch (err) {
        clients = clients.filter((c) => c.id !== client.id);
      }
    }

    /* ---------- Финальный HTTP‑ответ ---------- */
    return res.status(201).json(progressRecord);
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
            error: "Cannot set progress to FINISHED when target is not reached",
            currentStep: finalCurrentStep,
            target: achievement.target,
          });
        }
        finalProgress = "FINISHED";
      } else if (progress === "INPROGRESS") {
        // Проверяем, не достигнута ли уже цель
        if (achievement.target > 0 && finalCurrentStep >= achievement.target) {
          finalProgress = "FINISHED";
        } else {
          finalProgress = "INPROGRESS";
        }
      }
    } else {
      // Если progress не передан, определяем автоматически
      if (achievement.target === 0 || finalCurrentStep >= achievement.target) {
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
                : normalizeNameTranslations(row.achievement.reward.description),
            }
          : null,
      },
    };

    const targetUserId = userId || existingProgress.userId;
    const client = clients.find(
      (c) => c.id.toString() === targetUserId.toString()
    );
    if (client) {
      try {
        client.res.write(
          `event: progress\ndata: ${JSON.stringify(progressRecord)}\n\n`
        );
      } catch (err) {
        clients = clients.filter((c) => c.id !== client.id);
      }
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
                : normalizeNameTranslations(row.achievement.reward.description),
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
