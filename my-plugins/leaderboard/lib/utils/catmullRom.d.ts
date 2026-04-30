/**
 * Строит сглаженный SVG-путь через переданные точки методом Catmull-Rom → Bezier.
 * Используется и в большом тренд-графике модалки, и в миниатюрных sparkline в tooltip.
 */
export interface Point {
    x: number;
    y: number;
}
export declare function catmullRomSmoothPath(pts: Point[]): string;
//# sourceMappingURL=catmullRom.d.ts.map