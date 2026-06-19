export const COLORS = {
    GRASS_LIGHT: 0x56a12a,
    GRASS_DARK: 0x488b21,
    SUN: 0xffd700,
    PEASHOOTER: 0x4CAF50,
    SUNFLOWER: 0xFFEB3B,
    WALLNUT: 0x795548,
    ZOMBIE: 0x9E9E9E,
    PEA: 0xCDDC39,
    UI_BG: 0x212121,
    TEXT: 0xffffff,
    CARD_SEL: 0x4caf50,
    CARD_UNSEL: 0x333333
};

export const GRID = {
    ROWS: 7, // Increased to 7 rows as requested
    COLS: 10,
    CELL_SIZE: 100,
    OFFSET_X: 180,
    OFFSET_Y: 150
};

export const PLANTS = {
    SUNFLOWER: {
        name: '向日葵',
        cost: 50,
        hp: 100,
        cooldown: 5000,
        color: COLORS.SUNFLOWER
    },
    PEASHOOTER: {
        name: '豌豆射手',
        cost: 100,
        hp: 150,
        cooldown: 3000,
        color: COLORS.PEASHOOTER
    },
    WALLNUT: {
        name: '坚果墙',
        cost: 50,
        hp: 4000, // Significantly more HP for Rule 1
        cooldown: 8000,
        color: COLORS.WALLNUT
    }
};

export const ZOMBIES = {
    NORMAL: {
        hp: 100,
        speed: 20, // Rule 2: target speed 20
        damage: 10,
        color: COLORS.ZOMBIE
    }
};
