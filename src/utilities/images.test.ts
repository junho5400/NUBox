import { describe, expect, it } from 'vitest';
import { CENTERED, canPan, frameCrop, framedStyle, maxZoom, panBy, rotatedSize, zoomTo } from './images';

const pct = (s: string) => Math.round(parseFloat(s) * 10) / 10;
const round = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));

describe('images', () => {
  it('swaps width and height on a quarter turn', () => {
    expect(rotatedSize(4000, 3000, 1)).toEqual({ w: 3000, h: 4000 });
    expect(rotatedSize(4000, 3000, 2)).toEqual({ w: 4000, h: 3000 });
  });

  it('keeps the whole photo when zoomed out', () => {
    expect(frameCrop(3000, 4000, CENTERED).crop).toEqual({ x: 0, y: 0, w: 3000, h: 4000 });
    expect(frameCrop(4000, 3000, { ...CENTERED, turns: 1 }).crop).toEqual({ x: 0, y: 0, w: 3000, h: 4000 });
    expect(canPan(3000, 4000, CENTERED)).toBe(false);
  });

  it('crops a 4:3 area once zoomed in to fill the frame', () => {
    // A portrait photo fills the frame at 4/3 ÷ 3/4 = 16/9.
    const filled = zoomTo(3000, 4000, CENTERED, 16 / 9);
    expect(round(frameCrop(3000, 4000, filled).crop)).toEqual({ x: 0, y: 875, w: 3000, h: 2250 });
    expect(round(frameCrop(3000, 4000, { ...filled, y: 0 }).crop)).toEqual({ x: 0, y: 0, w: 3000, h: 2250 });
  });

  it('keeps zoom within limits', () => {
    expect(zoomTo(4000, 3000, CENTERED, 0.2).zoom).toBe(1);
    expect(zoomTo(4000, 3000, CENTERED, 99).zoom).toBe(maxZoom(4000, 3000, 0));
  });

  it('zooms around the middle of the frame', () => {
    const zoomed = zoomTo(4000, 3000, { ...CENTERED, zoom: 2, x: 0, y: 0 }, 2.5);
    // Was showing 0–2000 across, middle at 1000; at 2.5× it shows 1600 wide, so 200–1800.
    expect(round(frameCrop(4000, 3000, zoomed).crop)).toMatchObject({ x: 200, w: 1600 });
  });

  it('pans opposite to the drag and stops at the edges', () => {
    const zoomed = { ...CENTERED, zoom: 2 };
    // Dragging right by half the frame shows more of the left.
    expect(panBy(4000, 3000, zoomed, 0.5, 0).x).toBe(0);
    expect(panBy(4000, 3000, zoomed, -5, 0).x).toBe(1);
    // A sideways-short axis that's letterboxed doesn't move.
    expect(panBy(3000, 4000, CENTERED, 0.5, 0.5)).toEqual(CENTERED);
  });

  it('places the preview so its frame edges are the saved edges', () => {
    const whole = framedStyle(3000, 4000, CENTERED);
    expect([pct(whole.left), pct(whole.top), pct(whole.width), pct(whole.height)]).toEqual([50, 50, 56.3, 100]);
    // A sideways 4:3 photo: the img box is 4:3 before rotating and shows 3:4 after.
    const turned = framedStyle(4000, 3000, { ...CENTERED, turns: 1 });
    expect([pct(turned.width), pct(turned.height)]).toEqual([75, 75]);
    expect(turned.transform).toBe('translate(-50%, -50%) rotate(90deg)');
  });
});
