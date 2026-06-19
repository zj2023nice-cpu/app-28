import Phaser from 'phaser';
import { COLORS, PLANTS } from '../constants';

export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { width } = this.scale;

        if (!this.registry.get('cooldowns')) {
            const cooldowns = {};
            Object.keys(PLANTS).forEach(key => { cooldowns[key] = 0; });
            this.registry.set('cooldowns', cooldowns);
        }

        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.7);
        panel.fillRoundedRect(15, 15, width - 30, 95, 20);
        panel.lineStyle(2, 0xffffff, 0.15);
        panel.strokeRoundedRect(15, 15, width - 30, 95, 20);

        this.sunIcon = this.add.image(50, 62, 'sun').setScale(1.2);

        const initialSun = this.registry.get('sun') != null ? this.registry.get('sun') : 100;
        this.sunText = this.add.text(95, 62, String(initialSun), {
            fontSize: '40px',
            fontFamily: 'Outfit',
            fill: '#ffd700',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0, 0.5);

        this.registry.events.on('changedata-sun', (parent, value) => {
            this.sunText.setText(value);
            this.refreshAllCards();
        });

        this.registry.events.on('changedata-selectedPlant', (parent, value) => {
            this.highlightCard(value);
            this.refreshAllCards();
        });

        this.createPlantCards();
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

            const cdOverlay = this.add.graphics();

            card.add([bg, icon, nameText, costText, cdOverlay]);
            card.setSize(120, 85);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                const state = this.getCardState(key);
                if (state === 'ready') {
                    card.setScale(1.05);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                const state = this.getCardState(key);
                const isSelected = this.registry.get('selectedPlant') === key;
                if (state === 'cooldown' && !isSelected) {
                    this.drawCardBg(bg, 0x222222, 0.1);
                } else {
                    this.drawCardBg(bg, isSelected ? 0x4caf50 : 0x333333, isSelected ? 0.9 : 0.2);
                }
            });

            card.on('pointerdown', () => {
                const currentSelected = this.registry.get('selectedPlant');
                if (currentSelected === key) {
                    this.registry.set('selectedPlant', null);
                    return;
                }
                const state = this.getCardState(key);
                if (state === 'ready') {
                    this.registry.set('selectedPlant', key);
                }
            });

            this.cards[key] = { card, bg, icon, nameText, costText, cdOverlay, data };
        });

        this.refreshAllCards();
    }

    getCardState(key) {
        const cooldowns = this.registry.get('cooldowns') || {};
        const now = this.time.now;
        if (cooldowns[key] > now) {
            return 'cooldown';
        }
        const sun = this.registry.get('sun') || 0;
        if (sun < PLANTS[key].cost) {
            return 'noSun';
        }
        return 'ready';
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-60, -42, 120, 84, 15);
        graphics.lineStyle(3, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-60, -42, 120, 84, 15);
    }

    drawCooldownOverlay(overlay, ratio) {
        overlay.clear();
        if (ratio <= 0) return;

        const cardH = 84;
        const cardW = 120;
        const cdH = cardH * ratio;
        const cdY = 42 - cdH;

        overlay.fillStyle(0x000000, 0.65);
        overlay.fillRoundedRect(-60, cdY, cardW, cdH, ratio >= 1 ? 15 : 0);

        if (ratio > 0 && ratio < 1) {
            const lineY = cdY;
            overlay.fillStyle(0xffffff, 0.25);
            overlay.fillRect(-60, lineY, cardW, 2);
        }
    }

    highlightCard(selectedKey) {
        Object.keys(this.cards).forEach(key => {
            const { bg } = this.cards[key];
            const isSel = key === selectedKey;
            const state = this.getCardState(key);
            if (state === 'cooldown') {
                this.drawCardBg(bg, 0x222222, 0.1);
            } else {
                this.drawCardBg(bg, isSel ? 0x4caf50 : 0x333333, isSel ? 0.9 : 0.2);
            }
        });
    }

    refreshAllCards() {
        const sun = this.registry.get('sun') || 0;
        const cooldowns = this.registry.get('cooldowns') || {};
        const now = this.time.now;
        const selectedKey = this.registry.get('selectedPlant');

        Object.keys(this.cards).forEach(key => {
            const { card, bg, icon, nameText, costText, cdOverlay, data } = this.cards[key];
            const cdEnd = cooldowns[key] || 0;
            const onCd = cdEnd > now;
            const canAfford = sun >= data.cost;

            let alpha = 1;
            let tint = null;
            let bgColor = 0x333333;
            let lineAlpha = 0.2;

            if (key === selectedKey) {
                bgColor = 0x4caf50;
                lineAlpha = 0.9;
            }

            if (onCd) {
                alpha = 0.7;
                tint = 0x888888;
                if (key !== selectedKey) {
                    bgColor = 0x222222;
                    lineAlpha = 0.1;
                }
                const remaining = cdEnd - now;
                const ratio = Math.max(0, Math.min(1, remaining / data.cooldown));
                this.drawCooldownOverlay(cdOverlay, ratio);
            } else {
                this.drawCooldownOverlay(cdOverlay, 0);
                if (!canAfford) {
                    alpha = 0.55;
                    tint = null;
                }
            }

            this.drawCardBg(bg, bgColor, lineAlpha);
            card.setAlpha(alpha);
            if (tint) {
                icon.setTint(tint);
                nameText.setTint(0x888888);
                costText.setTint(0x888888);
            } else {
                icon.clearTint();
                nameText.clearTint();
                costText.clearTint();
            }
        });
    }

    update(time) {
        const cooldowns = this.registry.get('cooldowns');
        if (!cooldowns) return;

        let needsRefresh = false;
        const sun = this.registry.get('sun') || 0;

        Object.keys(this.cards).forEach(key => {
            const { cdOverlay, data } = this.cards[key];
            const cdEnd = cooldowns[key] || 0;
            const onCd = cdEnd > time;

            if (onCd) {
                const remaining = cdEnd - time;
                const ratio = Math.max(0, Math.min(1, remaining / data.cooldown));
                this.drawCooldownOverlay(cdOverlay, ratio);
                needsRefresh = true;
            } else if (cdEnd > 0) {
                cooldowns[key] = 0;
                this.drawCooldownOverlay(cdOverlay, 0);
                needsRefresh = true;
            }
        });

        if (needsRefresh) {
            this.refreshAllCards();
        }
    }
}
