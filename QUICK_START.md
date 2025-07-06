# Quick Start Guide - Achievement API

## 🚀 Быстрый старт

### 1. Запуск сервера

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

### 2. Проверка работоспособности

```bash
# Проверка состояния приложения
curl http://localhost:3000/health

# Проверка подключения к БД
curl http://localhost:3000/health/db

# Получение статистики
curl http://localhost:3000/api/stats
```

## 📝 Основные примеры использования

### Создание категории

```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "key": "beginner",
    "name": {
      "en": "Beginner",
      "ru": "Начинающий",
      "tr": "Başlangıç"
    }
  }'
```

### Создание достижения

```bash
curl -X POST http://localhost:3000/achievements \
  -H "Content-Type: application/json" \
  -d '{
    "title": {
      "en": "First Task",
      "ru": "Первое задание"
    },
    "description": {
      "en": "Complete your first task",
      "ru": "Выполните первое задание"
    },
    "icon": "🎯",
    "hidden": false,
    "target": 1,
    "categoryId": "CATEGORY_ID_FROM_PREVIOUS_STEP"
  }'
```

### Создание награды

```bash
curl -X POST http://localhost:3000/rewards \
  -H "Content-Type: application/json" \
  -d '{
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
    "achievementId": "ACHIEVEMENT_ID_FROM_PREVIOUS_STEP"
  }'
```

### Создание прогресса пользователя

```bash
curl -X POST http://localhost:3000/progress \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "achievementId": "ACHIEVEMENT_ID_FROM_PREVIOUS_STEP",
    "progress": "INPROGRESS",
    "currentStep": 1
  }'
```

### Получение данных с локализацией

```bash
# Категории на русском
curl "http://localhost:3000/categories?lang=ru"

# Достижения на турецком
curl "http://localhost:3000/achievements?lang=tr"

# Все переводы
curl "http://localhost:3000/categories"
```

## 🔄 Server-Sent Events (SSE)

### Подключение к SSE

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

### Node.js пример

```javascript
const EventSource = require("eventsource");

const eventSource = new EventSource(
  "http://localhost:3000/api/achievements-events?clientId=user123"
);

eventSource.onmessage = function (event) {
  console.log("Получено событие:", event.data);
};
```

## 📊 Полный пример рабочего процесса

### 1. Создание категории

```bash
CATEGORY_RESPONSE=$(curl -s -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "key": "beginner",
    "name": {
      "en": "Beginner",
      "ru": "Начинающий"
    }
  }')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.id')
echo "Создана категория с ID: $CATEGORY_ID"
```

### 2. Создание достижения

```bash
ACHIEVEMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/achievements \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": {
      \"en\": \"First Task\",
      \"ru\": \"Первое задание\"
    },
    \"description\": {
      \"en\": \"Complete your first task\",
      \"ru\": \"Выполните первое задание\"
    },
    \"icon\": \"🎯\",
    \"hidden\": false,
    \"target\": 1,
    \"categoryId\": \"$CATEGORY_ID\"
  }")

ACHIEVEMENT_ID=$(echo $ACHIEVEMENT_RESPONSE | jq -r '.id')
echo "Создано достижение с ID: $ACHIEVEMENT_ID"
```

### 3. Создание награды

```bash
REWARD_RESPONSE=$(curl -s -X POST http://localhost:3000/rewards \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"badge\",
    \"title\": {
      \"en\": \"First Badge\",
      \"ru\": \"Первый значок\"
    },
    \"description\": {
      \"en\": \"Your first achievement badge\",
      \"ru\": \"Ваш первый значок достижения\"
    },
    \"icon\": \"🏆\",
    \"isApplicable\": true,
    \"details\": {},
    \"achievementId\": \"$ACHIEVEMENT_ID\"
  }")

REWARD_ID=$(echo $REWARD_RESPONSE | jq -r '.id')
echo "Создана награда с ID: $REWARD_ID"
```

### 4. Создание прогресса

```bash
PROGRESS_RESPONSE=$(curl -s -X POST http://localhost:3000/progress \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"user123\",
    \"achievementId\": \"$ACHIEVEMENT_ID\",
    \"progress\": \"INPROGRESS\",
    \"currentStep\": 1
  }")

PROGRESS_ID=$(echo $PROGRESS_RESPONSE | jq -r '.id')
echo "Создан прогресс с ID: $PROGRESS_ID"
```

### 5. Обновление прогресса

```bash
curl -X PATCH "http://localhost:3000/progress/$PROGRESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": "FINISHED",
    "currentStep": 1
  }'
```

### 6. Получение результатов

```bash
# Получить все категории с достижениями
curl "http://localhost:3000/categories?lang=ru"

# Получить прогресс пользователя
curl "http://localhost:3000/progress/user/user123"

# Получить статистику
curl "http://localhost:3000/api/stats"
```

## 🔧 Полезные команды

### Проверка всех endpoints

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/health/db

# Statistics
curl http://localhost:3000/api/stats

# Categories
curl http://localhost:3000/categories
curl "http://localhost:3000/categories?lang=ru"

# Achievements
curl http://localhost:3000/achievements
curl "http://localhost:3000/achievements?lang=tr"

# Rewards
curl http://localhost:3000/rewards
curl "http://localhost:3000/rewards?lang=en"

# Progress
curl http://localhost:3000/progress
curl "http://localhost:3000/progress/user/user123"
```

### Тест SSE

```bash
# В браузере откройте консоль и выполните:
const eventSource = new EventSource('http://localhost:3000/api/achievements-events?clientId=test123');
eventSource.onmessage = console.log;
```

## 📚 Дополнительная документация

- **[Полная API документация](./API_DOCUMENTATION.md)** - Подробное описание всех endpoints
- **[README.md](./README.md)** - Общая информация о проекте
- **[Swagger UI](http://localhost:3000/api-docs)** - Интерактивная документация

## 🆘 Решение проблем

### Ошибка подключения к БД

```bash
# Проверьте переменные окружения
echo $DATABASE_URL

# Проверьте статус БД
curl http://localhost:3000/health/db
```

### Ошибка валидации

```bash
# Проверьте формат CUID (должен начинаться с 'c' и содержать 25 символов)
# Пример: cmcdbzw5c0000lzgwqdktz0zl

# Проверьте обязательные поля
# Для достижений: title, description, categoryId
# Для наград: type, title, description, achievementId
# Для прогресса: userId, achievementId
```

### Ошибка SSE

```bash
# Убедитесь, что clientId предоставлен
curl "http://localhost:3000/api/achievements-events?clientId=test123"

# Проверьте CORS настройки для cross-origin запросов
```
