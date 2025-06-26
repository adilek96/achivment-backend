// Поддерживаемые языки
export const SUPPORTED_LANGUAGES = {
  en: "English",
  ru: "Русский",
  tr: "Türkçe",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  gr: "Ελληνικά",
};

// Язык по умолчанию
export const DEFAULT_LANGUAGE = "en";

/**
 * Получить перевод из JSON объекта переводов
 * @param {Object} translations - Объект с переводами {"en": "...", "ru": "..."}
 * @param {string} language - Код языка
 * @param {string} fallbackLanguage - Язык для fallback
 * @returns {string} Перевод или fallback
 */
export function getTranslation(
  translations,
  language = DEFAULT_LANGUAGE,
  fallbackLanguage = DEFAULT_LANGUAGE
) {
  if (!translations || typeof translations !== "object") {
    return "";
  }

  // Если переводы - это строка (старый формат), возвращаем как есть
  if (typeof translations === "string") {
    return translations;
  }

  // Пытаемся получить перевод на запрошенном языке
  if (translations[language]) {
    return translations[language];
  }

  // Fallback на язык по умолчанию
  if (translations[fallbackLanguage]) {
    return translations[fallbackLanguage];
  }

  // Если ничего не найдено, возвращаем первый доступный перевод
  const firstTranslation = Object.values(translations)[0];
  return firstTranslation || "";
}

/**
 * Создать объект переводов с пустыми значениями
 * @returns {Object} Объект с пустыми переводами для всех языков
 */
export function createEmptyTranslations() {
  const translations = {};
  Object.keys(SUPPORTED_LANGUAGES).forEach((lang) => {
    translations[lang] = "";
  });
  return translations;
}

/**
 * Создать объект переводов с одним значением для всех языков
 * @param {string} value - Значение для всех языков
 * @returns {Object} Объект с одинаковым значением для всех языков
 */
export function createTranslations(value) {
  const translations = {};
  Object.keys(SUPPORTED_LANGUAGES).forEach((lang) => {
    translations[lang] = value;
  });
  return translations;
}

/**
 * Проверить, является ли объект валидным переводом
 * @param {Object} translations - Объект для проверки
 * @returns {boolean} true если это валидный объект переводов
 */
export function isValidTranslations(translations) {
  if (!translations || typeof translations !== "object") {
    return false;
  }

  // Проверяем, что есть хотя бы один перевод
  return (
    Object.keys(translations).length > 0 &&
    Object.values(translations).some((value) => value && value.trim() !== "")
  );
}

/**
 * Получить список языков с переводами
 * @param {Object} translations - Объект с переводами
 * @returns {Array} Массив языков, для которых есть переводы
 */
export function getAvailableLanguages(translations) {
  if (!translations || typeof translations !== "object") {
    return [];
  }

  return Object.keys(translations).filter(
    (lang) => translations[lang] && translations[lang].trim() !== ""
  );
}
