import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Animated Gradient Background
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x0a1a0a, 0x0a1a0a, 0x011a01, 0x011a01, 1);
        graphics.fillRect(0, 0, width, height);

        // Floating procedural background elements
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const sun = this.add.image(x, y, 'sun').setAlpha(0.12).setScale(Phaser.Math.FloatBetween(0.5, 1.2));
            this.tweens.add({
                targets: sun,
                y: y + 50,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Title with glow
        const titleText = this.add.text(width / 2, height / 3, '植物大战僵尸', {
            fontSize: '92px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffffff',
            stroke: '#2e7d32',
            strokeThickness: 12
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const subTitle = this.add.text(width / 2, height / 3 + 80, 'PREMIUM EDITION', {
            fontSize: '24px',
            fontFamily: 'Outfit',
            fill: '#ffd700',
            letterSpacing: 10
        }).setOrigin(0.5).setAlpha(0.8);

        // Start Button Container
        const startButton = this.add.container(width / 2, height * 0.65);
        const bg = this.add.graphics();
        const btnW = 320;
        const btnH = 80;

        const drawBtn = (color, alpha) => {
            bg.clear();
            // Outer glow
            bg.lineStyle(4, 0xffffff, 0.2);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 20);
            // Main fill
            bg.fillStyle(color, alpha);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 20);
        };

        drawBtn(0x4caf50, 0.9);

        const text = this.add.text(0, 0, '开 始 战 斗', {
            fontSize: '36px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        startButton.add([bg, text]);
        startButton.setSize(btnW, btnH);
        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => {
            drawBtn(0x66bb6a, 1);
            this.tweens.add({ targets: startButton, scale: 1.1, duration: 150 });
        });

        startButton.on('pointerout', () => {
            drawBtn(0x4caf50, 0.9);
            this.tweens.add({ targets: startButton, scale: 1, duration: 150 });
        });

        startButton.on('pointerdown', () => {
            this.scene.start('PlayScene');
            this.scene.start('UIScene');
        });

        // Copyright/Version info
        this.add.text(width / 2, height - 40, 'Created by Antigravity AI • 2026', {
            fontSize: '14px',
            fontFamily: 'Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.5);
    }
}
