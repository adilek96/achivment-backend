#!/bin/bash

# Скрипт первоначальной настройки сервера для Achievement API
# Выполнять с правами root

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Проверка root прав
if [[ $EUID -ne 0 ]]; then
   error "Этот скрипт должен выполняться с правами root"
fi

log "Начинаем настройку сервера для Achievement API"

# Обновление системы
log "Обновляем систему..."
apt update && apt upgrade -y

# Установка необходимых пакетов
log "Устанавливаем необходимые пакеты..."
apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Установка Node.js 18.x
log "Устанавливаем Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка PostgreSQL
log "Устанавливаем PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Установка Nginx
log "Устанавливаем Nginx..."
apt install -y nginx

# Установка PM2
log "Устанавливаем PM2..."
npm install -g pm2

# Создание пользователя для приложения
log "Создаем пользователя для приложения..."
useradd -r -s /bin/false -d /opt/achievement-api achievement || true
usermod -aG achievement www-data

# Создание директорий
log "Создаем директории..."
mkdir -p /opt/achievement-api
mkdir -p /opt/achievement-api/logs
mkdir -p /var/log/achievement-api

# Настройка прав доступа
chown -R achievement:achievement /opt/achievement-api
chown -R achievement:achievement /var/log/achievement-api

# Настройка PostgreSQL
log "Настраиваем PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE achievement_db;" || true
sudo -u postgres psql -c "CREATE USER achievement_user WITH ENCRYPTED PASSWORD 'your_secure_password';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE achievement_db TO achievement_user;" || true
sudo -u postgres psql -c "ALTER USER achievement_user CREATEDB;" || true

# Настройка Nginx
log "Настраиваем Nginx..."
cp nginx.conf /etc/nginx/sites-available/achievement-api
ln -sf /etc/nginx/sites-available/achievement-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Настройка systemd сервиса
log "Настраиваем systemd сервис..."
cp systemd.service /etc/systemd/system/achievement-api.service
systemctl daemon-reload
systemctl enable achievement-api.service

# Настройка firewall
log "Настраиваем firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Настройка logrotate
log "Настраиваем logrotate..."
cat > /etc/logrotate.d/achievement-api << EOF
/var/log/achievement-api/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 achievement achievement
    postrotate
        systemctl reload achievement-api.service
    endscript
}
EOF

# Настройка мониторинга
log "Настраиваем мониторинг..."
apt install -y htop iotop nethogs

# Создание скрипта для бэкапов
log "Создаем скрипт для бэкапов..."
cat > /opt/achievement-api/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/achievement-api"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U achievement_user achievement_db > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап файлов приложения
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt achievement-api --exclude=node_modules

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Бэкап завершен: $DATE"
EOF

chmod +x /opt/achievement-api/backup.sh
chown achievement:achievement /opt/achievement-api/backup.sh

# Настройка cron для автоматических бэкапов
echo "0 2 * * * /opt/achievement-api/backup.sh" | crontab -u achievement -

# Создание файла с переменными окружения
log "Создаем файл с переменными окружения..."
cp env.example /opt/achievement-api/.env
chown achievement:achievement /opt/achievement-api/.env
chmod 600 /opt/achievement-api/.env

log "Настройка сервера завершена!"
log ""
log "Следующие шаги:"
log "1. Отредактируйте /opt/achievement-api/.env с вашими настройками"
log "2. Скопируйте код приложения в /opt/achievement-api/"
log "3. Выполните ./deploy.sh для развертывания"
log "4. Настройте SSL сертификаты для Nginx"
log "5. Обновите доменное имя в nginx.conf"
log ""
log "Полезные команды:"
log "- Статус сервиса: systemctl status achievement-api"
log "- Логи: journalctl -u achievement-api -f"
log "- Перезапуск: systemctl restart achievement-api"
log "- Статус Nginx: systemctl status nginx" 