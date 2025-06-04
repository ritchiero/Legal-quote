export const formatPrice = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(numbers) / 100);
  
    return formatted;
  };