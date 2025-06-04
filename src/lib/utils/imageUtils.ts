export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const validateImageFile = (file: File): boolean => {
  // Validar el tipo de archivo
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  // Validar el tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  return true;
}; 