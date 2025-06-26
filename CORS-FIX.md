# Исправление CORS ошибки для PATCH запросов

## 🐛 Проблема

```
Access to XMLHttpRequest at 'http://localhost:3000/categories/...' from origin 'http://localhost:3001' has been blocked by CORS policy: Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.
```

## ✅ Решение

Добавлен метод `PATCH` в разрешенные методы CORS в файле `index.js`:

```javascript
// CORS middleware
app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ← PATCH добавлен
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

## 🔄 Что было сделано

1. **Исправлен импорт API** в `frontend-next/app/categories/page.js`:

   - Заменен `import { api }` на `import { categoriesAPI }`
   - Используются специализированные методы: `categoriesAPI.getAll()`, `categoriesAPI.update()`, `categoriesAPI.create()`, `categoriesAPI.delete()`

2. **Обновлены настройки CORS** в `index.js`:

   - Добавлен метод `PATCH` в массив `methods`

3. **Перезапущен сервер** для применения изменений

## 🧪 Проверка

Теперь все CRUD операции должны работать:

- ✅ GET /categories - получение списка
- ✅ POST /categories - создание
- ✅ PATCH /categories/:id - обновление
- ✅ DELETE /categories/:id - удаление

## 🌐 Доступные адреса

- **Бэкенд**: http://localhost:3000
- **Фронтенд**: http://localhost:3001
- **API документация**: http://localhost:3000/api-docs

## 📝 Примечание

Если возникнут аналогичные проблемы с другими страницами (достижения, награды, прогресс), нужно будет аналогично исправить импорты API в соответствующих компонентах.
