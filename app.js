WIDTH = 32
HEIGHT = 32



class Tetris extends Phaser.Scene {
    wellX = 1
    wellY = 1

    wellWidth = 10
    wellHeight = 20
    

    preload() {
        this.load.image('tiles', 'spritesheet.png');
    }

    create() {
        const tilemapData = new Array(HEIGHT).fill(1).map(() => new Array(WIDTH).fill(1));

        for (let column = this.wellX; column < this.wellX + this.wellWidth; column++) {
            for (let row = this.wellY; row < this.wellY + this.wellHeight; row++) {
                tilemapData[row][column] = 0;
            }
        }

        const map = this.make.tilemap({
            data: tilemapData,
            tileWidth: 16,
            tileHeight: 16,
            width: WIDTH,
            height: HEIGHT,
        });
        var tileset = map.addTilesetImage('tiles');
        const layer = map.createLayer(0, tileset);

    }
}

const config = {
    type: Phaser.AUTO,
    width: 16 * WIDTH,
    height: 16 * HEIGHT,
    scene: Tetris,
};

const game = new Phaser.Game(config);