export class Point {
    x: number = 0;
    y: number = 0;

    constructor();
    constructor(x: number, y: number);
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    plus(p: Point): Point {
        return new Point(this.x + p.x, this.y + p.y);
    }
}
