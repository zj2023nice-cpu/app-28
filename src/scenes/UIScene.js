import Phaser from 'phaser';
import { COLORS, PLANTS } from '../constants';

export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { width } = this.scale;

        // Sun Bar Panel (Glassy)
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.7);
        panel.fillRoundedRect(15, 15, width - 30, 95, 20);
        panel.lineStyle(2, 0xffffff, 0.15);
        panel.strokeRoundedRect(15, 15, width - 30, 95, 20);

        // Sun Count Section
        this.sunIcon = this.add.image(50, 62, 'sun').setScale(1.2);

        this.sunText = this.add.text(95, 62, '50', {
            fontSize: '40px',
            fontFamily: 'Outfit',
            fill: '#ffd700',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0, 0.5);

        this.createPlantCards();

        this.registry.events.on('changedata-sun', (parent, value) => {
            this.sunText.setText(value);
            this.updateCardAvailability(value);
        });
    }

    createPlantCards() {
        const startX = 320;
        const keys = Object.keys(PLANTS);
        this.cards = {};

        keys.forEach((key, index) => {
            const data = PLANTS[key];
            const x = startX + index * 135;
            const y = 62;

            const card = this.add.container(x, y);

            const bg = this.add.graphics();
            this.drawCardBg(bg, 0x333333, 0.2);

            const icon = this.add.sprite(-35, 0, key.toLowerCase()).setScale(0.85);

            const nameText = this.add.text(10, -12, data.name, {
                fontSize: '17px',
                fontFamily: 'ZCOOL KuaiLe',
                fill: '#ffffff'
            }).setOrigin(0, 0.5);

            const costText = this.add.text(10, 16, data.cost, {
                fontSize: '24px',
                fontFamily: 'Outfit',
                fill: '#ffd700',
                fontWeight: 'bold'
            }).setOrigin(0, 0.5);

            card.add([bg, icon, nameText, costText]);
            card.setSize(120, 85);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                if (this.registry.get('sun') >= data.cost) {
                    card.setScale(1.05);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                const isSelected = this.registry.get('selectedPlant') === key;
                this.drawCardBg(bg, isSelected ? 0x4caf50 : 0x333333, isSelected ? 0.9 : 0.2);
            });

            card.on('pointerdown', () => {
                if (this.registry.get('sun') >= data.cost) {
                    this.registry.set('selectedPlant', key);
                    this.highlightCard(key);
                }
            });

            this.cards[key] = { card, bg };
        });

        this.updateCardAvailability(this.registry.get('sun'));
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-60, -42, 120, 84, 15);
        graphics.lineStyle(3, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-60, -42, 120, 84, 15);
    }

    highlightCard(selectedKey) {
        Object.keys(this.cards).forEach(key => {
            const { bg } = this.cards[key];
            const isSel = key === selectedKey;
            this.drawCardBg(bg, isSel ? 0x4caf50 : 0x333333, isSel ? 0.9 : 0.2);
        });
    }

    updateCardAvailability(currentSun) {
        Object.keys(this.cards).forEach(key => {
            const data = PLANTS[key];
            const { card } = this.cards[key];
            if (currentSun < data.cost) {
                card.setAlpha(0.55);
            } else {
                card.setAlpha(1);
            }
        });
    }
}
