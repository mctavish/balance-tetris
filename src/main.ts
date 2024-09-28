import Phaser from 'phaser';

import { Tetronimos } from './tetronimos';

// @ts-ignore
import ImgBackground from './images/background.png';
// @ts-ignore
import ImgSpriteSheet from './images/spritesheet.png';
// @ts-ignore
import AudBaDing from './audio/tetris-ba-ding.ogg';
// @ts-ignore
import AudThud from './audio/tetris-thud.ogg';

const INITIAL_INTERVAL = 500;
const INTERVAL_SPEEDUP = 0.8;
const INTERVAL_LINES = 10;

const TILT_THRESHOLD = 8;

class Tetronimo {
    tile: number;
    startOffset?: number;  // Code smell!
    currentMask: number;
    position: Array<number>;
    masks: Array<Array<number>>;
}

class Tetris extends Phaser.Scene {
    // Definition
    height: number;
    width: number;

    tileScale: number;
    tileW: number;
    tileH: number;

    currentTime: number;
    nextTick: number;

    // State
    tetronimo?: Tetronimo;
    currentTilt: number;
    completedLines: number;
    score: number;
    tileData: Array<number>;

    playing: boolean;

    moveRequested: Array<number>;
    rotateRequested: boolean;
    dropRequested: boolean;

    // UI
    newGameButton: Phaser.GameObjects.Text;
    scoreNumbers: Array<Phaser.GameObjects.Sprite>;
    leftWeightNumbers: Array<Phaser.GameObjects.Sprite>;
    rightWeightNumbers: Array<Phaser.GameObjects.Sprite>;

    tiles: Array<Phaser.GameObjects.Sprite>;

    // Resources
    background: Phaser.GameObjects.Sprite;
    soundThudd: Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound;
    soundBaDing: Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound;

    constructor() {
        super();
        this.tetronimo = undefined;

    }

    // Creates a new random Tetronimo at the top of the screen.
    spawnTetronimo() {
        const id = Math.floor(Math.random() * Tetronimos.length);
        const tiltLoss = Math.abs(this.currentTilt);
        this.tetronimo = {
            tile: Tetronimos[id].tile,
            masks: Tetronimos[id].masks,
            currentMask: 0,
            position: [3, Tetronimos[id].startOffset + tiltLoss]
        };
        this.showTetronimo();
        if (this.isBlocked([0, 0], 0)) {
            this.gameOver();
        }
    }

    // TODO: Factor out all this duplicated code.
    finalizeTetronimo() {
        const t = this.tetronimo!;
        this.soundThudd.play();
        const mask = t.masks[t.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = t.position[0] + x;
                    const py = t.position[1] + y + this.tiltAdjust(px);

                    this.setData(px, py, t.tile);
                }
            }
        }

        this.completeLines();

        this.updateWeights();

        this.tetronimo = undefined;
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

        this.setTilt(Math.trunc((leftWeight - rightWeight) / TILT_THRESHOLD));
    }

    setTilt(newTilt: number) {
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

    addScore(value: number) {
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
            this.soundBaDing.play();
            this.completedLines += lineCount;
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
        const t = this.tetronimo!;  // TODO: This optional model is pretty clearly broken.
        const mask = t.masks[t.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = t.position[0] + x;
                    const py = t.position[1] + y + this.tiltAdjust(px);
                    this.setTile(px, py, 0);
                }
            }
        }
    }

    showTetronimo() {
        const t = this.tetronimo!;  // TODO: This optional model is pretty clearly broken.
        const mask = t.masks[t.currentMask];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = t.position[0] + x;
                    const py = t.position[1] + y + this.tiltAdjust(px);
                    this.setTile(px, py, t.tile);
                }
            }
        }
    }

    tiltAdjust(x: number) {
        if (x < this.width / 2) {
            return Math.floor(-this.currentTilt / 2);
        } else {
            return Math.floor(this.currentTilt / 2);
        }
    }

    isBlocked(delta: Array<number>, rotation: number) {
        const t = this.tetronimo!;  // TODO: Code defensively.
        const mask = t.masks[(t.currentMask + rotation) % t.masks.length];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (mask[x + y * 4]) {
                    const px = t.position[0] + x + delta[0];
                    const py = t.position[1] + y + delta[1] + this.tiltAdjust(px);

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

    moveTetronimo(delta: Array<number>) {   // TODO: Change to a custom type.
        this.hideTetronimo();
        this.tetronimo!.position[0] += delta[0];  // TODO: Be defensive.
        this.tetronimo!.position[1] += delta[1];
        this.showTetronimo();
    }

    rotateTetronimo(rotation: number) {
        this.hideTetronimo();
        const t = this.tetronimo!;  // TODO: Be defensive.
        t.currentMask = (t.currentMask + rotation) % t.masks.length;
        this.showTetronimo();
    }

    tick() {
        if (this.isBlocked([0, 1], 0)) {
            this.finalizeTetronimo();
        } else {
            this.moveTetronimo([0, 1]);
        }
    }

    getData(x: number, y: number) {
        if (y < 0 || y >= this.height) {
            return 0;
        }
        return this.tileData[x + y * this.width];
    }

    moveTile(x: number, y: number, delta: number) {
        const index = x + y * this.width;
        this.tiles[index].y += delta * this.tileH / 2;
    }

    setTile(x: number, y: number, value: number) {
        const index = x + y * this.width;
        this.tiles[index].setFrame(value);
    }

    setData(x: number, y: number, value: number) {
        const index = x + y * this.width;
        this.tileData[index] = value;
        this.tiles[index].setFrame(value);
    }

    setNumber(numberTiles: Array<Phaser.GameObjects.Sprite>, value: number) {
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
        this.load.spritesheet('background', ImgBackground, { frameWidth: 600, frameHeight: 800});
        this.load.spritesheet('tiles', ImgSpriteSheet, { frameWidth: 16, frameHeight: 16 });
        this.load.audio('ba-ding', [AudBaDing]);
        this.load.audio('thud', [AudThud]);
    }

    gameOver() {
        this.playing = false;
        this.background.setFrame(5);
        this.newGameButton.setVisible(true);
    }

    setUpGame() {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                this.setData(x, y, 0);
            }
        }
        this.updateWeights();
        this.background.setFrame(2);

        this.score = 0;
        this.completedLines = 0;
        this.addScore(0);

        this.tetronimo = undefined;
        this.setNextTickTime();
        this.newGameButton.setVisible(false);
        this.playing = true;
    }

    /** Changes keyboard events into requests to the gameloop. */
    inputHandler(event: any) {  // TODO: Is there a type for this?
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) {
            event.preventDefault();
            this.moveRequested[0] = 1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) {
            event.preventDefault();
            this.moveRequested[0] = -1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) {
            event.preventDefault();
            this.moveRequested[1] = 1;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) {
            event.preventDefault();
            this.rotateRequested = true;
        }
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.SPACE) {
            event.preventDefault();
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
        this.tileData = new Array(this.width * this.height);

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                let index = x + y * this.width;
                this.tiles[index] = this.add.sprite(x * this.tileW + gridX, y * this.tileH + gridY, 'tiles', 0);
                this.tiles[index].scale = this.tileScale;
                this.tileData[index] = 0;
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

        this.add.text(380, 5, 'BALANCE TETRIS', {fontSize: '24px', fontStyle: 'bold'});
        this.add.text(380, 200, 'Controls', {fontSize: '20px', fontStyle: 'bold'});
        this.add.text(380, 220, 'Move:   Left & Right');
        this.add.text(380, 240, 'Lower:  Down');
        this.add.text(380, 260, 'Rotate: Up');
        this.add.text(380, 280, 'Drop:   Space');

        this.add.text(380, 350, 'Balancing', {fontSize: '20px', fontStyle: 'bold'});
        this.add.text(380, 370, 'If you put too many');
        this.add.text(380, 390, 'blocks on one side,');
        this.add.text(380, 410, 'the scales will tilt!');
        this.add.text(380, 440, 'Tilt too far and it\'s');
        this.add.text(380, 460, '    Game Over!');

        this.newGameButton = this.add.text(100, 300, 'NEW GAME', {fontSize: '36px', fontStyle: 'bold', backgroundColor: '#00d000', padding: {x: 20, y: 10}});
        this.newGameButton.setInteractive().on('pointerdown', () => this.setUpGame());
        this.newGameButton.setVisible(false);

        this.soundThudd = this.sound.add('thud');
        this.soundBaDing = this.sound.add('ba-ding');

        this.nextTick = 0;
        this.moveRequested = [0, 0];
        this.dropRequested = false;
        this.rotateRequested = false;
        this.playing = true;
        this.score = 0;
        this.currentTilt = 0;
        this.completedLines = 0;

        // TODO: Handle absence of keyboard.
        this.input.keyboard!.on('keydown', this.inputHandler, this);

        this.updateWeights();
        this.addScore(0);
    }

    setNextTickTime() {
        const interval = INITIAL_INTERVAL * (INTERVAL_SPEEDUP ** Math.floor(this.completedLines / INTERVAL_LINES));
        this.nextTick = this.currentTime + interval;

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

    update(time: number, delta: number) {
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