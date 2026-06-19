import Phaser from 'phaser';
import { COLORS } from '../constants';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, '正在生成现代资源...', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'ZCOOL KuaiLe'
        }).setOrigin(0.5);

        // Create procedurally generated textures
        this.createTextures();

        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }

    createTextures() {
        const draw = (key, width, height, callback) => {
            const g = this.add.graphics();
            callback(g);
            g.generateTexture(key, width, height);
            g.destroy();
        };

        // Sun texture (Enhanced)
        draw('sun', 60, 60, (g) => {
            g.fillStyle(0xffd700, 1);
            g.fillCircle(30, 30, 22);
            g.lineStyle(4, 0xffa500, 1);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                g.lineBetween(
                    30 + Math.cos(angle) * 18, 30 + Math.sin(angle) * 18,
                    30 + Math.cos(angle) * 28, 30 + Math.sin(angle) * 28
                );
            }
        });

        // Pea texture
        draw('pea', 24, 24, (g) => {
            g.fillStyle(0xCDDC39, 1);
            g.fillCircle(12, 12, 8);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(9, 9, 3);
        });

        // Sunflower (Detailed)
        draw('sunflower', 80, 80, (g) => {
            g.fillStyle(0xffa500, 1);
            for (let i = 0; i < 10; i++) {
                const ang = (i / 10) * Math.PI * 2;
                g.fillCircle(40 + Math.cos(ang) * 25, 40 + Math.sin(ang) * 25, 12);
            }
            g.fillStyle(0xffeb3b, 1);
            g.fillCircle(40, 40, 20);
            g.fillStyle(0x000000, 1);
            g.fillCircle(33, 35, 3);
            g.fillCircle(47, 35, 3);
        });

        // Peashooter (Detailed)
        draw('peashooter', 90, 80, (g) => {
            g.fillStyle(0x2e7d32, 1);
            g.fillEllipse(30, 65, 50, 20);
            g.fillStyle(0x4CAF50, 1);
            g.fillCircle(40, 40, 28);
            g.fillEllipse(60, 40, 45, 35);
            g.fillStyle(0x1b5e20, 1);
            g.fillCircle(75, 40, 10);
            g.fillStyle(0x000000, 1);
            g.fillCircle(45, 30, 3);
        });

        // Wallnut (Solid)
        draw('wallnut', 80, 90, (g) => {
            g.fillStyle(0x795548, 1);
            g.fillRoundedRect(15, 10, 50, 70, 25);
            g.fillStyle(0x000000, 0.2);
            g.fillRect(20, 35, 40, 3);
            g.fillStyle(0x000000, 1);
            g.fillCircle(30, 30, 4);
            g.fillCircle(50, 30, 4);
        });

        // Zombie (Modern)
        draw('zombie', 80, 100, (g) => {
            g.fillStyle(0x757575, 1); // Pants
            g.fillRect(30, 60, 25, 35);
            g.fillStyle(0x5d4037, 1); // Shirt
            g.fillRect(25, 35, 35, 30);
            g.fillStyle(0x8bc34a, 1); // Head
            g.fillCircle(42, 25, 20);
            g.fillStyle(0x000000, 1);
            g.fillCircle(35, 22, 3);
            g.fillCircle(49, 22, 3);
            g.fillStyle(0x424242, 1); // Hands
            g.fillRect(10, 45, 20, 10);
        });
    }
}
