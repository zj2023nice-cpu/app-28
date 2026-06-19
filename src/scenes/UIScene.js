import Phaser from 'phaser';
import { COLORS, PLANTS } from '../constants';

export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { width } = this.scale;

        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.7);
        panel.fillRoundedRect(15, 15, width - 30, 95, 20);
        panel.lineStyle(2, 0xffffff, 0.15);
        panel.strokeRoundedRect(15, 15, width - 30, 95, 20);

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
            this.updateCardStates();
        });

        this.registry.events.on('changedata-plantCooldowns', () => {
            this.updateCardStates();
        });

        this.registry.events.on('changedata-selectedPlant', (parent, value) => {
            this.highlightCard(value);
        });
    }

    update() {
        this.updateCooldownVisuals();
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

            const cooldownOverlay = this.add.graphics();
            const cooldownText = this.add.text(0, 0, '', {
                fontSize: '28px',
                fontFamily: 'Outfit',
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            card.add([bg, icon, nameText, costText, cooldownOverlay, cooldownText]);
            card.setSize(120, 85);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                if (this.isCardAvailable(key)) {
                    card.setScale(1.05);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                this.updateCardBg(key);
            });

            card.on('pointerdown', () => {
                if (this.isCardAvailable(key)) {
                    const currentSelected = this.registry.get('selectedPlant');
                    this.registry.set('selectedPlant', currentSelected === key ? null : key);
                }
            });

            this.cards[key] = { card, bg, icon, nameText, costText, cooldownOverlay, cooldownText, data };
        });

        this.updateCardStates();
    }

    isCardAvailable(key) {
        const data = PLANTS[key];
        const currentSun = this.registry.get('sun') || 0;
        const cooldowns = this.registry.get('plantCooldowns') || {};
        const now = this.time.now;
        return currentSun >= data.cost && now >= (cooldowns[key] || 0);
    }

    isCardOnCooldown(key) {
        const cooldowns = this.registry.get('plantCooldowns') || {};
        const now = this.time.now;
        return now < (cooldowns[key] || 0);
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-60, -42, 120, 84, 15);
        graphics.lineStyle(3, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-60, -42, 120, 84, 15);
    }

    updateCardBg(key) {
        const { bg } = this.cards[key];
        const isSelected = this.registry.get('selectedPlant') === key;
        const onCooldown = this.isCardOnCooldown(key);
        if (onCooldown) {
            this.drawCardBg(bg, 0x555555, 0.2);
        } else {
            this.drawCardBg(bg, isSelected ? 0x4caf50 : 0x333333, isSelected ? 0.9 : 0.2);
        }
    }

    highlightCard(selectedKey) {
        Object.keys(this.cards).forEach(key => {
            this.updateCardBg(key);
        });
    }

    updateCardStates() {
        Object.keys(this.cards).forEach(key => {
            const { card, costText, data } = this.cards[key];
            const currentSun = this.registry.get('sun') || 0;
            const onCooldown = this.isCardOnCooldown(key);
            const canAfford = currentSun >= data.cost;

            if (!canAfford) {
                card.setAlpha(0.55);
                costText.setFill('#ff5555');
            } else if (onCooldown) {
                card.setAlpha(0.7);
                costText.setFill('#ffd700');
            } else {
                card.setAlpha(1);
                costText.setFill('#ffd700');
            }

            this.updateCardBg(key);
        });
    }

    updateCooldownVisuals() {
        const now = this.time.now;
        Object.keys(this.cards).forEach(key => {
            const { cooldownOverlay, cooldownText, data } = this.cards[key];
            const cooldowns = this.registry.get('plantCooldowns') || {};
            const cooldownEnd = cooldowns[key] || 0;
            const remaining = cooldownEnd - now;

            cooldownOverlay.clear();

            if (remaining > 0) {
                const progress = 1 - (remaining / data.cooldown);
                const fillHeight = 84 * (1 - progress);

                cooldownOverlay.fillStyle(0x000000, 0.65);
                cooldownOverlay.fillRect(-60, -42, 120, fillHeight);

                const secondsLeft = Math.ceil(remaining / 1000);
                cooldownText.setText(secondsLeft > 0 ? secondsLeft.toString() : '');
                cooldownText.setVisible(true);
            } else {
                cooldownText.setVisible(false);
            }
        });
    }
}
