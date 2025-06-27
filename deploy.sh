#!/bin/bash

# Скрипт развертывания Achievement API на сервере
# Использование: ./deploy.sh [production|staging]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверка аргументов
ENVIRONMENT=${1:-production}
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    error "Неверное окружение. Используйте 'production' или 'staging'"
fi

log "Начинаем развертывание в окружении: $ENVIRONMENT"

# Проверка наличия необходимых утилит
log "Проверяем зависимости..."

if ! command -v node &> /dev/null; then
    error "Node.js не установлен"
fi

if ! command -v npm &> /dev/null; then
    error "npm не установлен"
fi

if ! command -v pm2 &> /dev/null; then
    warning "PM2 не установлен. Устанавливаем..."
    npm install -g pm2
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
fi

log "Node.js версия: $(node -v)"
log "npm версия: $(npm -v)"

# Создание директорий для логов
log "Создаем директории для логов..."
mkdir -p logs

# Остановка существующего процесса
log "Останавливаем существующий процесс..."
pm2 stop achievement-api 2>/dev/null || true
pm2 delete achievement-api 2>/dev/null || true

# Установка зависимостей
log "Устанавливаем зависимости..."
npm ci --only=production

# Генерация Prisma клиента
log "Генерируем Prisma клиент..."
npm run db:generate

# Применение миграций базы данных
log "Применяем миграции базы данных..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run db:migrate:deploy
else
    npm run db:migrate
fi

# Проверка подключения к базе данных
log "Проверяем подключение к базе данных..."
if ! node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('База данных подключена успешно');
    return prisma.\$disconnect();
  })
  .catch((e) => {
    console.error('Ошибка подключения к базе данных:', e);
    process.exit(1);
  });
"; then
    error "Не удалось подключиться к базе данных"
fi

# Запуск приложения через PM2
log "Запускаем приложение через PM2..."
pm2 start ecosystem.config.js --env production

# Ожидание запуска
log "Ожидаем запуска приложения..."
sleep 5

# Проверка статуса
if pm2 list | grep -q "achievement-api.*online"; then
    log "Приложение успешно запущено!"
    log "Статус PM2:"
    pm2 list
    log "Логи приложения:"
    pm2 logs achievement-api --lines 10
else
    error "Приложение не запустилось"
fi

# Настройка автозапуска PM2
log "Настраиваем автозапуск PM2..."
pm2 startup
pm2 save

log "Развертывание завершено успешно!"
log "Приложение доступно на порту 3000"
log "Для просмотра логов: pm2 logs achievement-api"
log "Для мониторинга: pm2 monit" 