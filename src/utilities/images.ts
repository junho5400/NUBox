const MAX_WIDTH = 1600;
const RATIO = 4 / 3;

/**
 * How staff framed a photo: quarter turns clockwise, then where the 4:3 crop
 * sits along each axis (0 is the left or top edge, 1 the right or bottom).
 */
export interface Framing {
  turns: number;
  x: number;
  y: number;
}

export const CENTERED: Framing = { turns: 0, x: 0.5, y: 0.5 };

/**
 * The rotated size of a photo and the largest 4:3 crop inside it, in rotated
 * pixels. Only one axis ever has room to move, since the crop fills the other.
 */
export const frameCrop = (width: number, height: number, { turns, x, y }: Framing) => {
  const [w, h] = turns % 2 ? [height, width] : [width, height];
  const crop = w / h > RATIO ? { w: h * RATIO, h } : { w, h: w / RATIO };
  return { w, h, crop: { ...crop, x: (w - crop.w) * x, y: (h - crop.h) * y } };
};

/**
 * The axis the crop can move along, and how much longer the photo is than the
 * frame on that axis (in frame lengths). Null when the photo is already 4:3.
 */
export const freeAxis = (width: number, height: number, turns: number): { axis: 'x' | 'y'; room: number } | null => {
  const { w, h, crop } = frameCrop(width, height, { ...CENTERED, turns });
  if (w / crop.w > 1.001) return { axis: 'x', room: w / crop.w - 1 };
  if (h / crop.h > 1.001) return { axis: 'y', room: h / crop.h - 1 };
  return null;
};

/** Places an img in a 4:3 frame so the frame shows exactly the crop prepareImage saves. */
export const framedStyle = (width: number, height: number, framing: Framing) => {
  const { w, h, crop } = frameCrop(width, height, framing);
  const across = w / crop.w;
  const down = h / crop.h;
  const sideways = framing.turns % 2 === 1;
  return {
    left: `${((w / 2 - crop.x) / crop.w) * 100}%`,
    top: `${((h / 2 - crop.y) / crop.h) * 100}%`,
    width: `${(sideways ? down / RATIO : across) * 100}%`,
    height: `${(sideways ? across * RATIO : down) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${framing.turns * 90}deg)`,
  };
};

/**
 * Rotates and crops a photo to 4:3 as framed, scales it to at most 1600px wide
 * and re-encodes it as JPEG. Every stored photo has the same shape, so every
 * screen shows exactly what staff saw when logging. Re-encoding also drops
 * EXIF (location).
 */
export const prepareImage = async (file: File, framing: Framing = CENTERED): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const { w, h, crop } = frameCrop(bitmap.width, bitmap.height, framing);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(Math.min(MAX_WIDTH, crop.w));
  canvas.height = Math.round(canvas.width / RATIO);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(canvas.width / crop.w, canvas.height / crop.h);
    ctx.translate(w / 2 - crop.x, h / 2 - crop.y);
    ctx.rotate((framing.turns * Math.PI) / 2);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  }
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      'image/jpeg',
      0.85,
    ),
  );
};
