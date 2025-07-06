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

// SSE endpoint
app.get("/api/achievements-events", (req, res) => {
  console.log(
    "SSE connection attempt from:",
    req.ip,
    "with clientId:",
    req.query.clientId
  );

  // Принудительно используем HTTP/1.1 для SSE
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Отключаем буферизацию nginx

  // SSE-заголовки
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  // получаем уникального ID клиента
  let clientId = req.query.clientId;

  if (!clientId) {
    console.log("No clientId provided, rejecting connection");
    res.status(400).json({ error: "Client ID is required" });
    return;
  }

  res.write(`data: соеденение установлено\n\n`);
  res.write(`data: ${clientId}\n\n`);

  // Сохраняем клиента
  const client = { id: clientId, res };
  clients.push(client);

  // Удаляем клиента при отключении
  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
    console.log(
      `Client ${clientId} disconnected. Total clients: ${clients.length}`
    );
  });
});

setInterval(() => {
  if (clients.length === 0) {
    return; // Не отправляем события если нет клиентов
  }

  const client = clients.find((c) => c.id === "1290846726");
  const payload = `data:  ${client ? client.id : "not found"}\n\n`;

  clients.find(({ id, res }) => {
    if (id === "1290846726") {
      try {
        res.write(payload);
      } catch (err) {
        console.log(
          `Error sending clients event to client ${id}:`,
          err.message
        );
      }
    }
  });
}, 1000);

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
