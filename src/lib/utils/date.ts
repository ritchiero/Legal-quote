export const formatDate = (date: Date, locale = 'es-MX'): string => {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

