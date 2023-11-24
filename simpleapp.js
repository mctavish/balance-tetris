const tetronimos = [
    {
        tile: 1,
        masks: [
            [1,1,1,1,
             0,0,0,0,
             0,0,0,0,
             0,0,0,0],
            [1,0,0,0,
             1,0,0,0,
             1,0,0,0,
             1,0,0,0],
           ]
    }
]

class Tetris extends Phaser.Scene {
    constructor() {
        super();
        this.tetronimo = null;

    }

    spawnTetronimo() {
        const id = Math.floor(Math.random() * tetronimos.length);
        this.tetronimo = {
            tile: tetronimos[id].tile,
            masks: tetronimos[id].masks,
            currentMask: 0,
            position: [5, 0]
        };
    }

    tetronimoDone() {
        if (this.tetronimo) {
            // TODO: Actual logic.
            if (this.tetronimo.position[1] == 10) {
                return true;
            }
        }
        return false;
    }

    moveTetronimo() {
        const mask = this.tetronimo.masks[this.tetronimo.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    this.setData(this.tetronimo.position[0] + x, this.tetronimo.position[1] + y, 0);
                }
            }
        }

        this.tetronimo.position[1] += 1;

        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    this.setData(this.tetronimo.position[0] + x, this.tetronimo.position[1] + y, this.tetronimo.tile);
                }
            }
        }
    }

    getData(x, y) {
        return this.data[x + y * this.width];
    }

    setData(x, y, value) {
        const index = x + y * this.width;
        this.data[index] = value;
        this.tiles[index].setFrame(value);
    }

    preload() {
        this.load.image('background', 'background.png');
        this.load.spritesheet('tiles', 'spritesheet.png', { frameWidth: 16, frameHeight: 16 });
    }


    create() {
        this.add.image(300, 400, 'background');

        const gridX1 = 60;
        const gridY1 = 70;
        const tileW = 32;
        const tileH = 32;
        this.width = 10;
        this.height = 20;

        this.tiles = new Array(this.width * this.height);
        this.data = new Array(this.width * this.height);

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                let index = x + y * this.width;
                this.tiles[index] = this.add.sprite(x * tileW + gridX1, y * tileH + gridY1, 'tiles', 0);
                this.tiles[index].scale = 2;
                this.data[index] = 2;
            }
        }

        this.nextTick = 0;
    }

    update(time, delta) {
        if (time > this.nextTick) {
            if (this.tetronimoDone()) {
                this.tetronimo = null;
            } else {
                if (this.tetronimo) {
                    this.moveTetronimo();
                } else {
                    this.spawnTetronimo();
                }
            }
            this.nextTick = time + 500;
        }
    }
};


const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 800,
    scene: Tetris,
};

const game = new Phaser.Game(config);