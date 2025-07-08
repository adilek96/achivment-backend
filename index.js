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
  console.log(
    "SSE connection attempt from:",
    req.ip,
    "with clientId:",
    req.query.clientId
  );

  // получаем уникального ID клиента
  let clientId = req.query.clientId;

  if (!clientId) {
    console.log("No clientId provided, rejecting connection");
    res.status(400).json({ error: "Client ID is required" });
    return;
  }

  // Принудительно конвертируем в строку
  clientId = clientId.toString();

  // Удаляем существующего клиента с таким же ID
  clients = clients.filter((c) => c.id !== clientId);

  // Устанавливаем заголовки до отправки данных
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
    "X-Accel-Buffering": "no", // Отключаем буферизацию nginx
  });

  console.log("Sending welcome messages to client:", clientId);

  // Отправляем приветственные сообщения
  res.write(`data: соединение установлено\n\n`);
  res.write(`data: ${clientId}\n\n`);

  // Сохраняем клиента
  const client = { id: clientId, res };
  clients.push(client);

  console.log(`Client ${clientId} connected. Total clients: ${clients.length}`);

  // Удаляем клиента при отключении
  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
    console.log(
      `Client ${clientId} disconnected. Total clients: ${clients.length}`
    );
  });

  // Обработка ошибок
  req.on("error", (err) => {
    console.log(`Error with client ${clientId}:`, err.message);
    clients = clients.filter((c) => c.id !== clientId);
  });

  res.on("error", (err) => {
    console.log(`Response error with client ${clientId}:`, err.message);
    clients = clients.filter((c) => c.id !== clientId);
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
// OPTIONS handler для SSE
app.options("/api/achievements-events", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
  res.flushHeaders();
  res.status(200).send();
});

setInterval(() => {
  clients.forEach((client) => {
    client.res.write("data: SSE heartbeat\n\n"); // ping
  });
}, 30000); // каждые 30 сек

health(app, prisma);
categories(app, prisma, dependencies);
achievments(app, prisma, dependencies);
rewards(app, prisma, dependencies);
progress(app, prisma, dependencies, clients);
stats(app, prisma);

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
