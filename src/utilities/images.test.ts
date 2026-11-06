import { describe, expect, it } from 'vitest';
import { CENTERED, frameCrop, framedStyle, freeAxis } from './images';

const pct = (s: string) => Math.round(parseFloat(s) * 10) / 10;

describe('images', () => {
  it('crops the largest 4:3 area, placed along the free axis', () => {
    expect(frameCrop(3000, 4000, CENTERED).crop).toEqual({ w: 3000, h: 2250, x: 0, y: 875 });
    expect(frameCrop(3000, 4000, { turns: 0, x: 0.5, y: 0 }).crop.y).toBe(0);
    expect(frameCrop(3000, 4000, { turns: 0, x: 0.5, y: 1 }).crop.y).toBe(1750);
  });

  it('crops after rotating', () => {
    const { w, h, crop } = frameCrop(4000, 3000, { turns: 1, x: 0.5, y: 0.5 });
    expect([w, h]).toEqual([3000, 4000]);
    expect(crop).toEqual({ w: 3000, h: 2250, x: 0, y: 875 });
  });

  it('knows which way a photo can move', () => {
    expect(freeAxis(4000, 3000, 0)).toBeNull();
    expect(freeAxis(3000, 4000, 0)).toMatchObject({ axis: 'y' });
    expect(freeAxis(1920, 1080, 0)).toMatchObject({ axis: 'x' });
    expect(freeAxis(1920, 1080, 1)).toMatchObject({ axis: 'y' });
  });

  it('places the preview so its frame edges are the crop edges', () => {
    const top = framedStyle(3000, 4000, { turns: 0, x: 0.5, y: 0 });
    expect([pct(top.left), pct(top.top), pct(top.width), pct(top.height)]).toEqual([50, 88.9, 100, 177.8]);
    // A sideways 4:3 photo: the img is 4:3 before rotating, so its box is wider than the frame.
    const turned = framedStyle(4000, 3000, { turns: 1, x: 0.5, y: 0.5 });
    expect([pct(turned.left), pct(turned.top), pct(turned.width), pct(turned.height)]).toEqual([50, 50, 133.3, 133.3]);
    expect(turned.transform).toBe('translate(-50%, -50%) rotate(90deg)');
  });
});
