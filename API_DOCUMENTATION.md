# API Документация - Achievement Tracking System

## 📋 Обзор

API предоставляет полный набор endpoints для управления системой достижений, включая категории, достижения, награды, прогресс пользователей и real-time уведомления через SSE.

**Базовый URL:** `http://localhost:3000` (разработка) / `https://your-domain.com` (production)

## 🔗 Доступные Endpoints

### Health Checks

- `GET /health` - Проверка состояния приложения
- `GET /health/db` - Проверка подключения к БД

### Statistics

- `GET /api/stats` - Статистика системы

### Categories

- `GET /categories` - Получить все категории
- `GET /categories/:id` - Получить категорию по ID
- `POST /categories` - Создать категорию
- `PATCH /categories/:id` - Обновить категорию
- `DELETE /categories/:id` - Удалить категорию

### Achievements

- `GET /achievements` - Получить все достижения
- `GET /achievements/:id` - Получить достижение по ID
- `POST /achievements` - Создать достижение
- `PATCH /achievements/:id` - Обновить достижение
- `DELETE /achievements/:id` - Удалить достижение

### Rewards

- `GET /rewards` - Получить все награды
- `GET /rewards/:id` - Получить награду по ID
- `POST /rewards` - Создать награду
- `PATCH /rewards/:id` - Обновить награду
- `DELETE /rewards/:id` - Удалить награду

### Progress

- `GET /progress` - Получить весь прогресс
- `GET /progress/user/:id` - Прогресс конкретного пользователя
- `GET /progress/:id` - Получить прогресс по ID
- `POST /progress` - Создать прогресс
- `PATCH /progress/:id` - Обновить прогресс
- `DELETE /progress/:id` - Удалить прогресс

### Server-Sent Events (SSE)

- `GET /api/achievements-events` - Real-time уведомления
- `OPTIONS /api/achievements-events` - CORS preflight

## 🌐 Локализация

API поддерживает 7 языков через параметр `lang`:

- `en` - English
- `ru` - Русский
- `tr` - Türkçe
- `fr` - Français
- `de` - Deutsch
- `ar` - العربية
- `gr` - Ελληνικά

**Примеры:**

```bash
# Получить категории на русском
GET /categories?lang=ru

# Получить достижения на турецком
GET /achievements?lang=tr

# Без указания языка - возвращает все переводы
GET /categories
```

## 📊 Подробная документация по Endpoints

### Health Checks

#### `GET /health`

Проверка состояния приложения.

**Запрос:**

```bash
curl -X GET http://localhost:3000/health
```

**Ответ:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /health/db`

Проверка подключения к базе данных.

**Запрос:**

```bash
curl -X GET http://localhost:3000/health/db
```

**Успешный ответ:**

```json
{
  "status": "OK",
  "database": "connected"
}
```

**Ошибка:**

```json
{
  "status": "ERROR",
  "database": "disconnected",
  "error": "Connection failed"
}
```

### Statistics

#### `GET /api/stats`

Получить статистику системы.

**Запрос:**

```bash
curl -X GET http://localhost:3000/api/stats
```

**Ответ:**

```json
{
  "categories": 5,
  "achievements": 25,
  "rewards": 20,
  "progress": 150,
  "progressStats": {
    "completed": 80,
    "inProgress": 60,
    "blocked": 10
  },
  "achievementStats": {
    "hidden": 5,
    "visible": 20
  },
  "rewardStats": {
    "applicable": 18,
    "total": 20
  }
}
```

### Categories

#### `GET /categories`

Получить все категории с достижениями и наградами.

**Параметры:**

- `lang` (query, optional): Код языка для переводов

**Запрос:**

```bash
# Все категории с переводами
curl -X GET http://localhost:3000/categories

# Категории на русском
curl -X GET "http://localhost:3000/categories?lang=ru"
```

**Ответ:**

```json
[
  {
    "id": "cmcdbzw5c0000lzgwqdktz0zl",
    "key": "beginner",
    "name": {
      "en": "Beginner",
      "ru": "Начинающий",
      "tr": "Başlangıç",
      "fr": "Débutant",
      "de": "Anfänger",
      "ar": "مبتدئ",
      "gr": "Αρχάριος"
    },
    "achievements": [
      {
        "id": "cmcdbzw5c0000lzgwqdktz0zl",
        "title": {
          "en": "First Achievement",
          "ru": "Первое достижение"
        },
        "description": {
          "en": "Complete your first task",
          "ru": "Выполните первое задание"
        },
        "icon": "🎯",
        "hidden": false,
        "target": 1,
        "categoryId": "cmcdbzw5c0000lzgwqdktz0zl",
        "reward": {
          "id": "cmcdbzw5c0000lzgwqdktz0zl",
          "type": "badge",
          "title": {
            "en": "First Badge",
            "ru": "Первый значок"
          },
          "description": {
            "en": "Your first achievement badge",
            "ru": "Ваш первый значок достижения"
          },
          "icon": "🏆",
          "isApplicable": true,
          "details": {},
          "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"
        }
      }
    ]
  }
]
```

#### `GET /categories/:id`

Получить категорию по ID.

**Параметры:**

- `id` (path, required): ID категории (CUID)
- `lang` (query, optional): Код языка для переводов

**Запрос:**

```bash
curl -X GET "http://localhost:3000/categories/cmcdbzw5c0000lzgwqdktz0zl?lang=ru"
```

#### `POST /categories`

Создать новую категорию.

**Запрос:**

```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "key": "advanced",
    "name": {
      "en": "Advanced",
      "ru": "Продвинутый",
      "tr": "İleri",
      "fr": "Avancé",
      "de": "Fortgeschritten",
      "ar": "متقدم",
      "gr": "Προχωρημένος"
    }
  }'
```

**Ответ (201):**

```json
{
  "id": "cmcdbzw5c0000lzgwqdktz0zl",
  "key": "advanced",
  "name": {
    "en": "Advanced",
    "ru": "Продвинутый",
    "tr": "İleri",
    "fr": "Avancé",
    "de": "Fortgeschritten",
    "ar": "متقدم",
    "gr": "Προχωρημένος"
  },
  "achievements": []
}
```

#### `PATCH /categories/:id`

Обновить категорию.

**Запрос:**

```bash
curl -X PATCH "http://localhost:3000/categories/cmcdbzw5c0000lzgwqdktz0zl" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "expert",
    "name": {
      "en": "Expert",
      "ru": "Эксперт"
    }
  }'
```

#### `DELETE /categories/:id`

Удалить категорию.

**Запрос:**

```bash
curl -X DELETE "http://localhost:3000/categories/cmcdbzw5c0000lzgwqdktz0zl"
```

**Ответ (204):** No Content

### Achievements

#### `GET /achievements`

Получить все достижения.

**Параметры:**

- `lang` (query, optional): Код языка для переводов

**Запрос:**

```bash
curl -X GET "http://localhost:3000/achievements?lang=ru"
```

**Ответ:**

```json
[
  {
    "id": "cmcdbzw5c0000lzgwqdktz0zl",
    "title": {
      "en": "First Achievement",
      "ru": "Первое достижение"
    },
    "description": {
      "en": "Complete your first task",
      "ru": "Выполните первое задание"
    },
    "icon": "🎯",
    "hidden": false,
    "target": 1,
    "categoryId": "cmcdbzw5c0000lzgwqdktz0zl",
    "category": {
      "id": "cmcdbzw5c0000lzgwqdktz0zl",
      "key": "beginner",
      "name": {
        "en": "Beginner",
        "ru": "Начинающий"
      }
    },
    "reward": {
      "id": "cmcdbzw5c0000lzgwqdktz0zl",
      "type": "badge",
      "title": {
        "en": "First Badge",
        "ru": "Первый значок"
      }
    },
    "progress": []
  }
]
```

#### `POST /achievements`

Создать новое достижение.

**Запрос:**

```bash
curl -X POST http://localhost:3000/achievements \
  -H "Content-Type: application/json" \
  -d '{
    "title": {
      "en": "New Achievement",
      "ru": "Новое достижение"
    },
    "description": {
      "en": "Complete this achievement",
      "ru": "Выполните это достижение"
    },
    "icon": "⭐",
    "hidden": false,
    "target": 5,
    "categoryId": "cmcdbzw5c0000lzgwqdktz0zl"
  }'
```

**Валидация:**

- `title`, `description`, `categoryId` - обязательные поля
- `categoryId` должен быть валидным CUID
- `target` должен быть положительным числом
- `icon` должен быть валидным URL или эмодзи

### Rewards

#### `GET /rewards`

Получить все награды.

**Запрос:**

```bash
curl -X GET "http://localhost:3000/rewards?lang=ru"
```

**Ответ:**

```json
[
  {
    "id": "cmcdbzw5c0000lzgwqdktz0zl",
    "type": "badge",
    "title": {
      "en": "First Badge",
      "ru": "Первый значок"
    },
    "description": {
      "en": "Your first achievement badge",
      "ru": "Ваш первый значок достижения"
    },
    "icon": "🏆",
    "isApplicable": true,
    "details": {},
    "achievementId": "cmcdbzw5c0000lzgwqdktz0zl",
    "achievement": {
      "id": "cmcdbzw5c0000lzgwqdktz0zl",
      "title": {
        "en": "First Achievement",
        "ru": "Первое достижение"
      }
    }
  }
]
```

#### `POST /rewards`

Создать новую награду.

**Запрос:**

```bash
curl -X POST http://localhost:3000/rewards \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bonus_crypto",
    "title": {
      "en": "Crypto Bonus",
      "ru": "Крипто бонус"
    },
    "description": {
      "en": "Get crypto bonus for achievement",
      "ru": "Получите крипто бонус за достижение"
    },
    "icon": "💰",
    "isApplicable": true,
    "details": {
      "amount": 100,
      "currency": "USDT"
    },
    "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"
  }'
```

**Поддерживаемые типы наград:**

- `badge` - Значки
- `bonus_crypto` - Криптовалютные бонусы
- `discount_commission` - Скидки на комиссиях
- `cat_accessories` - Аксессуары для кошек
- `visual_effects` - Визуальные эффекты

### Progress

#### `GET /progress`

Получить весь прогресс пользователей.

**Запрос:**

```bash
curl -X GET http://localhost:3000/progress
```

**Ответ:**

```json
[
  {
    "id": "cmcdbzw5c0000lzgwqdktz0zl",
    "userId": "user123",
    "achievementId": "cmcdbzw5c0000lzgwqdktz0zl",
    "progress": "INPROGRESS",
    "currentStep": 2,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "achievement": {
      "id": "cmcdbzw5c0000lzgwqdktz0zl",
      "title": {
        "en": "First Achievement",
        "ru": "Первое достижение"
      }
    }
  }
]
```

#### `GET /progress/user/:id`

Получить прогресс конкретного пользователя.

**Запрос:**

```bash
curl -X GET "http://localhost:3000/progress/user/user123"
```

#### `POST /progress`

Создать новый прогресс пользователя.

**Запрос:**

```bash
curl -X POST http://localhost:3000/progress \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "achievementId": "cmcdbzw5c0000lzgwqdktz0zl",
    "progress": "INPROGRESS",
    "currentStep": 1
  }'
```

**Валидация:**

- `userId`, `achievementId` - обязательные поля
- `progress` должен быть одним из: INPROGRESS, BLOCKED, FINISHED
- `currentStep` должен быть неотрицательным числом
- `achievementId` должен быть валидным CUID

#### `PATCH /progress/:id`

Обновить прогресс.

**Запрос:**

```bash
curl -X PATCH "http://localhost:3000/progress/cmcdbzw5c0000lzgwqdktz0zl" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": "FINISHED",
    "currentStep": 5
  }'
```

## 🔄 Server-Sent Events (SSE)

### `GET /api/achievements-events`

Endpoint для real-time уведомлений о достижениях.

**Параметры:**

- `clientId` (query, required): Уникальный идентификатор клиента

**JavaScript пример подключения:**

```javascript
const eventSource = new EventSource(
  "/api/achievements-events?clientId=user123"
);

eventSource.onmessage = function (event) {
  console.log("Получено событие:", event.data);

  try {
    const data = JSON.parse(event.data);
    if (data.type === "achievement_completed") {
      console.log("Достижение завершено:", data);
    }
  } catch (e) {
    // Обычное текстовое сообщение
    console.log("Текстовое сообщение:", event.data);
  }
};

eventSource.onerror = function (error) {
  console.error("Ошибка SSE:", error);
};

// Закрытие соединения
// eventSource.close();
```

**Node.js пример подключения:**

```javascript
const EventSource = require("eventsource");

const eventSource = new EventSource(
  "http://localhost:3000/api/achievements-events?clientId=user123"
);

eventSource.onmessage = function (event) {
  console.log("Получено событие:", event.data);
};

eventSource.onerror = function (error) {
  console.error("Ошибка SSE:", error);
};
```

**Формат сообщений:**

```
data: соединение установлено

data: user123

data: heartbeat 2024-01-15T10:30:00.000Z

data: {"type": "achievement_completed", "userId": "user123", "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"}
```

**Особенности SSE:**

- Поддерживает множественные подключения
- Автоматические heartbeat сообщения каждые 3 секунды
- Graceful отключение при закрытии соединения
- CORS поддержка для cross-origin запросов
- Отключение буферизации nginx для real-time событий

## 🔒 Безопасность

### Валидация данных

- Валидация CUID для всех ID (формат: `c[a-z0-9]{24}`)
- Санитизация строковых полей (удаление HTML тегов)
- Валидация URL для иконок
- Проверка enum значений

### CORS

```javascript
cors({
  origin: [
    "http://localhost:3001",
    "https://achivment-front.vercel.app",
    "https://penny-test.fvds.ru",
    "https://test.aquadaddy.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

### Helmet

Включены все стандартные заголовки безопасности через Helmet middleware.

## 📝 Обработка ошибок

### Стандартные HTTP коды

- `200` - Успешный запрос
- `201` - Ресурс создан
- `204` - Успешно, без содержимого
- `400` - Неверный запрос
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

### Формат ошибок

```json
{
  "error": "Описание ошибки"
}
```

### Примеры ошибок

```json
// Неверный CUID
{
  "error": "Invalid categoryId format"
}

// Обязательные поля
{
  "error": "title, description и categoryId являются обязательными полями"
}

// Неверный тип награды
{
  "error": "Invalid reward type. Must be one of: badge, bonus_crypto, discount_commission, cat_accessories, visual_effects"
}

// Категория не найдена
{
  "error": "Category not found"
}

// Достижение не найдено
{
  "error": "Achievement not found"
}
```

## 🧪 Тестирование API

### Тест всех endpoints

```bash
# Создание категории
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "name": {"en": "Test", "ru": "Тест"}}'

# Создание достижения
curl -X POST http://localhost:3000/achievements \
  -H "Content-Type: application/json" \
  -d '{"title": {"en": "Test", "ru": "Тест"}, "description": {"en": "Test", "ru": "Тест"}, "categoryId": "CATEGORY_ID"}'

# Создание награды
curl -X POST http://localhost:3000/rewards \
  -H "Content-Type: application/json" \
  -d '{"type": "badge", "title": {"en": "Test", "ru": "Тест"}, "description": {"en": "Test", "ru": "Тест"}, "achievementId": "ACHIEVEMENT_ID"}'

# Создание прогресса
curl -X POST http://localhost:3000/progress \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "achievementId": "ACHIEVEMENT_ID", "progress": "INPROGRESS"}'
```

### Тест SSE

```javascript
// В браузере
const eventSource = new EventSource(
  "http://localhost:3000/api/achievements-events?clientId=test123"
);
eventSource.onmessage = console.log;
```

## 📊 Мониторинг

### Health Checks

```bash
# Проверка состояния приложения
curl http://localhost:3000/health

# Проверка подключения к БД
curl http://localhost:3000/health/db
```

### Статистика

```bash
# Общая статистика
curl http://localhost:3000/api/stats
```

## 🔧 Разработка

### Swagger документация

Доступна по адресу: http://localhost:3000/api-docs

### Логирование

Все запросы и ошибки логируются в консоль с временными метками.

### Переменные окружения

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/achievements"
PORT=3000
NODE_ENV=development
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь в корректности переменных окружения
3. Проверьте подключение к базе данных
4. Обратитесь к Swagger документации
5. Запустите health checks
