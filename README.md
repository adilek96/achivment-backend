# Achievement Tracking System

Полнофункциональная система отслеживания достижений с API и админ-панелью.

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

## 🏗 Архитектура

### Backend (Node.js + Express + Prisma)

- **API**: RESTful API с полным CRUD
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

- `id`: Уникальный идентификатор
- `key`: Ключ категории (уникальный)
- `name`: Название категории

### Achievement

- `id`: Уникальный идентификатор
- `title`: Название достижения (объект с переводами)
- `description`: Описание (объект с переводами)
- `icon`: URL иконки
- `hidden`: Скрытое достижение
- `target`: Целевое значение
- `categoryId`: Ссылка на категорию
- `reward`: Связанная награда (может быть null)

### Reward

- `id`: Уникальный идентификатор
- `type`: Тип награды (badge, bonus_crypto, discount_commission, cat_accessories, visual_effects)
- `title`: Название награды (объект с переводами)
- `description`: Описание награды (объект с переводами)
- `icon`: URL иконки
- `isApplicable`: Применимость
- `details`: Дополнительные детали (JSON)
- `achievementId`: Ссылка на достижение

### UserAchievementProgress

- `id`: Уникальный идентификатор
- `userId`: ID пользователя
- `achievementId`: Ссылка на достижение
- `progress`: Статус (INPROGRESS, BLOCKED, FINISHED)
- `currentStep`: Текущий шаг
- `createdAt`: Дата создания
- `updatedAt`: Дата обновления

## 🔧 Полный список API Endpoints

### Health Checks

- `GET /health` - Проверка состояния приложения
- `GET /health/db` - Проверка подключения к БД

### Statistics

- `GET /api/stats` - Получить статистику системы

### Categories (Полный CRUD)

- `GET /categories` - Получить все категории с достижениями и наградами
- `GET /categories/:id` - Получить категорию по ID с достижениями и наградами
- `POST /categories` - Создать категорию
- `PUT /categories/:id` - Обновить категорию
- `DELETE /categories/:id` - Удалить категорию

**Особенности:**

- Включение связанных достижений и их наград
- Поддержка локализации через параметр `?lang=ru`
- Автоматическая нормализация языковых кодов (`ru-RU` → `ru`)

### Achievements (Полный CRUD)

- `GET /achievements` - Получить все достижения
- `GET /achievements/:id` - Получить достижение по ID
- `POST /achievements` - Создать достижение
- `PUT /achievements/:id` - Обновить достижение
- `DELETE /achievements/:id` - Удалить достижение

### Rewards (Полный CRUD)

- `GET /rewards` - Получить все награды
- `GET /rewards/:id` - Получить награду по ID
- `POST /rewards` - Создать награду
- `PUT /rewards/:id` - Обновить награду
- `DELETE /rewards/:id` - Удалить награду

**Поддерживаемые типы наград:**

- `badge` - Значки
- `bonus_crypto` - Криптовалютные бонусы
- `discount_commission` - Скидки на комиссиях
- `cat_accessories` - Аксессуары для кошек
- `visual_effects` - Визуальные эффекты

### Progress (Полный CRUD)

- `GET /progress` - Получить весь прогресс
- `GET /progress/user/:userId` - Прогресс конкретного пользователя
- `POST /progress` - Создать прогресс
- `PUT /progress/:id` - Обновить прогресс
- `DELETE /progress/:id` - Удалить прогресс

## 📊 API Statistics Response

```json
{
  "categories": 5,
  "achievements": 12,
  "rewards": 8,
  "progress": 25,
  "progressStats": {
    "completed": 15,
    "inProgress": 8,
    "blocked": 2
  },
  "achievementStats": {
    "hidden": 3,
    "visible": 9
  },
  "rewardStats": {
    "applicable": 6,
    "total": 8
  }
}
```

## 🌐 Примеры использования API

### Получение категорий с локализацией

```bash
# Получить все категории на русском языке
curl "https://your-domain.com/categories?lang=ru"

# Получить категорию по ID с достижениями и наградами
curl "https://your-domain.com/categories/cmcdbzw5c0000lzgwqdktz0zl?lang=ru"
```

**Ответ:**

```json
{
  "id": "cmcdbzw5c0000lzgwqdktz0zl",
  "key": "beginner",
  "name": "Начинающий",
  "achievements": [
    {
      "id": "cmcdbzw5c0000lzgwqdktz0zl",
      "title": "Первое достижение",
      "description": "Выполните первое задание",
      "icon": "🎯",
      "hidden": false,
      "target": 1,
      "reward": {
        "id": "cmcdbzw5c0000lzgwqdktz0zl",
        "type": "badge",
        "title": "Первый значок",
        "description": "Ваш первый значок достижения",
        "icon": "🏆",
        "isApplicable": true
      }
    }
  ]
}
```

### Создание награды с новым типом

```bash
curl -X POST "https://your-domain.com/rewards" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cat_accessories",
    "title": {
      "en": "Cat Hat",
      "ru": "Кошачья шляпа"
    },
    "description": {
      "en": "A cute cat hat accessory",
      "ru": "Милая кошачья шляпа"
    },
    "achievementId": "cmcdbzw5c0000lzgwqdktz0zl"
  }'
```

### Обновление награды

```bash
curl -X PATCH "https://your-domain.com/rewards/cmcdbzw5c0000lzgwqdktz0zl" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "visual_effects",
    "title": {
      "en": "Sparkle Effect",
      "ru": "Эффект блеска"
    }
  }'
```

## 🎨 Frontend Features

### Dashboard

- Общая статистика системы
- Мониторинг состояния сервисов
- Количественные показатели
- Список всех доступных API эндпоинтов
- Детальная статистика по статусам

### Categories Management

- CRUD операции для категорий
- Отображение связанных достижений

### Achievements Management

- Полное управление достижениями
- Привязка к категориям
- Настройка видимости и целей

### Rewards Management

- Управление наградами разных типов
- Привязка к достижениям
- Настройка применимости

### Progress Tracking

- Просмотр прогресса пользователей
- Управление статусами
- Отслеживание шагов

## 🛠 Разработка

### Установка зависимостей

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
```

### Запуск в режиме разработки

```bash
# Backend (в одном терминале)
npm run dev

# Frontend (в другом терминале)
cd frontend
npm run dev
```

### Тестирование API

```bash
# Базовый тест
node test-api.js

# Полный тест всех CRUD операций
node test-all-api.js
```

### Сборка для продакшена

```bash
# Frontend
cd frontend
npm run build
```

## 🔒 Безопасность

- Валидация входных данных
- Обработка ошибок
- Безопасные HTTP заголовки
- Подтверждение удаления в UI

## 📦 Развертывание

### Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="postgresql://admin:password@localhost:5433/test?schema=public"
PORT=3000
```

## 📄 Документация

- **API Docs**: http://localhost:3000/api-docs
- **Frontend Docs**: [frontend/README.md](frontend/README.md)

## 🧪 Тестирование

### Автоматические тесты

```bash
# Тест всех CRUD операций
node test-all-api.js
```

Тесты проверяют:

- ✅ Создание, чтение, обновление, удаление категорий
- ✅ Создание, чтение, обновление, удаление достижений
- ✅ Создание, чтение, обновление, удаление наград
- ✅ Создание, чтение, обновление, удаление прогресса
- ✅ Получение статистики системы
- ✅ Health checks

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервисов
2. Убедитесь в корректности переменных окружения
3. Проверьте подключение к базе данных
4. Обратитесь к документации API
5. Запустите тесты для проверки функциональности

## 📄 Лицензия

MIT License
