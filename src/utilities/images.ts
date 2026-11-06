const MAX_SIDE = 1600;
/** The shape of every photo frame in the app. */
const RATIO = 4 / 3;
/** How far past "fills the frame" staff can zoom in. */
const ZOOM_PAST_FILL = 3;

/**
 * How staff framed a photo: quarter turns clockwise, zoom (1 shows the whole
 * photo), then where the frame sits along each axis the photo overflows
 * (0 is the left or top edge, 1 the right or bottom).
 */
export interface Framing {
  turns: number;
  zoom: number;
  x: number;
  y: number;
}

export const CENTERED: Framing = { turns: 0, zoom: 1, x: 0.5, y: 0.5 };

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/** A photo's size after a number of quarter turns clockwise. */
export const rotatedSize = (width: number, height: number, turns: number) =>
  turns % 2 ? { w: height, h: width } : { w: width, h: height };

/** The most staff can zoom in: a few times past the zoom where the photo fills the frame. */
export const maxZoom = (width: number, height: number, turns: number) => {
  const { w, h } = rotatedSize(width, height, turns);
  return ZOOM_PAST_FILL * Math.max(w / h / RATIO, RATIO / (w / h));
};

/**
 * The 4:3 area the frame shows, in rotated photo pixels. At zoom 1 it is the
 * smallest 4:3 area holding the whole photo. On an axis where the area is
 * longer than the photo, it stays centered, so a saved photo shown centered
 * in a frame looks just like the preview.
 */
export const frameView = (width: number, height: number, { turns, zoom, x, y }: Framing) => {
  const { w, h } = rotatedSize(width, height, turns);
  const fit = w / h > RATIO ? { w, h: w / RATIO } : { w: h * RATIO, h };
  const vw = fit.w / zoom;
  const vh = fit.h / zoom;
  return {
    w,
    h,
    view: { w: vw, h: vh, x: vw < w ? (w - vw) * x : (w - vw) / 2, y: vh < h ? (h - vh) * y : (h - vh) / 2 },
  };
};

/** The part of the photo inside the frame: what gets saved. */
export const frameCrop = (width: number, height: number, framing: Framing) => {
  const { w, h, view } = frameView(width, height, framing);
  const x = Math.max(0, view.x);
  const y = Math.max(0, view.y);
  return { w, h, crop: { x, y, w: Math.min(w, view.x + view.w) - x, h: Math.min(h, view.y + view.h) - y } };
};

/** Whether the photo is larger than the frame on either axis, so dragging does something. */
export const canPan = (width: number, height: number, framing: Framing) => {
  const { w, h, view } = frameView(width, height, framing);
  return view.w < w * 0.999 || view.h < h * 0.999;
};

/** Zooms, keeping the middle of the frame on the same spot of the photo. */
export const zoomTo = (width: number, height: number, framing: Framing, zoom: number): Framing => {
  const next = clamp(zoom, 1, maxZoom(width, height, framing.turns));
  const { w, h, view } = frameView(width, height, framing);
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  const after = frameView(width, height, { ...framing, zoom: next }).view;
  return {
    ...framing,
    zoom: next,
    x: after.w < w ? clamp((cx - after.w / 2) / (w - after.w)) : 0.5,
    y: after.h < h ? clamp((cy - after.h / 2) / (h - after.h)) : 0.5,
  };
};

/** Moves the photo by a distance given in frame widths and heights, the way a drag does. */
export const panBy = (width: number, height: number, framing: Framing, dx: number, dy: number): Framing => {
  const { w, h, view } = frameView(width, height, framing);
  return {
    ...framing,
    x: view.w < w ? clamp(framing.x - (dx * view.w) / (w - view.w)) : framing.x,
    y: view.h < h ? clamp(framing.y - (dy * view.h) / (h - view.h)) : framing.y,
  };
};

/** Places an img in a 4:3 frame so the frame shows exactly the area prepareImage saves. */
export const framedStyle = (width: number, height: number, framing: Framing) => {
  const { w, h, view } = frameView(width, height, framing);
  const across = w / view.w;
  const down = h / view.h;
  const sideways = framing.turns % 2 === 1;
  return {
    left: `${((w / 2 - view.x) / view.w) * 100}%`,
    top: `${((h / 2 - view.y) / view.h) * 100}%`,
    width: `${(sideways ? down / RATIO : across) * 100}%`,
    height: `${(sideways ? across * RATIO : down) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${framing.turns * 90}deg)`,
  };
};

/**
 * Rotates a photo and keeps the part inside the frame as staff framed it,
 * scales it so its longer side is at most 1600px, and re-encodes it as JPEG.
 * Zoomed all the way out, nothing is cut. Re-encoding also drops EXIF (location).
 */
export const prepareImage = async (file: File, framing: Framing = CENTERED): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const { w, h, crop } = frameCrop(bitmap.width, bitmap.height, framing);
  const scale = Math.min(1, MAX_SIDE / Math.max(crop.w, crop.h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(crop.w * scale);
  canvas.height = Math.round(crop.h * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
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
