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









# Создание директорий
log "Создаем директории..."
mkdir -p /opt/achievement-api
mkdir -p /opt/achievement-api/logs
mkdir -p /var/log/achievement-api

# Настройка прав доступа
chown -R achievement:achievement /opt/achievement-api
chown -R achievement:achievement /var/log/achievement-api



# Настройка systemd сервиса
log "Настраиваем systemd сервис..."
cp systemd.service /etc/systemd/system/achievement-api.service
systemctl daemon-reload
systemctl enable achievement-api.service



