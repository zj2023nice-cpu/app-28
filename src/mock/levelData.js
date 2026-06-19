export const levelData = {
    level1: {
        zombieSpawnRate: 6000,
        initialSun: 100,
        unlockedPlants: ['SUNFLOWER', 'PEASHOOTER', 'WALLNUT'],
        waves: 15
    },
    plantStats: {
        SUNFLOWER: { cost: 50, hp: 100, sunGen: 25, cd: 10000 },
        PEASHOOTER: { cost: 100, hp: 150, damage: 20, rate: 2000 },
        WALLNUT: { cost: 50, hp: 1000 }
    }
};
