import Phaser from 'phaser';
import { Tetris } from './game';


// @ts-ignore
import ImgBackground from './images/background.png';
// @ts-ignore
import ImgSpriteSheet from './images/spritesheet.png';
// @ts-ignore
import AudBaDing from './audio/tetris-ba-ding.ogg';
// @ts-ignore
import AudThud from './audio/tetris-thud.ogg';

const config = {
    type: Phaser.CANVAS,
    width: 600,
    height: 800,
    scene: Tetris,
    loader: {
        baseURL: './',
        path: 'assets/',
    }
};

const game = new Phaser.Game(config);

// Preload assets
game.scene.scenes[0].load.spritesheet('background', ImgBackground, { frameWidth: 600, frameHeight: 800});
game.scene.scenes[0].load.spritesheet('tiles', ImgSpriteSheet, { frameWidth: 16, frameHeight: 16 });
game.scene.scenes[0].load.audio('ba-ding', [AudBaDing]);
game.scene.scenes[0].load.audio('thud', [AudThud]);