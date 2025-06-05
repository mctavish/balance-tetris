import { Point } from './point';
import { TetronimoDef } from './tetronimos';

export class Tetronimo {
    tile: number;
    currentMask: number;
    position: Point;
    masks: Array<Array<number>>;

    constructor(def: TetronimoDef, tiltLoss: number) {
        this.tile = def.tile,
        this.masks = def.masks,
        this.currentMask = 0,
        this.position = new Point(3, def.startOffset + tiltLoss)
    };
}
