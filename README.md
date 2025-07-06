# Achievement Tracking System

Полнофункциональная система отслеживания достижений с API, SSE (Server-Sent Events) и админ-панелью.

## 🚀 Развертывание

### 🐳 С Docker (Разработка)

#### 1. Запуск базы данных

```bash
docker-compose up -d
```

#### 2. Настройка базы данных

```bash
npx prisma generate
npx prisma db push
```

#### 3. Запуск бэкенда

```bash
npm run dev
```

#### 4. Запуск фронтенда

```bash
cd frontend
npm install
npm run dev
```

### 🖥️ На сервере без Docker (Production)

#### Быстрое развертывание (5 минут)

```bash
# 1. Подготовка сервера
ssh root@your-server-ip
git clone https://github.com/your-repo/achievement-api.git
cd achievement-api
./setup-server.sh

# 2. Настройка переменных окружения
nano /opt/achievement-api/.env

# 3. Развертывание
cp -r . /opt/achievement-api/
chown -R achievement:achievement /opt/achievement-api
su - achievement
cd /opt/achievement-api
./deploy.sh production
```

#### Документация по развертыванию

- **[Быстрый старт](./QUICK_START.md)** - Развертывание за 5 минут
- **[Полное руководство](./DEPLOYMENT.md)** - Подробная документация
- **[Чек-лист](./DEPLOYMENT_CHECKLIST.md)** - Контрольный список

## 📋 Доступные сервисы

- **API Backend**: http://localhost:3000
- **Frontend Admin**: http://localhost:3001
- **Swagger Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Database Health**: http://localhost:3000/health/db
- **API Statistics**: http://localhost:3000/api/stats
- **SSE Events**: http://localhost:3000/api/achievements-events

## 🏗 Архитектура

### Backend (Node.js + Express + Prisma)

- **API**: RESTful API с полным CRUD
- **SSE**: Server-Sent Events для real-time уведомлений
- **База данных**: PostgreSQL с Prisma ORM
- **Документация**: Swagger/OpenAPI
- **Валидация**: Встроенная валидация данных
- **Обработка ошибок**: Централизованная обработка
- **Production**: PM2 + Nginx + Systemd

### Frontend (React + Vite)

- **UI Framework**: React 18 с Hooks
- **Стили**: Tailwind CSS
- **Иконки**: Lucide React
- **HTTP Client**: Axios
- **Роутинг**: React Router
- **Сборка**: Vite

### База данных (PostgreSQL)

- **Разработка**: Docker Compose
- **Production**: Нативная установка
- **ORM**: Prisma
- **Миграции**: Автоматические через Prisma

## 📊 Модели данных

### AchievementCategory

- `id`: Уникальный идентификатор (CUID)
- `key`: Ключ категории (уникальный)
- `name`: Название категории (объект с переводами)

### Achievement

- `id`: Уникальный идентификатор (CUID)
- `title`: Название достижения (объект с переводами)
- `description`: Описание (объект с переводами)
- `icon`: URL иконки
- `hidden`: Скрытое достижение (boolean)
- `target`: Целевое значение (integer)
- `categoryId`: Ссылка на категорию (CUID)
- `reward`: Связанная награда (может быть null)

### Reward

- `id`: Уникальный идентификатор (CUID)
- `type`: Тип награды (badge, bonus_crypto, discount_commission, cat_accessories, visual_effects)
- `title`: Название награды (объект с переводами)
- `description`: Описание награды (объект с переводами)
- `icon`: URL иконки
- `isApplicable`: Применимость (boolean)
- `details`: Дополнительные детали (JSON)
- `achievementId`: Ссылка на достижение (CUID)

### UserAchievementProgress

- `id`: Уникальный идентификатор (CUID)
- `userId`: ID пользователя (string)
- `achievementId`: Ссылка на достижение (CUID)
- `progress`: Статус (INPROGRESS, BLOCKED, FINISHED)
- `currentStep`: Текущий шаг (integer)
- `createdAt`: Дата создания
- `updatedAt`: Дата обновления

## 🔧 Полный список API Endpoints

### Health Checks

#### `GET /health`

Проверка состояния приложения.

**Ответ:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /health/db`

Проверка подключения к базе данных.

**Ответ:**

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

### Categories (Полный CRUD)

#### `GET /categories`

Получить все категории с достижениями и наградами.

**Параметры:**

- `lang` (query, optional): Код языка для переводов (en, ru, tr, fr, de, ar, gr)

**Пример запроса:**

```bash
GET /categories?lang=ru
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

Получить категорию по ID с достижениями и наградами.

**Параметры:**

- `id` (path, required): ID категории (CUID)
- `lang` (query, optional): Код языка для переводов

**Пример запроса:**

```bash
GET /categories/cmcdbzw5c0000lzgwqdktz0zl?lang=ru
```

#### `POST /categories`

Создать новую категорию.

**Тело запроса:**

```json
{
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
}
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

**Параметры:**

- `id` (path, required): ID категории (CUID)

**Тело запроса:**

```json
{
  "key": "expert",
  "name": {
    "en": "Expert",
    "ru": "Эксперт"
  }
}
```

#### `DELETE /categories/:id`

Удалить категорию.

**Параметры:**

- `id` (path, required): ID категории (CUID)

**Ответ (204):** No Content

### Achievements (Полный CRUD)

#### `GET /achievements`

Получить все достижения.

**Параметры:**

- `lang` (query, optional): Код языка для переводов

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

#### `GET /achievements/:id`

Получить достижение по ID.

**Параметры:**

- `id` (path, required): ID достижения (CUID)
- `lang` (query, optional): Код языка для переводов

#### `POST /achievements`

Создать новое достижение.

**Тело запроса:**

```json
{
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
}
```

**Валидация:**

- `title`, `description`, `categoryId` - обязательные поля
- `categoryId` должен быть валидным CUID
- `target` должен быть положительным числом
- `icon` должен быть валидным URL или эмодзи

#### `PATCH /achievements/:id`

Обновить достижение.

**Параметры:**

- `id` (path, required): ID достижения (CUID)

#### `DELETE /achievements/:id`

Удалить достижение.

**Параметры:**

- `id` (path, required): ID достижения (CUID)

### Rewards (Полный CRUD)

#### `GET /rewards`

Получить все награды.

**Параметры:**

- `lang` (query, optional): Код языка для переводов

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

#### `GET /rewards/:id`

Получить награду по ID.

**Параметры:**

- `id` (path, required): ID награды (CUID)
- `lang` (query, optional): Код языка для переводов

#### `POST /rewards`

Создать новую награду.

**Тело запроса:**

```json
{
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
}
```

**Поддерживаемые типы наград:**

- `badge` - Значки
- `bonus_crypto` - Криптовалютные бонусы
- `discount_commission` - Скидки на комиссиях
- `cat_accessories` - Аксессуары для кошек
- `visual_effects` - Визуальные эффекты

**Валидация:**

- `type`, `title`, `description`, `achievementId` - обязательные поля
- `type` должен быть одним из поддерживаемых типов
- `achievementId` должен быть валидным CUID
- `icon` должен быть валидным URL или эмодзи

#### `PATCH /rewards/:id`

Обновить награду.

**Параметры:**

- `id` (path, required): ID награды (CUID)

#### `DELETE /rewards/:id`

Удалить награду.

**Параметры:**

- `id` (path, required): ID награды (CUID)

### Progress (Полный CRUD)

#### `GET /progress`

Получить весь прогресс пользователей.

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

**Параметры:**

- `id` (path, required): ID пользователя

**Пример запроса:**

```bash
GET /progress/user/user123
```

#### `GET /progress/:id`

Получить конкретный прогресс по ID.

**Параметры:**

- `id` (path, required): ID прогресса (CUID)

#### `POST /progress`

Создать новый прогресс пользователя.

**Тело запроса:**

```json
{
  "userId": "user123",
  "achievementId": "cmcdbzw5c0000lzgwqdktz0zl",
  "progress": "INPROGRESS",
  "currentStep": 1
}
```

**Валидация:**

- `userId`, `achievementId` - обязательные поля
- `progress` должен быть одним из: INPROGRESS, BLOCKED, FINISHED
- `currentStep` должен быть неотрицательным числом
- `achievementId` должен быть валидным CUID

**Ответ (201):**

```json
{
  "id": "cmcdbzw5c0000lzgwqdktz0zl",
  "userId": "user123",
  "achievementId": "cmcdbzw5c0000lzgwqdktz0zl",
  "progress": "INPROGRESS",
  "currentStep": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### `PATCH /progress/:id`

Обновить прогресс.

**Параметры:**

- `id` (path, required): ID прогресса (CUID)

**Тело запроса:**

```json
{
  "progress": "FINISHED",
  "currentStep": 5
}
```

#### `DELETE /progress/:id`

Удалить прогресс пользователя.

**Параметры:**

- `id` (path, required): ID прогресса (CUID)

## 🔄 Server-Sent Events (SSE)

### `GET /api/achievements-events`

Endpoint для real-time уведомлений о достижениях.

**Параметры:**

- `clientId` (query, required): Уникальный идентификатор клиента

**Пример подключения:**

```javascript
const eventSource = new EventSource(
  "/api/achievements-events?clientId=user123"
);

eventSource.onmessage = function (event) {
  console.log("Получено событие:", event.data);
};

eventSource.onerror = function (error) {
  console.error("Ошибка SSE:", error);
};
```

**Особенности SSE:**

- Поддерживает множественные подключения
- Автоматические heartbeat сообщения каждые 3 секунды
- Graceful отключение при закрытии соединения
- CORS поддержка для cross-origin запросов
- Отключение буферизации nginx для real-time событий

**Формат сообщений:**

```
data: соединение установлено

data: user123

data: heartbeat 2024-01-15T10:30:00.000Z

data: {"type": "achievement_completed", "userId": "user123", "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"}
```

**CORS Headers:**

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Cache-Control
```

## 🌐 Локализация

API поддерживает многоязычность через параметр `lang` в query string.

**Поддерживаемые языки:**

- `en` - English
- `ru` - Русский
- `tr` - Türkçe
- `fr` - Français
- `de` - Deutsch
- `ar` - العربية
- `gr` - Ελληνικά

**Примеры использования:**

```bash
# Получить категории на русском
GET /categories?lang=ru

# Получить достижения на турецком
GET /achievements?lang=tr

# Без указания языка - возвращает все переводы
GET /categories
```

**Автоматическое определение языка:**
API также поддерживает автоматическое определение языка через заголовок `Accept-Language`:

```
Accept-Language: ru-RU,ru;q=0.9,en;q=0.8
```

## 🔒 Безопасность

### Валидация данных

- Валидация CUID для всех ID
- Санитизация строковых полей
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
```

## 🚀 Production

### Переменные окружения

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/achievements"
PORT=3000
NODE_ENV=production
```

### PM2 конфигурация

```javascript
module.exports = {
  apps: [
    {
      name: "achievement-api",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE поддержка
    location /api/achievements-events {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
```

## 📊 Мониторинг

### Health Checks

- `/health` - Проверка состояния приложения
- `/health/db` - Проверка подключения к БД

### Статистика

- `/api/stats` - Общая статистика системы

### Логирование

Все запросы и ошибки логируются в консоль с временными метками.

## 🔧 Разработка

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Генерация Prisma клиента

```bash
npx prisma generate
```

### Миграции базы данных

```bash
npx prisma db push
```

### Swagger документация

Доступна по адресу: http://localhost:3000/api-docs
