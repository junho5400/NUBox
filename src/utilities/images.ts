const MAX_WIDTH = 1600;
const RATIO = 4 / 3;

/**
 * Center-crops a photo to 4:3, scales it to at most 1600px wide and re-encodes
 * it as JPEG. Every stored photo has the same shape, so every screen frames it
 * the way staff saw it when logging. Re-encoding also drops EXIF (location).
 */
export const prepareImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const crop =
    bitmap.width / bitmap.height > RATIO
      ? { w: bitmap.height * RATIO, h: bitmap.height }
      : { w: bitmap.width, h: bitmap.width / RATIO };
  const sx = (bitmap.width - crop.w) / 2;
  const sy = (bitmap.height - crop.h) / 2;
  const width = Math.round(Math.min(MAX_WIDTH, crop.w));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / RATIO);
  canvas.getContext('2d')?.drawImage(bitmap, sx, sy, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      'image/jpeg',
      0.85,
    ),
  );
};
