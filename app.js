const tetronimos = [
    {
        tile: 1,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             1,1,1,1,
             0,0,0,0,
             0,0,0,0],
            [0,1,0,0,
             0,1,0,0,
             0,1,0,0,
             0,1,0,0],
           ]
    },
    {
        tile: 2,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             0,0,1,0,
             1,1,1,0,
             0,0,0,0],
            [0,1,1,0,
             0,0,1,0,
             0,0,1,0,
             0,0,0,0],
            [0,0,0,0,
             1,1,1,0,
             1,0,0,0,
             0,0,0,0],
            [0,1,0,0,
             0,1,0,0,
             0,1,1,0,
             0,0,0,0],
        ],
    },
    {
        tile: 3,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             1,0,0,0,
             1,1,1,0,
             0,0,0,0],
            [0,0,1,0,
             0,0,1,0,
             0,1,1,0,
             0,0,0,0],
            [0,0,0,0,
             1,1,1,0,
             0,0,1,0,
             0,0,0,0],
            [0,1,1,0,
             0,1,0,0,
             0,1,0,0,
             0,0,0,0],
        ],
    },
    {
        tile: 4,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             0,1,1,0,
             0,1,1,0,
             0,0,0,0],
        ],
    },
    {
        tile: 5,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             0,1,0,0,
             1,1,1,0,
             0,0,0,0],
            [0,1,0,0,
             0,1,1,0,
             0,1,0,0,
             0,0,0,0],
            [0,0,0,0,
             1,1,1,0,
             0,1,0,0,
             0,0,0,0],
            [0,1,0,0,
             1,1,0,0,
             0,1,0,0,
             0,0,0,0],
        ],
    },
    {
        tile: 6,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             1,1,0,0,
             0,1,1,0,
             0,0,0,0],
            [0,0,1,0,
             0,1,1,0,
             0,1,0,0,
             0,0,0,0],
        ],
    },
    {
        tile: 7,
        startOffset: -1,
        masks: [
            [0,0,0,0,
             0,1,1,0,
             1,1,0,0,
             0,0,0,0],
            [0,1,0,0,
             0,1,1,0,
             0,0,1,0,
             0,0,0,0],
        ],
    },
]



class Tetris extends Phaser.Scene {
    constructor() {
        super();
        this.tetronimo = null;

    }

    spawnTetronimo() {
        const id = Math.floor(Math.random() * tetronimos.length);
        const tiltLoss = Math.abs(this.currentTilt);
        this.tetronimo = {
            tile: tetronimos[id].tile,
            masks: tetronimos[id].masks,
            currentMask: 0,
            position: [3, tetronimos[id].startOffset + tiltLoss]
        };
        this.showTetronimo();
        if (this.isBlocked([0, 0], 0)) {
            this.gameOver();
        }
    }

    // TODO: Factor out all this duplicated code.
    finalizeTetronimo() {
        const mask = this.tetronimo.masks[this.tetronimo.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = this.tetronimo.position[0] + x;
                    const py = this.tetronimo.position[1] + y + this.tiltAdjust(px);

                    this.setData(px, py, this.tetronimo.tile);
                }
            }
        }

        this.completeLines();

        this.updateWeights();

        this.tetronimo = null;
    }

    updateWeights() {
        let leftWeight = 0;
        let rightWeight = 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width / 2; x++) {
                if (this.getData(x, y)) {
                    leftWeight++;
                }
            }
            for (let x = this.width / 2; x < this.width; x++) {
                if (this.getData(x, y)) {
                    rightWeight++;
                }
            }
        }
        this.setNumber(this.leftWeightNumbers, leftWeight);
        this.setNumber(this.rightWeightNumbers, rightWeight);

        this.setTilt(Math.trunc((leftWeight - rightWeight) / 10));
    }

    setTilt(newTilt) {
        if (Math.abs(newTilt) > 2) {
            this.gameOver();
            return;
        }
        if (this.currentTilt != newTilt) {
            const tiltDiff = newTilt - this.currentTilt;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width / 2; x++) {
                    this.moveTile(x, y, tiltDiff);
                }
                for (let x = this.width / 2; x < this.width; x++) {
                    this.moveTile(x, y, -tiltDiff);
                }
            }
            this.currentTilt = newTilt;
            this.background.setFrame(2-newTilt);
            this.completeLines();
        }
    }

    addScore(value) {
        this.score += value;
        this.setNumber(this.scoreNumbers, this.score);
    }

    /** Looks for complete lines.  If found, removes them and drops the rows above down. */
    completeLines() {
        let lineCount = 0;
        for (let y = 0; y < this.height; y++) {
            let completeLine = true;
            for (let x = 0; x < this.width; x++) {
                const py = y + this.tiltAdjust(x);
                if (this.getData(x, py) == 0) {
                    completeLine = false;
                }
            }
            if (completeLine) {
                lineCount++;
                for (let y2 = y; y2 > 0; y2--) {
                    for (let x = 0; x < this.width; x++) {
                        const py = y2 + this.tiltAdjust(x)
                        this.setData(x, py, this.getData(x, py-1));
                    }
                }
                for (let x = 0; x < this.width; x++) {
                    this.setData(x, 0, this.getData(x, 0));
                }
            }
        }
        if (lineCount > 0) {
            if (lineCount == 1) {
                this.addScore(40);
            } else if (lineCount == 2) {
                this.addScore(100);
            } else if (lineCount == 3) {
                this.addScore(300);
            } else if (lineCount == 4) {
                this.addScore(1200);
            }
        }
    }

    hideTetronimo() {
        const mask = this.tetronimo.masks[this.tetronimo.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = this.tetronimo.position[0] + x;
                    const py = this.tetronimo.position[1] + y + this.tiltAdjust(px);
                    this.setTile(px, py, 0);
                }
            }
        }
    }

    showTetronimo() {
        const mask = this.tetronimo.masks[this.tetronimo.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = this.tetronimo.position[0] + x;
                    const py = this.tetronimo.position[1] + y + this.tiltAdjust(px);
                    this.setTile(px, py, this.tetronimo.tile);
                }
            }
        }
    }

    tiltAdjust(x) {
        if (x < this.width / 2) {
            return Math.floor(-this.currentTilt / 2);
        } else {
            return Math.floor(this.currentTilt / 2);
        }
    }

    isBlocked(delta, rotation) {
        const mask = this.tetronimo.masks[(this.tetronimo.currentMask + rotation) % this.tetronimo.masks.length];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = this.tetronimo.position[0] + x + delta[0];
                    const py = this.tetronimo.position[1] + y + delta[1] + this.tiltAdjust(px);

                    if (py < 0 || py >= this.height || px < 0 || px >= this.width) {
                        return true;
                    }

                    const data = this.getData(px, py);
                    if (data) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    moveTetronimo(delta) {
        this.hideTetronimo();
        this.tetronimo.position[0] += delta[0];
        this.tetronimo.position[1] += delta[1];
        this.showTetronimo();
    }

    rotateTetronimo(rotation) {
        this.hideTetronimo();
        this.tetronimo.currentMask = (this.tetronimo.currentMask + rotation) % this.tetronimo.masks.length;
        this.showTetronimo();
    }

    tick() {
        if (this.isBlocked([0, 1], 0)) {
            this.finalizeTetronimo();
        } else {
            this.moveTetronimo([0, 1]);
        }
    }

    getData(x, y) {
        if (y < 0 || y >= this.height) {
            return 0;
        }
        return this.data[x + y * this.width];
    }

    moveTile(x, y, delta) {
        const index = x + y * this.width;
        this.tiles[index].y += delta * this.tileH / 2;
    }

    setTile(x, y, value) {
        const index = x + y * this.width;
        this.tiles[index].setFrame(value);
    }

    setData(x, y, value) {
        const index = x + y * this.width;
        this.data[index] = value;
        this.tiles[index].setFrame(value);
    }

    setNumber(numberTiles, value) {
        const digits = numberTiles.length;
        let digitValue = 10 ** (digits - 1);
        for (let i = 0; i < digits; i++) {
            if (value < digitValue && digitValue > 1) {
                numberTiles[i].setVisible(false);
            } else {
                const digit = Math.floor(value / digitValue) % 10;
                numberTiles[i].setVisible(true);
                numberTiles[i].setFrame(8 + digit);
            }
            digitValue /= 10;
        }
    }

    preload() {
        this.load.spritesheet('background', 'background.png', { frameWidth: 600, frameHeight: 800});
        this.load.spritesheet('tiles', 'spritesheet.png', { frameWidth: 16, frameHeight: 16 });
    }

    gameOver() {
        this.playing = false;
    }

    /** Changes keyboard events into requests to the gameloop. */
    inputHandler(event) {
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) {
            this.moveRequested[0] = 1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) {
            this.moveRequested[0] = -1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) {
            this.moveRequested[1] = 1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) {
            this.rotateRequested = true;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.SPACE) {
            this.dropRequested = true;
        }
    }

    create() {
        this.background = this.add.sprite(300, 400, 'background', 2);

        const gridX = 60;
        const gridY = 70;
        this.tileW = 32;
        this.tileH = 32;
        const leftWeightX = 50;
        const rightWeightX = 250;
        const weightY = 770;
        const scoreX = 400;
        const scoreY = 140;
        this.tileScale = 2;
        this.width = 10;
        this.height = 20;

        this.tiles = new Array(this.width * this.height);
        this.data = new Array(this.width * this.height);

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                let index = x + y * this.width;
                this.tiles[index] = this.add.sprite(x * this.tileW + gridX, y * this.tileH + gridY, 'tiles', 0);
                this.tiles[index].scale = this.tileScale;
                this.data[index] = 0;
            }
        }

        this.leftWeightNumbers = new Array(3);
        this.rightWeightNumbers = new Array(3);
        for (let i = 0; i < 3; i++) {
            this.leftWeightNumbers[i] = this.add.sprite(i * this.tileW + leftWeightX, weightY, 'tiles', 0);
            this.leftWeightNumbers[i].scale = this.tileScale;
            this.rightWeightNumbers[i] = this.add.sprite(i * this.tileW + rightWeightX, weightY, 'tiles', 0);
            this.rightWeightNumbers[i].scale = this.tileScale;
        }

        const scoreDigits = 6;
        this.scoreNumbers = new Array(scoreDigits);
        for (let i = 0; i < scoreDigits; i++) {
            this.scoreNumbers[i] = this.add.sprite(i * this.tileW + scoreX, scoreY, 'tiles', 0);
            this.scoreNumbers[i].scale = this.tileScale;
        }

        this.nextTick = 0;
        this.moveRequested = [0, 0];
        this.dropRequested = false;
        this.rotateRequested = false;
        this.playing = true;
        this.tickInterval = 500;
        this.score = 0;
        this.currentTilt = 0;

        this.input.keyboard.on('keydown', this.inputHandler, this);

        this.updateWeights();
        this.addScore(0);
    }

    setNextTickTime() {
        this.nextTick = this.currentTime + this.tickInterval;
    }

    processInput() {
        if (this.moveRequested[0] || this.moveRequested[1]) {
            if (this.tetronimo) {
                if (!this.isBlocked(this.moveRequested, 0)) {
                    this.moveTetronimo(this.moveRequested);
                    if (this.moveRequested[1] > 0) {
                        this.setNextTickTime();
                    }
                }
            }
            this.moveRequested = [0, 0];
        }
        if (this.rotateRequested) {
            if (this.tetronimo) {
                if (!this.isBlocked([0, 0], 1)) {
                    this.rotateTetronimo(1);
                }
            }

            this.rotateRequested = false;
        }
        if (this.dropRequested) {
            if (this.tetronimo) {
                let dy = 0;
                while (!this.isBlocked([0, dy], 0)) {
                    dy++;
                }
                this.moveTetronimo([0, dy-1]);
                this.finalizeTetronimo();
                this.setNextTickTime();
                this.addScore(dy);
            }
            this.dropRequested = false;
        }
    }

    update(time, delta) {
        if (this.playing) {
            this.currentTime = time;
            this.processInput();

            if (time > this.nextTick) {
                if (this.tetronimo) {
                    this.tick();
                } else {
                    this.spawnTetronimo();
                }
                this.setNextTickTime();
            }
        }
    }
};


const config = {
    type: Phaser.CANVAS,
    width: 600,
    height: 800,
    scene: Tetris,
};

const game = new Phaser.Game(config);