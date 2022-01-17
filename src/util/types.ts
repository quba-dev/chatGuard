export const sharpSupportedType = (mimeType: string) => {
  const fileTypes = /jpeg|png|webp|tiff/;
  return fileTypes.test(mimeType.toLowerCase());
};
