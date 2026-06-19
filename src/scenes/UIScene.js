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

        this._onSunChanged = (parent, value) => {
            this.sunText.setText(value);
            this.refreshCards();
        };
        this._onCooldownsChanged = () => { this.refreshCards(); };
        this._onSelectedChanged = (parent, value) => { this.highlightCard(value); };

        this.registry.events.on('changedata-sun', this._onSunChanged);
        this.registry.events.on('changedata-cooldowns', this._onCooldownsChanged);
        this.registry.events.on('changedata-selectedPlant', this._onSelectedChanged);

        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-sun', this._onSunChanged);
            this.registry.events.off('changedata-cooldowns', this._onCooldownsChanged);
            this.registry.events.off('changedata-selectedPlant', this._onSelectedChanged);
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

            const cooldownMask = this.add.graphics();
            cooldownMask.setVisible(false);

            card.add([bg, icon, nameText, costText, cooldownMask]);
            card.setSize(120, 85);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                const state = this.getCardState(key);
                if (state === 'available') {
                    card.setScale(1.05);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                this.highlightCard(this.registry.get('selectedPlant'));
            });

            card.on('pointerdown', () => {
                const state = this.getCardState(key);
                if (state === 'available') {
                    this.registry.set('selectedPlant', key);
                }
            });

            this.cards[key] = { card, bg, icon, nameText, costText, cooldownMask, data };
        });

        this.refreshCards();
    }

    update() {
        this.updateCooldownMasks();
    }

    getCardState(key) {
        const data = PLANTS[key];
        const sun = this.registry.get('sun') || 0;
        const cooldowns = this.registry.get('cooldowns') || {};
        const now = this.time.now;
        const cdEnd = cooldowns[key] || 0;

        if (cdEnd > now) {
            return 'cooldown';
        }
        if (sun < data.cost) {
            return 'nosun';
        }
        return 'available';
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-60, -42, 120, 84, 15);
        graphics.lineStyle(3, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-60, -42, 120, 84, 15);
    }

    drawCooldownMask(graphics, progress) {
        graphics.clear();
        if (progress >= 1) {
            graphics.setVisible(false);
            return;
        }
        graphics.setVisible(true);

        const cardW = 120;
        const cardH = 84;
        const maxRadius = 15;
        const left = -60;
        const right = left + cardW;
        const top = -42;
        const bottom = top + cardH;
        const fillH = cardH * (1 - progress);
        const maskTop = bottom - fillH;

        if (fillH <= 0) return;

        const bottomR = Math.min(maxRadius, fillH);
        const topCovered = maskTop <= top;
        const topR = topCovered ? Math.min(maxRadius, fillH) : 0;
        const actualTop = Math.max(maskTop, top);

        graphics.fillStyle(0x000000, 0.65);
        graphics.beginPath();

        graphics.moveTo(left, actualTop + topR);
        if (topR > 0) {
            graphics.arc(left + topR, actualTop + topR, topR, Math.PI, Math.PI * 1.5);
        }
        graphics.lineTo(right - topR, actualTop);
        if (topR > 0) {
            graphics.arc(right - topR, actualTop + topR, topR, -Math.PI / 2, 0);
        }

        graphics.lineTo(right, bottom - bottomR);
        if (bottomR > 0) {
            graphics.arc(right - bottomR, bottom - bottomR, bottomR, 0, Math.PI / 2);
        }
        graphics.lineTo(left + bottomR, bottom);
        if (bottomR > 0) {
            graphics.arc(left + bottomR, bottom - bottomR, bottomR, Math.PI / 2, Math.PI);
        }

        graphics.closePath();
        graphics.fillPath();
    }

    updateCooldownMasks() {
        const cooldowns = this.registry.get('cooldowns') || {};
        const now = this.time.now;

        Object.keys(this.cards).forEach(key => {
            const { cooldownMask, data } = this.cards[key];
            const cdEnd = cooldowns[key] || 0;
            const remaining = cdEnd - now;

            if (remaining > 0) {
                const progress = 1 - (remaining / data.cooldown);
                this.drawCooldownMask(cooldownMask, Math.max(0, Math.min(1, progress)));
            } else {
                this.drawCooldownMask(cooldownMask, 1);
            }
        });
    }

    highlightCard(selectedKey) {
        Object.keys(this.cards).forEach(key => {
            const { bg } = this.cards[key];
            const state = this.getCardState(key);
            const isSel = key === selectedKey;

            if (isSel) {
                this.drawCardBg(bg, 0x4caf50, 0.9);
            } else {
                this.drawCardBg(bg, 0x333333, 0.2);
            }
        });
    }

    refreshCards() {
        const sun = this.registry.get('sun') || 0;
        Object.keys(this.cards).forEach(key => {
            const { card } = this.cards[key];
            const state = this.getCardState(key);

            if (state === 'nosun') {
                card.setAlpha(0.55);
            } else {
                card.setAlpha(1);
            }
        });
        this.highlightCard(this.registry.get('selectedPlant'));
        this.updateCooldownMasks();
    }
}
