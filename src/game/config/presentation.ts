/** Logical units. These never depend on device pixels, CSS or touch input. */
export const GAMEPLAY_CAMERA = { width: 320, height: 180 } as const;
// Logical coordinates remain320×180; a four-times render grid preserves readable
// type and the approved artwork on modern displays without changing entity sizes.
export const INTERNAL_RENDER = { width: 1280, height: 720 } as const;
export const UI_CAMERA = { width: 320, height: 180 } as const;
export interface Insets { left: number; right: number; top: number; bottom: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface Presentation {
  device: { width: number; height: number; pixelRatio: number };
  safe: Rect;
  viewport: Rect;
  render: { width: number; height: number };
  controls: { left: Rect; right: Rect } | null;
}

/** Pure layout calculation; output is presentation only, never world geometry. */
export function calculatePresentation(width: number, height: number, pixelRatio: number, insets: Insets, touch: boolean): Presentation {
  const safe = { x: insets.left, y: insets.top,
    width: Math.max(1, width-insets.left-insets.right), height: Math.max(1, height-insets.top-insets.bottom) };
  const rail = touch ? Math.min(100, safe.width*.19) : 0;
  const availableWidth = Math.max(1, safe.width-rail*2);
  const scale = Math.min(availableWidth/16, safe.height/9);
  const viewport = { x: safe.x+(safe.width-scale*16)/2, y: safe.y+(safe.height-scale*9)/2, width: scale*16, height: scale*9 };
  // A stable native pixel grid: device density changes presentation, never art/physics.
  return { device: {width,height,pixelRatio}, safe, viewport,
    render: { ...INTERNAL_RENDER },
    controls: touch ? { left: {x:safe.x,y:safe.y,width:rail,height:safe.height},
      right:{x:safe.x+safe.width-rail,y:safe.y,width:rail,height:safe.height} } : null };
}
