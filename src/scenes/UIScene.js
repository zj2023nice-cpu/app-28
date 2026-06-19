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
            this.refreshAllCards();
        });

        this.registry.events.on('changedata-cooldowns', () => {
            this.refreshAllCards();
        });

        this.registry.events.on('changedata-selectedPlant', () => {
            this.refreshAllCards();
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

            // Cooldown overlay (drawn above content, below text)
            const cooldownMask = this.add.graphics();

            const cooldownText = this.add.text(0, 0, '', {
                fontSize: '22px',
                fontFamily: 'Outfit',
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setVisible(false);

            card.add([bg, icon, nameText, costText, cooldownMask, cooldownText]);
            card.setSize(120, 85);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                if (this.isCardSelectable(key)) {
                    card.setScale(1.05);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                this.refreshCard(key);
            });

            card.on('pointerdown', () => {
                if (!this.isCardSelectable(key)) return;
                this.registry.set('selectedPlant', key);
            });

            this.cards[key] = { card, bg, cooldownMask, cooldownText, icon };
        });

        this.refreshAllCards();
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-60, -42, 120, 84, 15);
        graphics.lineStyle(3, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-60, -42, 120, 84, 15);
    }

    isCardSelectable(key) {
        const data = PLANTS[key];
        const sun = this.registry.get('sun') || 0;
        if (sun < data.cost) return false;
        const cd = this.getCardCooldown(key);
        if (cd.remaining > 0) return false;
        return true;
    }

    getCardCooldown(key) {
        const cooldowns = this.registry.get('cooldowns') || {};
        const entry = cooldowns[key];
        if (!entry) return { remaining: 0, ratio: 0, total: PLANTS[key].cooldown };
        const now = this.time.now;
        const remaining = Math.max(0, entry.until - now);
        const total = entry.total || PLANTS[key].cooldown;
        const ratio = total > 0 ? remaining / total : 0;
        return { remaining, ratio, total };
    }

    refreshAllCards() {
        if (!this.cards) return;
        Object.keys(this.cards).forEach(key => this.refreshCard(key));
    }

    refreshCard(key) {
        const data = PLANTS[key];
        const { card, bg, cooldownMask, cooldownText, icon } = this.cards[key];

        const sun = this.registry.get('sun') || 0;
        const selected = this.registry.get('selectedPlant') === key;
        const cd = this.getCardCooldown(key);
        const onCooldown = cd.remaining > 0;
        const insufficientSun = sun < data.cost;

        // Background color: selected (green) > cooldown (dark blue/grey) > insufficient (dim grey) > normal
        if (selected && !onCooldown) {
            this.drawCardBg(bg, 0x4caf50, 0.9);
        } else if (onCooldown) {
            this.drawCardBg(bg, 0x1a237e, 0.35);
        } else if (insufficientSun) {
            this.drawCardBg(bg, 0x333333, 0.15);
        } else {
            this.drawCardBg(bg, 0x333333, 0.2);
        }

        // Card alpha differentiates the two unavailable states
        if (onCooldown) {
            card.setAlpha(0.85);
            icon.setTint(0x666688);
        } else if (insufficientSun) {
            card.setAlpha(0.55);
            icon.clearTint();
        } else {
            card.setAlpha(1);
            icon.clearTint();
        }

        // Cooldown progress overlay: vertical "fill drains down" mask
        cooldownMask.clear();
        if (onCooldown) {
            const w = 120;
            const h = 84;
            const fillH = h * cd.ratio;
            cooldownMask.fillStyle(0x000000, 0.55);
            cooldownMask.fillRoundedRect(-60, -42, w, fillH, { tl: 15, tr: 15, bl: 0, br: 0 });
            cooldownMask.lineStyle(2, 0x82b1ff, 0.7);
            cooldownMask.beginPath();
            cooldownMask.moveTo(-60, -42 + fillH);
            cooldownMask.lineTo(60, -42 + fillH);
            cooldownMask.strokePath();

            cooldownText.setVisible(true);
            const seconds = (cd.remaining / 1000).toFixed(1);
            cooldownText.setText(seconds);
        } else {
            cooldownText.setVisible(false);
        }
    }

    update() {
        if (!this.cards) return;
        // Drive cooldown progress animation; also auto-clear stale cooldown entries.
        const cooldowns = this.registry.get('cooldowns');
        if (!cooldowns) return;

        let cleared = false;
        Object.keys(this.cards).forEach(key => {
            const cd = this.getCardCooldown(key);
            if (cd.remaining > 0) {
                this.refreshCard(key);
            } else if (cooldowns[key] && cooldowns[key].until > 0) {
                cooldowns[key].until = 0;
                cleared = true;
            }
        });

        if (cleared) {
            this.registry.set('cooldowns', { ...cooldowns });
        }
    }
}
