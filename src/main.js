import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { UIScene } from './scenes/UIScene';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 950, // Increased height to fit more rows
    parent: 'game-container',
    backgroundColor: '#111111',
    scene: [BootScene, MenuScene, PlayScene, UIScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    pixelArt: false,
    antialias: true
};

new Phaser.Game(config);
