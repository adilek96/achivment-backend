# 🚀 Быстрый старт - Развертывание Achievement API

## 📋 Что подготовлено

✅ **Конфигурация PM2** - `ecosystem.config.js`  
✅ **Скрипт развертывания** - `deploy.sh`  
✅ **Настройка сервера** - `setup-server.sh`  
✅ **Конфигурация Nginx** - `nginx.conf`  
✅ **Systemd сервис** - `systemd.service`  
✅ **Переменные окружения** - `env.example`  
✅ **Документация** - `DEPLOYMENT.md`

## 🎯 Быстрое развертывание (5 минут)

### 1. Подготовка сервера

```bash
# Подключитесь к серверу как root
ssh root@your-server-ip

# Скачайте проект
git clone https://github.com/your-repo/achievement-api.git
cd achievement-api

# Запустите автоматическую настройку
./setup-server.sh
```

### 2. Настройка базы данных

```bash
# Отредактируйте .env файл
nano /opt/achievement-api/.env

# Укажите ваши настройки:
DATABASE_URL="postgresql://achievement_user:your_password@localhost:5432/achievement_db"
CORS_ORIGIN="https://your-frontend-domain.com"
```

### 3. Развертывание

```bash
# Скопируйте код
cp -r . /opt/achievement-api/
chown -R achievement:achievement /opt/achievement-api

# Запустите развертывание
su - achievement
cd /opt/achievement-api
./deploy.sh production
```

### 4. Настройка домена

```bash
# Отредактируйте nginx.conf
nano /etc/nginx/sites-available/achievement-api
# Замените your-domain.com на ваш домен

# Перезапустите Nginx
systemctl restart nginx
```

### 5. SSL сертификат

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d your-domain.com
```

## ✅ Проверка развертывания

```bash
# Статус сервисов
systemctl status achievement-api nginx postgresql

# Проверка API
curl https://your-domain.com/health
curl https://your-domain.com/api/stats

# Логи
pm2 logs achievement-api
```

## 🔧 Управление приложением

```bash
# Перезапуск
pm2 restart achievement-api

# Остановка
pm2 stop achievement-api

# Логи
pm2 logs achievement-api

# Мониторинг
pm2 monit
```

## 📊 Мониторинг

- **API**: https://your-domain.com/api-docs
- **Health Check**: https://your-domain.com/health
- **Статистика**: https://your-domain.com/api/stats

## 🆘 Если что-то пошло не так

1. **Проверьте логи**: `pm2 logs achievement-api`
2. **Проверьте .env**: `cat /opt/achievement-api/.env`
3. **Проверьте БД**: `systemctl status postgresql`
4. **Перезапустите**: `pm2 restart achievement-api`

## 📞 Поддержка

Полная документация: [DEPLOYMENT.md](./DEPLOYMENT.md)
