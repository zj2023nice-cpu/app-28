import Phaser from 'phaser';
import { COLORS, GRID, PLANTS, ZOMBIES } from '../constants';
import { levelData } from '../mock/levelData';

export class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    init() {
        const config = levelData.level1;
        this.sun = config.initialSun;
        this.grid = [];
        this.selectedPlant = null;
        this.zombieSpawnTimer = 0;
        this.gameOver = false;
        this.isWin = false;
        this.zombieSpawnRate = config.zombieSpawnRate;
        this.zombiesSpawned = 0;
        this.zombiesTarget = config.waves;
        this.cooldowns = {};
    }

    create() {
        const { width, height } = this.scale;
        this.drawBackground();
        this.createGrid();

        this.physics.world.setBounds(0, 0, width, height);

        this.plants = this.add.group();
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.suns = this.add.group();

        // Overlap detections
        this.physics.add.overlap(this.bullets, this.zombies, this.handleBulletHit, null, this);

        // Particle Emitters for "Juice"
        this.createParticles();

        this.time.addEvent({
            delay: 4500,
            callback: this.spawnSkySun,
            callbackScope: this,
            loop: true
        });

        this.registry.set('sun', this.sun);

        const plantKeys = Object.keys(PLANTS);
        plantKeys.forEach(key => {
            this.cooldowns[key] = 0;
        });
        this.registry.set('cooldowns', this.cooldowns);

        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() && this.registry.get('selectedPlant')) {
                this.registry.set('selectedPlant', null);
            }
        });
    }

    createParticles() {
        // Impact particles (green)
        this.impactEmitter = this.add.particles(0, 0, 'pea', {
            scale: { start: 0.4, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 300,
            gravityY: 200,
            emitting: false
        });

        // Sun collection particles (yellow)
        this.sunEmitter = this.add.particles(0, 0, 'sun', {
            scale: { start: 0.2, end: 0 },
            speed: { min: 20, max: 100 },
            lifespan: 500,
            blendMode: 'ADD',
            emitting: false
        });
    }

    drawBackground() {
        const { width, height } = this.scale;
        const g = this.add.graphics();

        g.fillGradientStyle(0x0a1a0a, 0x0a1a0a, 0x011a01, 0x011a01, 1);
        g.fillRect(0, 0, width, height);

        const cellW = GRID.CELL_SIZE;
        const totalW = GRID.COLS * cellW;
        this.startX = (width - totalW) / 2 + 65;
        this.startY = GRID.OFFSET_Y;

        for (let r = 0; r < GRID.ROWS; r++) {
            for (let c = 0; c < GRID.COLS; c++) {
                const isEven = (r + c) % 2 === 0;
                const x = this.startX + c * cellW;
                const y = this.startY + r * cellW;

                g.fillStyle(isEven ? 0x2e7d32 : 0x1b5e20, 0.9);
                g.fillRoundedRect(x + 5, y + 5, cellW - 10, cellW - 10, 18);

                g.lineStyle(2, 0xffffff, 0.04);
                g.strokeRoundedRect(x + 5, y + 5, cellW - 10, cellW - 10, 18);
            }
        }

        // Defensive sidebar
        g.fillStyle(0x3e2723, 0.4);
        g.fillRoundedRect(30, this.startY, this.startX - 60, GRID.ROWS * cellW, 25);
        g.lineStyle(2, 0xffffff, 0.1);
        g.strokeRoundedRect(30, this.startY, this.startX - 60, GRID.ROWS * cellW, 25);
    }

    createGrid() {
        const cellW = GRID.CELL_SIZE;
        for (let r = 0; r < GRID.ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < GRID.COLS; c++) {
                const x = this.startX + c * cellW + cellW / 2;
                const y = this.startY + r * cellW + cellW / 2;

                const cell = this.add.rectangle(x, y, cellW - 12, cellW - 12, 0xffffff, 0);
                cell.setInteractive();
                cell.on('pointerdown', () => this.placePlant(r, c));
                cell.on('pointerover', () => cell.setFillStyle(0xffffff, 0.1));
                cell.on('pointerout', () => cell.setFillStyle(0xffffff, 0));

                this.grid[r][c] = { x, y, plant: null };
            }
        }
    }

    update(time, delta) {
        if (this.gameOver || this.isWin) return;

        this.zombieSpawnTimer += delta;
        if (this.zombieSpawnTimer > this.zombieSpawnRate && this.zombiesSpawned < this.zombiesTarget) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
            this.zombiesSpawned++;
        }

        this.plants.children.iterate(plant => {
            if (plant && plant.active && plant.customUpdate) {
                plant.customUpdate(time, delta);
            }
        });

        // Precision collision and state management for each zombie
        this.zombies.children.iterate(zombie => {
            if (!zombie || !zombie.active) return;

            if (zombie.x < this.startX - 40) {
                this.endGame();
                return;
            }

            let blockingPlant = null;
            this.plants.children.iterate(plant => {
                if (plant && plant.active && plant.row === zombie.row) {
                    const dx = zombie.x - plant.x;
                    // Precise horizontal block - zombie must be right next to the plant
                    if (dx > 0 && dx < 60) {
                        blockingPlant = plant;
                    }
                }
            });

            if (blockingPlant) {
                zombie.body.setVelocityX(0);
                this.handleZombieAttack(zombie, blockingPlant, time);
            } else {
                zombie.body.setVelocityX(-ZOMBIES.NORMAL.speed);
                zombie.clearTint();
            }
        });

        if (this.zombiesSpawned >= this.zombiesTarget && this.zombies.countActive() === 0 && !this.isWin) {
            this.winGame();
        }
    }

    handleZombieAttack(zombie, plant, time) {
        if (time > (zombie.lastAttackTime || 0) + 1000) {
            zombie.lastAttackTime = time;

            this.tweens.add({ targets: zombie, x: zombie.x - 6, yoyo: true, duration: 100 });

            plant.setTint(0xff4444);
            this.time.delayedCall(150, () => { if (plant.active) plant.clearTint(); });

            plant.hp -= 25;
            const maxHp = PLANTS[plant.type].hp;
            plant.setAlpha(Math.max(0.4, plant.hp / maxHp));

            if (plant.hp <= 0) {
                this.grid[plant.row][plant.col].plant = null;
                plant.destroy();
                zombie.clearTint();
            }
        }
    }

    spawnSkySun() {
        const x = Phaser.Math.Between(this.startX, this.scale.width - 100);
        const sun = this.add.sprite(x, -60, 'sun').setInteractive();
        this.suns.add(sun);
        this.tweens.add({
            targets: sun,
            y: Phaser.Math.Between(200, this.scale.height - 120),
            duration: 3500,
            ease: 'Cubic.out'
        });
        sun.on('pointerdown', () => this.collectSun(sun));
    }

    collectSun(sun) {
        this.sun += 25;
        this.registry.set('sun', this.sun);

        // Particle feedback
        this.sunEmitter.emitParticleAt(sun.x, sun.y, 8);

        this.tweens.add({
            targets: sun,
            x: 80, y: 60, scale: 0.4, alpha: 0.5,
            duration: 700, ease: 'Back.in',
            onComplete: () => { if (sun.active) sun.destroy(); }
        });
    }

    placePlant(row, col) {
        const key = this.registry.get('selectedPlant');
        if (!key) return;

        const data = PLANTS[key];
        if (this.sun < data.cost || this.grid[row][col].plant) return;

        const now = this.time.now;
        if (this.cooldowns[key] > now) return;

        this.sun -= data.cost;
        this.registry.set('sun', this.sun);

        this.cooldowns[key] = now + data.cooldown;
        this.registry.set('cooldowns', { ...this.cooldowns });

        const { x, y } = this.grid[row][col];
        const plant = this.add.sprite(x, y, key.toLowerCase());

        plant.type = key;
        plant.hp = data.hp;
        plant.row = row;
        plant.col = col;
        plant.lastActionTime = 0;

        if (key === 'PEASHOOTER') {
            plant.customUpdate = (time) => {
                if (time > plant.lastActionTime + 2000) {
                    const hasZombie = this.zombies.getChildren().some(z =>
                        z.active && z.row === plant.row && z.x > plant.x
                    );
                    if (hasZombie) {
                        this.shoot(plant);
                        plant.lastActionTime = time;
                    }
                }
            };
        } else if (key === 'SUNFLOWER') {
            plant.customUpdate = (time) => {
                if (time > plant.lastActionTime + 12000) {
                    this.genPlantSun(plant);
                    plant.lastActionTime = time;
                }
            };
        }

        this.plants.add(plant);
        this.grid[row][col].plant = plant;

        plant.setScale(0).setAlpha(0);
        this.tweens.add({ targets: plant, scale: 1, alpha: 1, duration: 400, ease: 'Back.out' });
        this.registry.set('selectedPlant', null);
    }

    shoot(plant) {
        const pea = this.physics.add.sprite(plant.x + 35, plant.y - 12, 'pea');
        this.bullets.add(pea);
        pea.body.setVelocityX(400);
        // Muzzle flash particle
        this.impactEmitter.emitParticleAt(plant.x + 35, plant.y - 12, 3);
    }

    genPlantSun(plant) {
        const sun = this.add.sprite(plant.x, plant.y, 'sun').setInteractive().setScale(0.8);
        this.suns.add(sun);
        this.tweens.add({
            targets: sun,
            x: plant.x + Phaser.Math.Between(-50, 50),
            y: plant.y + Phaser.Math.Between(40, 60),
            duration: 600,
            onComplete: () => {
                this.time.delayedCall(7000, () => { if (sun.active) sun.destroy(); });
            }
        });
        sun.on('pointerdown', () => this.collectSun(sun));
    }

    spawnZombie() {
        const row = Phaser.Math.Between(0, GRID.ROWS - 1);
        const y = this.startY + row * GRID.CELL_SIZE + GRID.CELL_SIZE / 2;
        const zombie = this.physics.add.sprite(this.scale.width + 80, y, 'zombie');

        zombie.row = row;
        zombie.hp = ZOMBIES.NORMAL.hp;
        zombie.lastAttackTime = 0;
        zombie.body.setVelocityX(-ZOMBIES.NORMAL.speed);

        this.zombies.add(zombie);

        const alert = this.add.text(this.scale.width - 60, y, '🧟', { fontSize: '38px' }).setOrigin(0.5);
        this.tweens.add({ targets: alert, alpha: 0, y: y - 70, duration: 2500, onComplete: () => { if (alert.active) alert.destroy(); } });
    }

    handleBulletHit(bullet, zombie) {
        // Emit impact particles
        this.impactEmitter.emitParticleAt(bullet.x, bullet.y, 10);

        bullet.destroy();
        zombie.hp -= 20;
        zombie.setTint(0xff6666);
        this.time.delayedCall(100, () => { if (zombie.active) zombie.clearTint(); });

        if (zombie.hp <= 0) {
            this.impactEmitter.emitParticleAt(zombie.x, zombie.y, 20); // Death explosion
            zombie.destroy();
        }
    }

    winGame() {
        this.isWin = true;
        this.physics.pause();
        this.showFinalScreen('阳光灿烂，草坪安然！', '#ffd700');
    }

    endGame() {
        this.gameOver = true;
        this.physics.pause();
        this.showFinalScreen('你的脑子被僵尸吃掉了...', '#ff5555');
    }

    showFinalScreen(msg, color) {
        const { width, height } = this.scale;
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);

        this.add.text(width / 2, height / 2 - 120, msg, {
            fontSize: '76px', fontFamily: 'ZCOOL KuaiLe', fill: color, stroke: '#000000', strokeThickness: 10
        }).setOrigin(0.5);

        const btn = this.add.container(width / 2, height / 2 + 100);
        const bg = this.add.graphics();
        bg.fillStyle(0x4caf50, 1);
        bg.fillRoundedRect(-160, -45, 320, 90, 25);

        const txt = this.add.text(0, 0, '决 战 下 一 次', { fontSize: '42px', fontFamily: 'ZCOOL KuaiLe', fill: '#ffffff' }).setOrigin(0.5);
        btn.add([bg, txt]);
        btn.setSize(320, 90);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => { btn.setScale(1.1); bg.clear(); bg.fillStyle(0x66bb6a, 1); bg.fillRoundedRect(-160, -45, 320, 90, 25); });
        btn.on('pointerout', () => { btn.setScale(1); bg.clear(); bg.fillStyle(0x4caf50, 1); bg.fillRoundedRect(-160, -45, 320, 90, 25); });

        btn.on('pointerdown', () => {
            this.scene.start('PlayScene');
            this.scene.get('UIScene').scene.restart();
        });
    }
}
