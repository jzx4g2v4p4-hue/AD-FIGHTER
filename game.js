// ============================================================
//  GREG'S PRIDE QUEST — Main Game
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 640, H = 360;
canvas.width = W; canvas.height = H;

// ---- COLORS ----
const PRIDE_COLS = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];

// ---- SPRITES / ASSET REGISTRY ----
// Placeholder paths: replace with real PNG sheets later.
const SPRITES = {
  player: {
    key: 'player',
    src: 'assets/sprites/player_sheet.png',
    frameWidth: 128,
    frameHeight: 128,
    originX: 64,
    originY: 110,
    displayScale: 0.5,
    states: {
      idle:  { row: 0, frames: 4, speed: 8, loop: true },
      run:   { row: 1, frames: 8, speed: 4, loop: true },
      jump:  { row: 2, frames: 2, speed: 10, loop: false },
      fall:  { row: 3, frames: 2, speed: 10, loop: false },
      shoot: { row: 4, frames: 3, speed: 3, loop: false },
      hurt:  { row: 5, frames: 2, speed: 6, loop: false },
      death: { row: 6, frames: 6, speed: 5, loop: false }
    }
  },
  enemy: {
    key: 'enemy',
    src: 'assets/sprites/enemy_sheet.png',
    frameWidth: 40,
    frameHeight: 40,
    originX: 20,
    originY: 34,
    states: {
      idle:  { row: 0, frames: 4, speed: 8, loop: true },
      run:   { row: 1, frames: 6, speed: 5, loop: true },
      shoot: { row: 2, frames: 3, speed: 4, loop: false },
      hurt:  { row: 3, frames: 2, speed: 5, loop: false },
      death: { row: 4, frames: 6, speed: 4, loop: false }
    }
  },
  boss: {
    key: 'boss',
    src: 'assets/sprites/boss_sheet.png',
    frameWidth: 96,
    frameHeight: 96,
    originX: 48,
    originY: 78,
    states: {
      idle:   { row: 0, frames: 4, speed: 8, loop: true },
      attack: { row: 1, frames: 6, speed: 4, loop: true },
      hurt:   { row: 2, frames: 2, speed: 6, loop: false },
      death:  { row: 3, frames: 8, speed: 4, loop: false }
    }
  },
  explosion: {
    key: 'explosion',
    src: 'assets/sprites/explosion_sheet.png',
    frameWidth: 96,
    frameHeight: 96,
    originX: 48,
    originY: 48,
    states: {
      boom: { row: 0, frames: 8, speed: 2, loop: false }
    }
  }
};
/*
Expected sprite sheet layout (placeholder paths above):
- player_sheet.png    rows: idle, run, jump, fall, shoot, hurt, death
- enemy_sheet.png     rows: idle, run, shoot, hurt, death
- boss_sheet.png      rows: idle, attack, hurt, death
- explosion_sheet.png rows: boom
Each row is horizontal frames with fixed frameWidth/frameHeight from SPRITES.
*/

const ASSETS = {};
let spritesInitialized = false;
const screenShake = { time: 0, power: 0, x: 0, y: 0 };
// Arcade tuning constants for "Pride Slug" feel. Adjust these to retune responsiveness.
const ARCADE_TUNING = {
  move: { maxSpeed: 5.8, accel: 0.84, airAccel: 0.54, friction: 0.74, grav: 0.4, jumpPow: -11.2 },
  dash: { duration: 10, cooldown: 56, speed: 9.4, invuln: 16 },
  weapons: {
    pistol: { cooldownRun: 6, cooldownIdle: 7 },
    spread: { cooldownRun: 8, cooldownIdle: 9 },
    beam: { cooldownRun: 2, cooldownIdle: 3 },
    heavy: { cooldownRun: 11, cooldownIdle: 12 },
    kiss: { cooldownRun: 12, cooldownIdle: 14 }
  },
  shake: {
    bullet: { power: 0.8, time: 2 },
    enemyKill: { power: 2.8, time: 7 },
    bomb: { power: 6.8, time: 14 },
    bossSlam: { power: 8.2, time: 20 },
    hardLanding: { power: 1.8, time: 5 }
  }
};

function loadSpriteSheet(cfg) {
  const img = new Image();
  img.src = cfg.src;
  ASSETS[cfg.key] = { image: img, loaded: false, errored: false, cfg };
  img.onload = () => { ASSETS[cfg.key].loaded = true; };
  img.onerror = () => { ASSETS[cfg.key].errored = true; };
}

function initSpriteAssets() {
  if (spritesInitialized) return;
  spritesInitialized = true;
  Object.values(SPRITES).forEach(loadSpriteSheet);
}

function createAnimState(defaultState = 'idle') {
  return { state: defaultState, frame: 0, timer: 0, finished: false };
}

function setAnimState(anim, nextState) {
  if (anim.state === nextState) return;
  anim.state = nextState;
  anim.frame = 0;
  anim.timer = 0;
  anim.finished = false;
}

function stepAnim(anim, spriteCfg) {
  const meta = spriteCfg.states[anim.state] || spriteCfg.states.idle;
  anim.timer++;
  if (anim.timer >= meta.speed) {
    anim.timer = 0;
    if (anim.frame < meta.frames - 1) anim.frame++;
    else if (meta.loop) anim.frame = 0;
    else anim.finished = true;
  }
}

function drawSpriteFrame(spriteKey, animState, worldX, worldY, facing = 1, alpha = 1) {
  const asset = ASSETS[spriteKey];
  if (!asset || !asset.loaded) return false;
  const cfg = asset.cfg;
  const stateMeta = cfg.states[animState.state] || cfg.states.idle;
  const fw = cfg.frameWidth;
  const fh = cfg.frameHeight;
  const scale = cfg.displayScale ?? 1;
  const dw = fw * scale;
  const dh = fh * scale;
  const ox = cfg.originX * scale;
  const oy = cfg.originY * scale;
  const sx = animState.frame * fw;
  const sy = stateMeta.row * fh;
  const screenX = Math.round(worldX - state.camX);
  const screenY = Math.round(worldY);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(screenX, screenY);
  if (facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(
    asset.image,
    sx, sy, fw, fh,
    -ox, -oy, dw, dh
  );
  ctx.restore();
  return true;
}

function addScreenShake(power = 2, time = 6) {
  screenShake.power = Math.max(screenShake.power, power);
  screenShake.time = Math.max(screenShake.time, time);
}

// Shake presets by combat event, extending the existing shake system.
function addImpactShake(type = 'bullet') {
  const shake = ARCADE_TUNING.shake[type] || ARCADE_TUNING.shake.bullet;
  addScreenShake(shake.power, shake.time);
}

function updateScreenShake() {
  if (screenShake.time > 0) {
    screenShake.time--;
    screenShake.x = (Math.random() - 0.5) * screenShake.power;
    screenShake.y = (Math.random() - 0.5) * screenShake.power;
    screenShake.power *= 0.9;
    if (screenShake.time <= 0 || screenShake.power < 0.2) {
      screenShake.time = 0;
      screenShake.power = 0;
      screenShake.x = 0;
      screenShake.y = 0;
    }
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
  }
}

// ---- LEVEL DEFINITIONS ----
const LEVELS = [
  {
    name:      "The Quiet Closet",
    scenery:   "alley",
    bg:        ['#1a0533','#3d0f6b'],
    groundY:   300,
    worldW:    980,
    platforms: [[110,270,90],[255,238,88],[380,206,96],[560,176,88]],
    gems:      [[180,240],[350,210],[510,180]],
    enemies:   [{x:250,y:288,dir:1},{x:610,y:288,dir:-1}],
    bossX:     null,
    msg:       "Collect all gems and blast the Doubt Demons with fabulous force!",
    afterCutscene: 'after_level1'
  },
  {
    name:      "Neon Block",
    scenery:   "neon",
    bg:        ['#0a1a4d','#1a3a8f'],
    groundY:   300,
    worldW:    1140,
    platforms: [[160,262,120],[360,236,78],[525,200,76],[690,166,118]],
    gems:      [[120,230],[265,190],[430,150],[565,190],[725,160]],
    enemies:   [{x:160,y:288,dir:1},{x:340,y:288,dir:-1},{x:650,y:288,dir:1}],
    bossX:     null,
    msg:       "Push forward. Keep firing. Queer joy gets the last word.",
    afterCutscene: 'after_level2'
  },
  {
    name:      "Open Streets",
    scenery:   "city",
    bg:        ['#001a14','#00573f'],
    groundY:   300,
    worldW:    1260,
    platforms: [[95,262,100],[255,228,86],[430,248,86],[570,214,98],[760,184,112],[930,222,76]],
    gems:      [[145,230],[290,200],[460,170],[645,210],[830,180]],
    enemies:   [{x:200,y:288,dir:1},{x:390,y:288,dir:-1},{x:560,y:288,dir:1},{x:840,y:288,dir:-1}],
    bossX:     null,
    msg:       "Run-and-gun through the noise. You're getting stronger and gayer.",
    afterCutscene: 'after_level3'
  },
  {
    name:      "Parade Route",
    scenery:   "parade",
    bg:        ['#14143a','#3f1f6b'],
    groundY:   300,
    worldW:    1360,
    platforms: [[120,258,120],[310,222,92],[500,188,92],[680,232,116],[900,190,90],[1050,218,86]],
    gems:      [[150,225],[320,185],[475,150],[655,195],[835,160],[960,200]],
    enemies:   [{x:210,y:288,dir:1},{x:370,y:288,dir:-1},{x:540,y:288,dir:1},{x:700,y:288,dir:-1},{x:910,y:288,dir:1}],
    bossX:     null,
    msg:       "Friends are near. Clear the path and keep your courage loud and glittery.",
    afterCutscene: 'after_level4'
  },
  {
    name:      "Iron Rain District",
    scenery:   "industrial",
    bg:        ['#0f0f1f','#342c54'],
    groundY:   300,
    worldW:    1480,
    platforms: [[130,266,110],[310,236,104],[480,202,92],[660,168,118],[860,228,96],[1045,192,106]],
    gems:      [[140,225],[330,180],[490,145],[670,200],[850,165],[1010,205]],
    enemies:   [{x:180,y:288,dir:1},{x:360,y:288,dir:-1},{x:520,y:288,dir:1},{x:730,y:288,dir:-1},{x:920,y:288,dir:1},{x:1080,y:288,dir:-1}],
    bossX:     null,
    msg:       "Heavy resistance. Keep rolling, firing, and serving pure pride.",
    afterCutscene: 'after_level5'
  },
  {
    name:      "Steel Sky Highway",
    scenery:   "highway",
    bg:        ['#071f29','#12576d'],
    groundY:   300,
    worldW:    1650,
    platforms: [[180,270,122],[390,238,94],[560,206,88],[730,174,112],[920,218,92],[1080,182,96],[1230,146,112]],
    gems:      [[170,228],[340,195],[520,160],[690,125],[850,190],[1010,158],[1155,205]],
    enemies:   [{x:220,y:288,dir:1},{x:410,y:288,dir:-1},{x:590,y:288,dir:1},{x:760,y:288,dir:-1},{x:930,y:288,dir:1},{x:1110,y:288,dir:-1}],
    bossX:     null,
    msg:       "Final gauntlet. This is full run-and-gun queer chaos.",
    afterCutscene: 'after_level6'
  },
  {
    name:      "HR Tower Showdown",
    scenery:   "boss",
    bg:        ['#1a0000','#4d0000'],
    groundY:   300,
    worldW:    1220,
    platforms: [[120,240,100],[290,198,95],[470,240,95],[640,205,95]],
    gems:      [[145,220],[315,178],[495,220],[665,185]],
    enemies:   [],
    bossX:     700,
    msg:       "Final boss TR fired Greg for being gay. Tonight Greg fights back with pride.",
    afterCutscene: 'victory'
  },
  {
    name:      "Birthday Snowball Bonus",
    type:      "bonus",
    scenery:   "snow",
    bg:        ['#100a38','#2d1d74'],
    groundY:   300,
    worldW:    1040,
    platforms: [[170,242,120],[390,198,100],[610,230,120],[830,186,120]],
    gems:      [],
    enemies:   [],
    bossX:     null,
    msg:       "BONUS STAGE! Greg, Jairo, and Chris throw snowballs in pure chaos joy!",
    afterCutscene: 'after_bonus'
  }
];

// ---- KEYS ----
const keys = {};
const prevKeys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowLeft','ArrowRight','ArrowDown','ShiftLeft','ShiftRight','KeyJ','KeyK','KeyX','KeyL'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ---- STATE ----
let state = null;
let currentLevel = 0;
let frame = 0;
let gamePhase = 'start'; // 'start' | 'cutscene' | 'playing' | 'won'
let cutscenePlayer = null;
let campaignScore = 0;
let transitionTimer = null;
const touchPointerMap = new Map();

// ---- INIT ----
function initLevel(li) {
  const L = LEVELS[li];
  const isBonus = L.type === 'bonus';
  const baseWorldW = L.worldW || 700;
  const extendedWorldW = isBonus ? baseWorldW : (baseWorldW + 520 + li * 70);
  const bonusPlatformY = 170 + (li % 3) * 24;
  const bonusPlatformA = [extendedWorldW - 360, bonusPlatformY, 120];
  const bonusPlatformB = [extendedWorldW - 180, bonusPlatformY - 36, 125];
  const longPlatforms = isBonus ? [...L.platforms] : [...L.platforms, bonusPlatformA, bonusPlatformB];
  const longGems = [
    ...L.gems,
    [bonusPlatformA[0] + 30, bonusPlatformA[1] - 22],
    [bonusPlatformB[0] + 55, bonusPlatformB[1] - 22],
    [extendedWorldW - 70, L.groundY - 28]
  ];
  const longEnemies = L.bossX || isBonus
    ? L.enemies
    : [
      ...L.enemies,
      { x: extendedWorldW - 230, y: 288, dir: -1 },
      { x: extendedWorldW - 90, y: 288, dir: -1 }
    ];
  const loadoutCycle = ['spread', 'beam', 'kiss', 'heavy'];
  const levelPickup = loadoutCycle[li % loadoutCycle.length];
  const powerups = (L.bossX || isBonus)
    ? []
    : [{ x: Math.min(extendedWorldW - 180, 330 + li * 98), y: L.groundY - 34, type: levelPickup, collected: false }];
  const stageEvents = buildStageEvents(li, extendedWorldW, L);
  const destructibles = spawnDestructiblesForLevel(L, extendedWorldW, li);
  const rescues = spawnRescuesForLevel(L, extendedWorldW);
  const prideFlags = [
    { x: Math.min(extendedWorldW - 300, 330 + li * 90), y: L.groundY - 28, collected: false },
    { x: Math.min(extendedWorldW - 70, 690 + li * 115), y: L.groundY - 28, collected: false }
  ];
  screenShake.time = 0;
  screenShake.power = 0;
  screenShake.x = 0;
  screenShake.y = 0;
  state = {
    level: li,
    player: {
      x:60, y:260, vx:0, vy:0, onGround:false, facing:1, hp:4, maxHp:4, invincible:0,
      coyote: 0, gunRecoil: 0, gunFlash: 0, runFrame: 0,
      crouching: false, aimMode: 'forward',
      runDustTimer: 0, landingImpact: 0, tilt: 0,
      facingVisual: 1,
      recoilPose: 0,
      skidFxTimer: 0,
      dashTimer: 0, dashCooldown: 0,
      weaponMode: 'pistol', weaponAmmo: Infinity, meleeTimer: 0,
      anim: createAnimState('idle'),
      hurtTimer: 0,
      shootTimer: 0,
      deadTimer: 0
    },
    gems:     longGems.map(g => ({ x:g[0], y:g[1], collected:false })),
    enemies:  longEnemies.map(e => ({
      x:e.x, y:e.y, dir:e.dir, vx:1.2*e.dir, alive:true, hp:2,
      minX: Math.max(24, e.x - 95), maxX: Math.min(extendedWorldW - 24, e.x + 95),
      fireTimer: 45 + Math.floor(Math.random()*80),
      telegraphTimer: 0,
      patrolPause: 0,
      knockbackVX: 0,
      anim: createAnimState('run'),
      hurtTimer: 0,
      shootTimer: 0,
      deadTimer: 0
    })),
    boss:     L.bossX ? {
      x:L.bossX, y:220, hp:8, maxHp:8, dir:-1, alive:true, atkTimer:0,
      phase: 1,
      telegraphTimer: 0,
      introTimer: 70,
      anim: createAnimState('idle'),
      hurtTimer: 0,
      deadTimer: 0
    } : null,
    bullets:  [],
    grenades: [],
    enemyShots: [],
    explosions: [],
    particles: [],
    trails: [],
    powerups,
    destructibles,
    rescues,
    stageEvents,
    triggeredEvents: {},
    eventBanners: [],
    meleeEffects: [],
    superMode: { active: false, armor: 0, timer: 0, name: '' },
    cinematic: { letterbox: 0, cardText: '', cardTimer: 0, slowmo: 0, whiteFlash: 0, zoomPulse: 0 },
    bonusStage: isBonus ? { timer: 55 * 60, scoreTarget: 5000, multiplier: 1, hits: 0, startScore: campaignScore } : null,
    bonusTargets: isBonus ? [
      { name: 'Jairo', x: 500, y: L.groundY - 28, vx: 1.2, dodge: 0, mood: 'ready' },
      { name: 'Chris', x: 760, y: L.groundY - 28, vx: -1.1, dodge: 0, mood: 'ready' }
    ] : [],
    prideFlags,
    platforms: longPlatforms,
    fireCooldown: 0,
    bombCooldown: 0,
    bombs: 8,
    score: campaignScore,
    combo: 0,
    comboTimer: 0,
    scorePopups: [],
    hitStopFrames: 0,
    lowHpFlash: 0,
    msgTimer:  180,
    msgText:   L.msg,
    levelName: L.name,
    camX:      0,
    worldW:    extendedWorldW,
    complete:  false,
    finishZoneX: Math.max(extendedWorldW - 64, 760),
    levelIntroTimer: 90
  };
  if (isBonus) {
    state.msgTimer = 160;
    state.msgText = 'BONUS STAGE! Chain hits for multiplier magic.';
    state.player.hp = state.player.maxHp;
  }
}

function awardScore(points, comboable = true) {
  campaignScore += points;
  state.score = campaignScore;
  state.scorePopups.push({
    x: state.player.x,
    y: state.player.y - 16,
    text: `+${points}`,
    color: comboable ? '#ffe180' : '#ff9ad0',
    life: 40,
    maxLife: 40
  });
  if (comboable) {
    state.combo = Math.min(9, state.combo + 1);
    state.comboTimer = 120;
  }
}

function resolveWeaponPickup(type) {
  if (type === 'jairo' || type === 'spread') return { mode: 'spread', ammo: 55, label: 'SPREAD POP' };
  if (type === 'mark' || type === 'beam') return { mode: 'beam', ammo: 140, label: 'RAINBOW BEAM' };
  if (type === 'heavy') return { mode: 'heavy', ammo: 30, label: 'HEAVY SHOT' };
  return { mode: 'kiss', ammo: 48, label: 'KISS CANNON' };
}

function giveWeapon(type) {
  const p = state.player;
  const weapon = resolveWeaponPickup(type);
  p.weaponMode = weapon.mode;
  p.weaponAmmo = weapon.ammo;
  state.msgText = `${weapon.label} PICKUP!`;
  state.msgTimer = 90;
  spawnEventBanner(`${weapon.label} ONLINE`, '#9cf6ff');
}

function spawnArcadeEnemy(x, y, dir = -1, cfg = {}) {
  const patrol = cfg.patrol || 120;
  state.enemies.push({
    x, y, dir, vx: 1.2 * dir, alive: true, hp: cfg.hp || 2,
    minX: Math.max(24, x - patrol), maxX: Math.min(state.worldW - 24, x + patrol),
    fireTimer: cfg.fireTimer || (26 + Math.floor(Math.random() * 46)),
    telegraphTimer: 0,
    patrolPause: 0,
    knockbackVX: 0,
    anim: createAnimState('run'),
    hurtTimer: 0,
    shootTimer: 0,
    deadTimer: 0,
    platformUnit: !!cfg.platformUnit
  });
}

function spawnEventBanner(text, color = '#ffd27a', life = 96) {
  state.eventBanners.push({ text, color, life, maxLife: life });
}

function spawnCheckpointCelebration(x) {
  spawnParticles(x, 110, PRIDE_COLS, 30);
  spawnEventBanner('CHECKPOINT CLEAN!', '#9effd4', 90);
  awardScore(500, false);
}

function spawnDestructiblesForLevel(L, worldW, li) {
  const base = [
    { x: 230 + li * 20, y: L.groundY - 18, w: 22, h: 18, hp: 2, type: 'crate' },
    { x: 480 + li * 32, y: L.groundY - 20, w: 28, h: 20, hp: 3, type: 'barricade' },
    { x: worldW - 320, y: L.groundY - 26, w: 20, h: 26, hp: 2, type: 'sign' },
    { x: worldW - 150, y: L.groundY - 24, w: 18, h: 24, hp: 3, type: 'barrel' }
  ];
  return base.filter(o => o.x < worldW - 20).map(o => ({ ...o, alive: true, dropRolled: false }));
}

function spawnRescuesForLevel(L, worldW) {
  return [
    { x: Math.min(worldW - 240, 520), y: L.groundY - 24, type: 'health', collected: false, text: 'SUPPORT ♥ +1' },
    { x: Math.min(worldW - 120, 900), y: L.groundY - 24, type: 'bomb', collected: false, text: 'SUPPORT BOMB +1' }
  ];
}

function buildStageEvents(li, worldW, L) {
  if (L.type === 'bonus') return [];
  const gx = L.groundY - 12;
  return [
    { id: `intro_${li}`, x: 70, type: 'banner', text: 'MISSION START', color: '#ffe6a8' },
    { id: `patrol_${li}`, x: 190, type: 'wave', style: 'rush', count: 3, y: gx },
    { id: `ambush_${li}`, x: Math.floor(worldW * 0.38), type: 'ambush' },
    { id: `panic_${li}`, x: Math.floor(worldW * 0.46), type: 'panicWave' },
    { id: `platform_${li}`, x: Math.floor(worldW * 0.52), type: 'platformWave' },
    { id: `pickup_${li}`, x: Math.floor(worldW * 0.66), type: 'reward' },
    { id: `push_${li}`, x: Math.floor(worldW * 0.82), type: 'finalPush' }
  ];
}

function runStageEvents() {
  if (!state.stageEvents || state.stageEvents.length === 0) return;
  state.stageEvents.forEach(ev => {
    if (state.triggeredEvents[ev.id]) return;
    if (state.player.x < ev.x) return;
    state.triggeredEvents[ev.id] = true;
    triggerStageEvent(ev);
  });
}

function triggerStageEvent(ev) {
  const L = LEVELS[state.level];
  const rightEdge = Math.min(state.worldW - 40, state.player.x + W + 70);
  if (ev.type === 'banner') {
    spawnEventBanner(ev.text, ev.color);
    return;
  }
  if (ev.type === 'wave') {
    spawnEventBanner('FIRST PATROL', '#ffd27a', 70);
    for (let i = 0; i < ev.count; i++) spawnArcadeEnemy(rightEdge + i * 24, ev.y, -1, { hp: 2 });
    return;
  }
  if (ev.type === 'ambush') {
    spawnEventBanner('AMBUSH!', '#ff7272', 100);
    state.cinematic.cardText = 'AMBUSH';
    state.cinematic.cardTimer = 14;
    addImpactShake('enemyKill');
    for (let i = 0; i < 6; i++) {
      const ex = state.player.x + 80 + i * 40;
      state.explosions.push({ x: ex, y: 90 + (i % 2) * 50, radius: 26, life: 12, maxLife: 12, anim: createAnimState('boom') });
    }
    for (let i = 0; i < 4; i++) spawnArcadeEnemy(rightEdge + i * 30, L.groundY - 12, -1, { hp: 2, fireTimer: 10 + i * 4 });
    return;
  }
  if (ev.type === 'panicWave') {
    spawnEventBanner('PANIC WAVE!', '#ff5f8f', 96);
    state.cinematic.whiteFlash = 3;
    state.cinematic.cardText = 'REINFORCEMENTS INBOUND';
    state.cinematic.cardTimer = 12;
    for (let i = 0; i < 5; i++) {
      spawnArcadeEnemy(rightEdge + i * 22, L.groundY - 12 - (i % 2) * 8, -1, { hp: 2 + (i % 2), fireTimer: 8 + i * 3 });
    }
    return;
  }
  if (ev.type === 'platformWave') {
    spawnEventBanner('ELEVATED FIRE!', '#8fd8ff');
    state.platforms.slice(-3).forEach(([px, py], idx) => spawnArcadeEnemy(px + 24 + idx * 28, py - 12, -1, { hp: 2, platformUnit: true }));
    return;
  }
  if (ev.type === 'reward') {
    spawnEventBanner('SUPPLY DROP', '#b7ffab');
    state.superMode = { active: true, armor: 2, timer: 420, name: 'Glitter Assault Float' };
    state.player.invincible = Math.max(state.player.invincible, 30);
    spawnEventBanner('SPECIAL RIDE: GLITTER ASSAULT FLOAT', '#ffd8ff', 95);
    spawnCheckpointCelebration(state.player.x + 80);
    return;
  }
  if (ev.type === 'finalPush') {
    spawnEventBanner('FINAL PUSH!', '#ffc4ff');
    state.cinematic.cardText = 'FINAL PUSH';
    state.cinematic.cardTimer = 14;
    for (let i = 0; i < 7; i++) spawnArcadeEnemy(rightEdge + i * 28, L.groundY - 12, -1, { hp: i % 3 === 0 ? 3 : 2, fireTimer: 12 });
  }
}

// ---- START FLOW ----
function setTouchControlsEnabled(enabled) {
  const tc = document.getElementById('touchControls');
  if (!tc) return;
  tc.classList.toggle('enabled', !!enabled);
}

function bindTouchControls() {
  const tc = document.getElementById('touchControls');
  if (!tc) return;
  const resetTouchState = () => {
    touchPointerMap.clear();
    tc.querySelectorAll('.touch-btn.active').forEach(btn => btn.classList.remove('active'));
    ['ArrowLeft', 'ArrowRight', 'Space', 'KeyJ', 'KeyL'].forEach(k => { keys[k] = false; });
  };

  const releasePointer = pointerId => {
    const info = touchPointerMap.get(pointerId);
    if (!info) return;
    if (info.key) keys[info.key] = false;
    if (info.btn) info.btn.classList.remove('active');
    touchPointerMap.delete(pointerId);
  };

  tc.querySelectorAll('.touch-btn[data-key]').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      keys[key] = true;
      btn.classList.add('active');
      touchPointerMap.set(e.pointerId, { key, btn });
    });

    const endPress = e => {
      e.preventDefault();
      releasePointer(e.pointerId);
    };

    btn.addEventListener('pointerup', endPress);
    btn.addEventListener('pointercancel', endPress);
    btn.addEventListener('pointerleave', e => {
      if (!btn.hasPointerCapture(e.pointerId)) return;
      endPress(e);
    });
  });

  window.addEventListener('blur', resetTouchState);
  document.addEventListener('contextmenu', e => {
    if (e.target.closest('#touchControls')) e.preventDefault();
  });
}

function buildStartScreen() {
  const gc = document.getElementById('gameContainer');
  const s = document.createElement('div');
  s.id = 'startScreen';
  s.innerHTML = `
    <div class="pixel-title">GREG'S PRIDE QUEST</div>
    <div class="pixel-sub">a journey to self-acceptance</div>
    <div class="rainbow-bar">${PRIDE_COLS.map(c=>`<div style="background:${c}"></div>`).join('')}</div>
    <button class="start-btn" id="startBtn">PRESS START</button>
    <div class="controls">Keyboard: Arrow Keys / WASD Move, Space Jump, Shift / Down Roll, J / K / X Fire, L Bomb<br>iPhone, iPad, and Samsung/Android: on-screen buttons + full-screen layout</div>
  `;
  gc.appendChild(s);
  document.getElementById('startBtn').addEventListener('click', beginGame);
}

function buildWinScreen() {
  setTouchControlsEnabled(false);
  const gc = document.getElementById('gameContainer');
  const w = document.createElement('div');
  w.id = 'winScreen';
  w.innerHTML = `
    <div class="win-title">YOU DID IT, GREG!</div>
    <div class="birthday-banner" aria-label="Happy Birthday Greg celebration">HAPPY BIRTHDAY GREG!</div>
    <div class="win-sub">Proud. Loud. Flamboyant. 100% Himself.</div>
    <div class="rainbow-bar">${PRIDE_COLS.map(c=>`<div style="background:${c}"></div>`).join('')}</div>
    <div class="win-text">
      Greg collected all the rainbow gems, defeated every Doubt Demon,<br>
      and sent TR's hate campaign into glitter confetti.<br><br>
      He now runs into the sunset hand-in-hand with Jairo and Chris —<br>
      loud, queer, and completely in love.<br><br>
      <strong style="color:#ff69b4;">Greg Mills is loved exactly as he is.</strong>
    </div>
    <button class="start-btn" id="replayBtn">PLAY AGAIN</button>
  `;
  gc.appendChild(w);
  document.getElementById('replayBtn').addEventListener('click', () => {
    w.remove(); beginGame();
  });
}

function beginGame() {
  setTouchControlsEnabled(false);
  const ss = document.getElementById('startScreen');
  if (ss) ss.remove();
  currentLevel = 0;
  campaignScore = 0;
  if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }
  // Play intro cutscene first
  gamePhase = 'cutscene';
  cutscenePlayer = new CutscenePlayer(() => {
    initLevel(0);
    gamePhase = 'playing';
    setTouchControlsEnabled(true);
    loop();
  });
  cutscenePlayer.play('intro');
}

// ---- DRAW GREG ----
function drawGregFallback(x, y, facing, invincible, gunRecoil = 0, gunFlash = 0) {
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;
  const speedRatio = Math.min(1, Math.abs(state.player.vx) / 4.2);
  const bob = Math.abs(Math.sin(frame * (0.2 + speedRatio * 0.2))) * (1.4 + speedRatio * 1.2);
  const stride = Math.sin(frame * 0.38) * 2.9;
  const shoulderLift = Math.sin(frame * 0.5) * 1.5;
  const lean = Math.max(-0.14, Math.min(0.14, state.player.tilt * 0.018));
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(facing, 1);
  ctx.rotate(lean);
  ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.fillRect(-11,28,22,4);
  // boots
  ctx.fillStyle='#1f0f05'; ctx.fillRect(-8+stride*0.35,24,8,8); ctx.fillRect(1-stride*0.35,24,8,8);
  ctx.fillStyle='#4e2a0d'; ctx.fillRect(-7+stride*0.35,24,6,3); ctx.fillRect(2-stride*0.35,24,6,3);
  // pants
  ctx.fillStyle='#131b54'; ctx.fillRect(-8,14,16,12);
  ctx.fillStyle='#2f3a88'; ctx.fillRect(-5+stride*0.25,14,3,10); ctx.fillRect(2-stride*0.25,14,3,10);
  // belt
  ctx.fillStyle='#5f2f0d'; ctx.fillRect(-8,12,16,4);
  ctx.fillStyle='#ffd700'; ctx.fillRect(-2,12,4,4);
  // shirt (pride colours cycle)
  ctx.fillStyle='#ff4aa8'; ctx.fillRect(-9,2,18,12);
  ctx.fillStyle='#ffa4d4'; ctx.fillRect(-5,3,11,3);
  ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fillRect(-8,4,4,8);
  // arms
  ctx.fillStyle='#a76935'; ctx.fillRect(-13,2+stride*0.2+shoulderLift*0.2,5,10); ctx.fillRect(8,2-stride*0.25-shoulderLift*0.35,5,10);
  ctx.fillStyle='#d59b58'; ctx.fillRect(-12,2+stride*0.2,3,4); ctx.fillRect(9,2-stride*0.2,3,4);
  // weapon silhouette + slide recoil
  const recoil = Math.min(4, gunRecoil);
  const toyLauncher = state.player.weaponMode === 'kiss' || state.player.weaponMode === 'spread';
  if (toyLauncher) {
    ctx.fillStyle='#ec6cae'; ctx.fillRect(8-recoil,6-shoulderLift*0.35,20,7);
    ctx.fillStyle='#cf4f93'; ctx.fillRect(10,12,12,5);
    ctx.fillStyle='#a73475'; ctx.fillRect(13,15,5,5);
    ctx.fillStyle='#f4a8cd'; ctx.fillRect(27-recoil,8-shoulderLift*0.35,8,4);
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fillRect(11,7,10,1);
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fillRect(30-recoil,9,3,2);
  } else {
    ctx.fillStyle='#101010'; ctx.fillRect(10-recoil,7-shoulderLift*0.35,11,5);      // slide
    ctx.fillStyle='#2b2b2b'; ctx.fillRect(10,12,7,4);             // frame
    ctx.fillStyle='#111'; ctx.fillRect(12,14,3,4);                // grip
    ctx.fillStyle='#888'; ctx.fillRect(20-recoil,9-shoulderLift*0.35,5,2);          // barrel
    ctx.fillStyle='rgba(180,200,255,0.25)'; ctx.fillRect(12,8,5,1);
  }
  if (gunFlash > 0) {
    const flashGrow = 6 - gunFlash;
    if (toyLauncher) {
      ctx.fillStyle='rgba(245,255,255,0.96)'; ctx.fillRect(31,6,6+flashGrow,6);
      ctx.fillStyle='rgba(220,240,255,0.92)'; ctx.fillRect(35+flashGrow,7,5,4);
      ctx.fillStyle='rgba(190,220,245,0.75)'; ctx.fillRect(39+flashGrow,8,4,2);
    } else {
      ctx.fillStyle='rgba(255,240,120,0.95)'; ctx.fillRect(24,6,5+flashGrow,6);
      ctx.fillStyle='rgba(255,170,0,0.88)';   ctx.fillRect(28+flashGrow,7,4,4);
      ctx.fillStyle='rgba(255,90,0,0.7)';     ctx.fillRect(31+flashGrow,8,3,2);
    }
  }
  // head
  ctx.fillStyle='#b87843'; ctx.fillRect(-6,-10,13,14);
  ctx.fillStyle='#dfa766'; ctx.fillRect(-4,-9,9,4);
  // beard
  ctx.fillStyle='#452b15'; ctx.fillRect(-6,0,13,6); ctx.fillRect(-7,-2,3,6); ctx.fillRect(11,-2,3,6);
  ctx.fillStyle='#725031'; ctx.fillRect(-4,1,9,2);
  // eyes
  ctx.fillStyle='#000'; ctx.fillRect(0,-7,3,3); ctx.fillRect(-4,-7,3,3);
  // smile
  ctx.fillStyle='#ff9999'; ctx.fillRect(-3,-1,7,2);
  // mohawk rainbow
  for (let i=0;i<6;i++) { ctx.fillStyle=PRIDE_COLS[i]; ctx.fillRect(-2,-12-i*3,5,4); }
  // ponytail
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(4,-10,3,14); ctx.fillRect(5,-5,4,3);
  ctx.restore();
}

// ---- DRAW ENEMY ----
function drawEnemyFallback(e, alpha = 1) {
  const x = Math.round(e.x - state.camX), y = Math.round(e.y);
  const wobble = Math.sin(frame * 0.25 + e.x * 0.03) * 2;
  const step = Math.sin(frame * 0.38 + e.x * 0.06) * 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle='#1f0038'; ctx.fillRect(x-12,y-18+wobble,24,20);
  ctx.fillStyle='#7e39d9'; ctx.fillRect(x-9,y-20+wobble,18,8);
  ctx.fillStyle='#c494ff'; ctx.fillRect(x-6,y-19+wobble,5,2); ctx.fillRect(x+1,y-19+wobble,5,2);
  ctx.fillStyle='#ff1a1a'; ctx.fillRect(x-5,y-16+wobble,4,4); ctx.fillRect(x+2,y-16+wobble,4,4);
  ctx.fillStyle='#130022'; ctx.fillRect(x-13,y-10+wobble,4,8); ctx.fillRect(x+9,y-10+wobble,4,8);
  ctx.fillStyle='#1a0030'; ctx.fillRect(x-8,y-26+wobble,4,10); ctx.fillRect(x+4,y-26+wobble,4,10);
  ctx.fillStyle='#2d0b44'; ctx.fillRect(x-8+step*0.35,y+2,6,6); ctx.fillRect(x+2-step*0.35,y+2,6,6);
  ctx.fillStyle='#7dfcff'; ctx.fillRect(x+(e.vx>0?8:-11),y-8+wobble,3,2);
  ctx.fillStyle='rgba(200,100,255,0.7)';
  ctx.font='7px monospace'; ctx.textAlign='center';
  ctx.fillText('DOUBT', x, y-30+wobble);
  ctx.restore();
}

// ---- DRAW BOSS ----
function drawBossFallback(b, alpha = 1) {
  const x = Math.round(b.x - state.camX), y = Math.round(b.y);
  const pulse = Math.sin(frame*0.1)*2;
  const jaw = Math.sin(frame*0.35)*2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle='#120f16'; ctx.fillRect(x-28,y-44+pulse,56,56);
  ctx.fillStyle='#26213a'; ctx.fillRect(x-23,y-48+pulse,46,16);
  ctx.fillStyle='#6f2f3f'; ctx.fillRect(x-21,y-40+pulse,42,34);
  ctx.fillStyle='#ff8ab6'; ctx.fillRect(x-13,y-36+pulse,26,4);
  ctx.fillStyle='#ff4477'; ctx.fillRect(x-12,y-34+pulse,8,8); ctx.fillRect(x+4,y-34+pulse,8,8);
  ctx.fillStyle='#fff0c0'; ctx.fillRect(x-9,y-32+pulse,2,2); ctx.fillRect(x+7,y-32+pulse,2,2);
  ctx.fillStyle='#2b1120'; ctx.fillRect(x-12,y-20+pulse+jaw,24,6);
  ctx.fillRect(x-13,y-18+pulse+jaw,5,5); ctx.fillRect(x+8,y-18+pulse+jaw,5,5);
  ctx.fillStyle='rgba(255,130,180,0.2)'; ctx.fillRect(x-22,y-30+pulse,44,7);
  ctx.fillStyle='#ffd2e5';
  ctx.font='bold 9px monospace'; ctx.textAlign='center';
  ctx.fillText('TR', x, y-58+pulse);
  ctx.font='bold 7px monospace';
  ctx.fillText('HATE BOSS', x, y-50+pulse);
  // HP bar
  const bw=60, bfill=Math.round((b.hp/b.maxHp)*bw);
  ctx.fillStyle='#440000'; ctx.fillRect(x-30,y-60,bw,8);
  ctx.fillStyle='#ff2222'; ctx.fillRect(x-30,y-60,bfill,8);
  ctx.strokeStyle='#fff'; ctx.lineWidth=0.5; ctx.strokeRect(x-30,y-60,bw,8);
  ctx.restore();
}

function getPlayerAnimState(p) {
  if (p.hp <= 0 || p.deadTimer > 0) return 'death';
  if (p.invincible > 0 && p.hurtTimer > 0) return 'hurt';
  if (p.shootTimer > 0 && Math.abs(p.vx) < 0.65 && p.onGround) return 'shoot';
  if (!p.onGround) return p.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(p.vx) > 0.7) return 'run';
  if (p.shootTimer > 0) return 'shoot';
  return 'idle';
}

function getEnemyAnimState(e) {
  if (!e.alive) return 'death';
  if (e.hurtTimer > 0) return 'hurt';
  if (e.shootTimer > 0) return 'shoot';
  if (Math.abs(e.vx) > 0.2) return 'run';
  return 'idle';
}

function getBossAnimState(b) {
  if (!b.alive) return 'death';
  if (b.hurtTimer > 0) return 'hurt';
  if (b.atkTimer % 42 < 20) return 'attack';
  return 'idle';
}

function drawGreg(x, y, facing, invincible, gunRecoil = 0, gunFlash = 0) {
  const p = state.player;
  const next = getPlayerAnimState(p);
  setAnimState(p.anim, next);
  stepAnim(p.anim, SPRITES.player);
  const hitFlashAlpha = (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) ? 0.55 : 1;
  const drawn = drawSpriteFrame('player', p.anim, x + state.camX, y + 32, facing, hitFlashAlpha);
  if (!drawn) drawGregFallback(x, y, facing, invincible, gunRecoil, gunFlash);
}

function drawEnemy(e) {
  if (!e.alive && e.deadTimer <= 0) return;
  const next = getEnemyAnimState(e);
  setAnimState(e.anim, next);
  stepAnim(e.anim, SPRITES.enemy);
  const alpha = !e.alive ? Math.max(0, e.deadTimer / 20) : 1;
  const drawn = drawSpriteFrame('enemy', e.anim, e.x, e.y + 16, e.vx >= 0 ? 1 : -1, alpha);
  if (!drawn) drawEnemyFallback(e, alpha);
  if (e.alive && e.telegraphTimer > 0) {
    const tx = Math.round(e.x - state.camX);
    const ty = Math.round(e.y - 34);
    ctx.save();
    ctx.globalAlpha = e.telegraphTimer / 12;
    ctx.fillStyle = '#ff9a4d';
    ctx.fillRect(tx - 8, ty, 16, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(tx - 2, ty - 6, 4, 4);
    ctx.restore();
  }
}

function drawBoss(b) {
  if (!b.alive && b.deadTimer <= 0) return;
  const next = getBossAnimState(b);
  setAnimState(b.anim, next);
  stepAnim(b.anim, SPRITES.boss);
  const alpha = !b.alive ? Math.max(0, b.deadTimer / 30) : 1;
  const drawn = drawSpriteFrame('boss', b.anim, b.x, b.y + 30, b.dir >= 0 ? 1 : -1, alpha);
  if (!drawn) drawBossFallback(b, alpha);
  if (b.alive && b.telegraphTimer > 0) {
    const x = Math.round(b.x - state.camX);
    const y = Math.round(b.y - 66);
    ctx.save();
    ctx.globalAlpha = b.telegraphTimer / 8;
    ctx.fillStyle = '#ff4a7a';
    ctx.fillRect(x - 24, y, 48, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 3, y - 8, 6, 6);
    ctx.restore();
  }
}

// ---- DRAW GEM ----
function drawGem(g) {
  if (g.collected) return;
  const x = Math.round(g.x - state.camX);
  const y = Math.round(g.y - Math.sin(frame*0.05)*3);
  const ri = Math.floor(frame/8)%6;
  ctx.save();
  ctx.fillStyle=PRIDE_COLS[ri];         ctx.fillRect(x-5,y-8,10,4);
  ctx.fillStyle=PRIDE_COLS[(ri+1)%6];  ctx.fillRect(x-7,y-4,14,4);
  ctx.fillStyle=PRIDE_COLS[(ri+2)%6];  ctx.fillRect(x-5,y,  10,4);
  ctx.fillStyle='#fff'; ctx.fillRect(x-1,y-10,2,2); ctx.fillRect(x+5,y-4,2,2);
  ctx.restore();
}

function drawPowerup(pu) {
  if (pu.collected) return;
  const x = Math.round(pu.x - state.camX);
  const y = Math.round(pu.y + Math.sin((frame + pu.x) * 0.08) * 2);
  const isJairo = pu.type === 'jairo' || pu.type === 'spread';
  const isMark = pu.type === 'mark' || pu.type === 'beam';
  const isHeavy = pu.type === 'heavy';
  ctx.save();
  ctx.fillStyle = isJairo ? '#ff7eb8' : (isMark ? '#b2ff8e' : (isHeavy ? '#ff9a55' : '#8ed0ff'));
  ctx.fillRect(x - 8, y - 8, 16, 14);
  ctx.fillStyle = '#f7d8bf';
  ctx.fillRect(x - 6, y - 10, 12, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 4, y - 8, 2, 2);
  ctx.fillRect(x + 2, y - 8, 2, 2);
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isJairo ? 'S' : (isMark ? 'B' : (isHeavy ? 'H' : 'K')), x, y + 3);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x - 2, y - 14, 4, 3);
  ctx.restore();
}

function drawPrideFlag(flag) {
  if (flag.collected) return;
  const x = Math.round(flag.x - state.camX);
  const y = Math.round(flag.y + Math.sin((frame + flag.x) * 0.06) * 2);
  const wave = Math.sin((frame + flag.x) * 0.12) * 2;
  ctx.save();
  ctx.fillStyle = '#c8a86b';
  ctx.fillRect(x - 8, y - 12, 2, 18);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = PRIDE_COLS[i];
    ctx.fillRect(x - 6, y - 12 + i * 2, 10 + wave, 2);
  }
  ctx.fillStyle = '#ff6fb0';
  ctx.fillRect(x + 4 + wave, y - 3, 6, 5);
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('♥', x + 7 + wave, y + 1);
  ctx.restore();
}

function drawDestructible(obj) {
  if (!obj.alive) return;
  const x = Math.round(obj.x - state.camX);
  const y = Math.round(obj.y);
  const ratio = Math.max(0, obj.hp / (obj.type === 'barrel' ? 3 : 2));
  ctx.save();
  const col = obj.type === 'crate' ? '#7a4d20' : (obj.type === 'barricade' ? '#58606a' : (obj.type === 'barrel' ? '#a8397b' : '#b58b2f'));
  ctx.fillStyle = col; ctx.fillRect(x - obj.w / 2, y - obj.h, obj.w, obj.h);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x - obj.w / 2 + 2, y - obj.h + 2, obj.w - 4, 3);
  ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
  ctx.fillText(obj.type === 'sign' ? 'PRIDE' : (obj.type === 'barrel' ? 'GLIT' : 'X'), x, y - obj.h / 2);
  ctx.fillStyle = '#111'; ctx.fillRect(x - obj.w / 2, y - obj.h - 5, obj.w, 3);
  ctx.fillStyle = '#9effd4'; ctx.fillRect(x - obj.w / 2, y - obj.h - 5, obj.w * ratio, 3);
  ctx.restore();
}

function drawRescue(rescue) {
  if (rescue.collected) return;
  const x = Math.round(rescue.x - state.camX);
  const y = Math.round(rescue.y + Math.sin((frame + rescue.x) * 0.08) * 2);
  ctx.save();
  ctx.fillStyle = '#ffe3f4'; ctx.fillRect(x - 9, y - 16, 18, 16);
  ctx.fillStyle = '#57a8ff'; ctx.fillRect(x - 7, y - 14, 14, 8);
  ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
  ctx.fillText('+', x, y - 7);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 2, y - 20, 4, 3);
  ctx.restore();
}

function drawBonusTargets() {
  if (!state.bonusTargets) return;
  state.bonusTargets.forEach(t => {
    const x = Math.round(t.x - state.camX);
    const y = Math.round(t.y);
    ctx.fillStyle = t.name === 'Jairo' ? '#ffb25a' : '#8bf0ce';
    ctx.fillRect(x - 9, y - 20, 18, 20);
    ctx.fillStyle = '#f0c89a'; ctx.fillRect(x - 7, y - 28, 14, 10);
    ctx.fillStyle = '#111'; ctx.fillRect(x - 4, y - 24, 2, 2); ctx.fillRect(x + 2, y - 24, 2, 2);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(t.name[0], x, y - 11);
  });
}

function drawBullet(b) {
  const x = Math.round(b.x - state.camX), y = Math.round(b.y);
  const spread = b.type === 'spread';
  const beam = b.type === 'beam';
  const glitter = b.type === 'glitter';
  ctx.save();
  const trailLen = (beam ? 24 : (spread ? 16 : (glitter ? 14 : 10))) + Math.abs(b.vx) * 1.3;
  const grad = ctx.createLinearGradient(x - b.dir * trailLen, y, x, y);
  grad.addColorStop(0, beam ? 'rgba(120,255,255,0)' : (spread ? 'rgba(255,150,80,0)' : (glitter ? 'rgba(255,130,220,0)' : 'rgba(255,120,0,0)')));
  grad.addColorStop(1, beam ? 'rgba(255,255,255,0.96)' : (spread ? 'rgba(255,220,160,0.95)' : (glitter ? 'rgba(255,210,245,0.95)' : 'rgba(255,210,120,0.85)')));
  ctx.strokeStyle = grad;
  ctx.lineWidth = beam ? 4 : (spread ? 2.8 : 2.4);
  ctx.beginPath();
  ctx.moveTo(x - b.dir * trailLen, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  if (beam) {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = PRIDE_COLS[(i + Math.floor(frame / 3)) % 6];
      ctx.fillRect(x - b.dir * (10 - i), y - 3 + (i % 2), 2, 2);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  } else if (spread) {
    ctx.fillStyle='rgba(255,180,90,0.65)';
    ctx.fillRect(x-9*b.dir,y-2,8,4);
    ctx.fillStyle='#ffd674'; ctx.fillRect(x-2,y-1,7,3);
  } else if (glitter) {
    const twinkle = Math.abs(Math.sin(frame * 0.5));
    ctx.fillStyle=`rgba(255,120,220,${0.6 + twinkle * 0.35})`;
    ctx.fillRect(x-4,y-4,8,8);
    ctx.fillStyle='#fff';
    ctx.fillRect(x-1,y-5,2,10);
    ctx.fillRect(x-5,y-1,10,2);
  } else {
    ctx.fillStyle='rgba(255,180,0,0.45)';
    ctx.fillRect(x-9*b.dir,y-2,7,4);
    ctx.fillStyle='#ffee66'; ctx.fillRect(x-3,y-1,7,3);
    ctx.fillStyle='#fff'; ctx.fillRect(x+3*b.dir,y-1,2,2);
  }
  ctx.restore();
}

function drawGrenade(g) {
  const x = Math.round(g.x - state.camX), y = Math.round(g.y);
  ctx.save();
  ctx.fillStyle = '#3f4f74';
  ctx.fillRect(x - 4, y - 4, 8, 8);
  ctx.fillStyle = '#bad4ff';
  ctx.fillRect(x - 2, y - 2, 4, 4);
  ctx.fillStyle = 'rgba(255,210,120,0.45)';
  ctx.fillRect(x - 1, y - 8, 2, 3);
  ctx.restore();
}

function drawEnemyShot(s) {
  const x = Math.round(s.x - state.camX), y = Math.round(s.y);
  const flicker = Math.abs(Math.sin((frame + s.x) * 0.32));
  ctx.save();
  ctx.fillStyle=`rgba(255,85,34,${0.6 + flicker * 0.4})`; ctx.fillRect(x-3,y-3,6,6);
  ctx.fillStyle='#ffd27a'; ctx.fillRect(x-1,y-1,2,2);
  ctx.fillStyle='rgba(255,120,60,0.35)';
  ctx.fillRect(x - Math.sign(s.vx || 1) * 6, y - 1, 5, 2);
  ctx.restore();
}

function drawExplosions() {
  state.explosions.forEach(ex=>{
    const drawn = drawSpriteFrame('explosion', ex.anim, ex.x, ex.y, 1, ex.life / ex.maxLife);
    const x = Math.round(ex.x - state.camX), y = Math.round(ex.y);
    const pulse = Math.max(2, ex.radius * (ex.life / ex.maxLife) * 0.6);
    ctx.save();
    ctx.globalAlpha = (ex.life / ex.maxLife) * 0.45;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    if (!drawn) {
      const r = Math.max(4, ex.radius * (ex.life / ex.maxLife));
      ctx.save();
      ctx.globalAlpha = ex.life / ex.maxLife;
      ctx.fillStyle='rgba(255,120,30,0.8)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,220,120,0.9)';
      ctx.beginPath(); ctx.arc(x, y, r*0.45, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });
}

// ---- DRAW WORLD ----
function drawWorld() {
  const L = LEVELS[state.level];
  ctx.fillStyle=L.bg[0]; ctx.fillRect(0,0,W,H/2);
  ctx.fillStyle=L.bg[1]; ctx.fillRect(0,H/2,W,H/2);
  // distant mountains
  for (let i = 0; i < 7; i++) {
    const mx = ((i * 180) - (state.camX * 0.12)) % (W + 280) - 140;
    const peak = 84 + (i % 3) * 14;
    ctx.fillStyle = 'rgba(18,22,42,0.36)';
    ctx.beginPath();
    ctx.moveTo(mx, H / 2 + 40);
    ctx.lineTo(mx + 56, peak);
    ctx.lineTo(mx + 120, H / 2 + 40);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const cloudX = ((i * 190) - (state.camX * (0.08 + i * 0.01)) + frame * 0.18) % (W + 220) - 110;
    const cloudY = 36 + i * 15 + Math.sin((frame + i * 13) * 0.01) * 3;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(cloudX, cloudY, 62, 12);
    ctx.fillRect(cloudX + 12, cloudY - 6, 40, 8);
  }
  // metal-slug style parallax jungle + ruins
  for (let i=0;i<6;i++) {
    const tx = ((i*150) - (state.camX*0.25)%900);
    ctx.fillStyle='rgba(12,40,20,0.35)';
    ctx.fillRect(tx, 110, 34, 120);
    ctx.fillRect(tx+7, 86, 20, 30);
    ctx.fillStyle='rgba(20,60,25,0.25)';
    ctx.fillRect(tx-12, 98, 62, 15);
  }
  // palm silhouettes / debris for metal-slug style battlefield
  for (let i = 0; i < 6; i++) {
    const px = ((i * 165) - (state.camX * 0.7)) % (W + 180) - 90;
    ctx.fillStyle = 'rgba(15,32,16,0.42)';
    ctx.fillRect(px, H - 176, 8, 98);
    for (let frond = 0; frond < 4; frond++) {
      ctx.fillRect(px - 12 + frond * 5, H - 178 + frond * 5, 28, 3);
    }
  }
  for (let i=0;i<5;i++) {
    const rx = ((i*190) - (state.camX*0.4)%950);
    ctx.fillStyle='rgba(55,45,40,0.35)';
    ctx.fillRect(rx, 170, 58, 72);
    ctx.fillStyle='rgba(95,80,70,0.2)';
    ctx.fillRect(rx+6, 176, 46, 10);
  }
  // stars
  for (let i=0;i<30;i++){
    const sx=(i*137+state.camX*0.05)%W, sy=(i*97)%120;
    ctx.fillStyle='#fff';
    if (frame%60<30||i%3!==0) ctx.fillRect(sx,sy,1.5,1.5);
  }
  for (let i = 0; i < 8; i++) {
    const beamX = ((i * 120) - (state.camX * 0.6) - frame * 1.7) % (W + 100) - 50;
    ctx.fillStyle='rgba(255,180,90,0.06)';
    ctx.fillRect(beamX, 0, 3, H);
  }
  if (L.scenery === 'neon' || L.scenery === 'city') {
    for (let i = 0; i < 9; i++) {
      const bx = ((i * 120) - (state.camX * 0.42)) % (W + 160) - 80;
      const bh = 70 + (i % 4) * 24;
      ctx.fillStyle = 'rgba(14,18,34,0.58)';
      ctx.fillRect(bx, H - 172 - bh, 54, bh);
      ctx.fillStyle = 'rgba(120,230,255,0.2)';
      for (let w = 0; w < 4; w++) ctx.fillRect(bx + 8 + w * 10, H - 164 - bh + (w % 2) * 18, 6, 8);
    }
  } else if (L.scenery === 'industrial' || L.scenery === 'boss') {
    for (let i = 0; i < 8; i++) {
      const sx = ((i * 170) - (state.camX * 0.58)) % (W + 190) - 90;
      ctx.fillStyle = 'rgba(22,22,28,0.56)';
      ctx.fillRect(sx, H - 188, 18, 116);
      ctx.fillRect(sx + 24, H - 206, 12, 134);
      ctx.fillStyle = 'rgba(255,120,95,0.16)';
      ctx.fillRect(sx + 20, H - 212, 6, 16);
    }
  } else if (L.scenery === 'snow') {
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 71) + frame * 1.5 - state.camX * 0.3) % (W + 40) - 20;
      const sy = ((i * 37) + frame * 0.9) % H;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(sx, sy, 2, 2);
    }
    const lettersY = 78 + Math.sin(frame * 0.08) * 4;
    const rainbow = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];
    const bannerText = 'HAPPY BIRTHDAY GREG';
    for (let i = 0; i < bannerText.length; i++) {
      ctx.fillStyle = rainbow[i % rainbow.length];
      ctx.font = 'bold 19px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(bannerText[i], 48 + i * 14, lettersY);
    }
  }
  // metal-slug style foreground girders
  for (let i = 0; i < 5; i++) {
    const gx = ((i * 210) - (state.camX * 0.95)) % (W + 200) - 100;
    ctx.fillStyle='rgba(12,10,18,0.22)';
    ctx.fillRect(gx, H - 150, 16, 130);
    ctx.fillRect(gx + 30, H - 170, 12, 150);
    ctx.fillRect(gx - 6, H - 168, 52, 4);
  }
  // ground
  ctx.fillStyle='#2d1b00'; ctx.fillRect(0-state.camX%state.worldW,L.groundY,state.worldW+W,H);
  ctx.fillStyle='#1a5c1a'; ctx.fillRect(0-state.camX%state.worldW,L.groundY,state.worldW+W,8);
  for (let i=0;i<6;i++){ctx.fillStyle=PRIDE_COLS[i]; ctx.fillRect(0-state.camX%state.worldW,L.groundY+8+i*2,state.worldW+W,2);}
  // platforms
  state.platforms.forEach(([px,py,pw])=>{
    const sx = px - state.camX;
    ctx.fillStyle='#3a2200'; ctx.fillRect(sx,py,pw,16);
    ctx.fillStyle='#5a3300'; ctx.fillRect(sx,py,pw,6);
    for(let i=0;i<6;i++){ctx.fillStyle=PRIDE_COLS[i]; ctx.fillRect(sx,py+8+i,pw,1);}
  });
  // extraction gate for final level so players can end the mission consistently
  if (L.bossX && (!state.boss || !state.boss.alive)) {
    const gateX = state.finishZoneX - state.camX;
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(gateX - 24, L.groundY - 62, 48, 62);
    ctx.fillStyle='#ff6bd6'; ctx.fillRect(gateX - 16, L.groundY - 54, 32, 10);
    ctx.fillStyle='#83fffd'; ctx.fillRect(gateX - 16, L.groundY - 41, 32, 28);
    ctx.fillStyle='#100819'; ctx.fillRect(gateX - 10, L.groundY - 37, 20, 20);
    ctx.fillStyle='#fff'; ctx.font='9px monospace'; ctx.textAlign='center';
    ctx.fillText('EXTRACT', gateX, L.groundY - 58);
  }
}

// ---- PARTICLES ----
function spawnParticles(x, y, colors, n=8) {
  for (let i=0;i<n;i++){
    state.particles.push({
      x: x-state.camX, y,
      vx: (Math.random()-0.5)*4,
      vy: -Math.random()*4-1,
      life: 40,
      maxLife: 40,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random()*colors.length)]
    });
  }
}

function spawnSparkBurst(x, y, dir = 1, n = 6) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x: x - state.camX,
      y,
      vx: dir * (2 + Math.random() * 3) + (Math.random()-0.5),
      vy: (Math.random()-0.5) * 1.5,
      life: 14 + Math.floor(Math.random() * 8),
      maxLife: 22,
      size: 1.5 + Math.random() * 2,
      color: ['#fffbc7', '#ffc65e', '#ff8f2e'][Math.floor(Math.random() * 3)]
    });
  }
}

function spawnShellCasings(x, y, dir = 1, n = 2) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x: x - state.camX,
      y: y + (Math.random() - 0.5) * 3,
      vx: -dir * (1.2 + Math.random() * 2.2),
      vy: -1.5 - Math.random() * 2,
      life: 28 + Math.floor(Math.random() * 10),
      maxLife: 38,
      size: 1.8 + Math.random() * 2.2,
      color: ['#d7b97a', '#f4d77f', '#b38b42'][Math.floor(Math.random() * 3)]
    });
  }
}

// Score/combo popup helper for satisfying arcade combat readability.
function spawnScorePopup(x, y, text, color = '#fff3ae', life = 36) {
  state.scorePopups.push({ x, y, text, color, life, maxLife: life });
}

// Tiny hit-stop helper used for impactful kills and explosive finishes.
function triggerHitStop(frames = 2) {
  state.hitStopFrames = Math.max(state.hitStopFrames, frames);
}

function updateParticles() {
  state.particles = state.particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
    return p.life>0;
  });
  state.trails = state.trails.filter(t => {
    t.life--;
    return t.life > 0;
  });
  state.scorePopups = state.scorePopups.filter(s => {
    s.y -= 0.55;
    s.life--;
    return s.life > 0;
  });
  if (state.trails.length > 240) state.trails.splice(0, state.trails.length - 240);
}

function drawParticles() {
  state.particles.forEach(p=>{
    ctx.globalAlpha=p.life/(p.maxLife || 40);
    ctx.fillStyle=p.color;
    const size = p.size || 3;
    ctx.fillRect(p.x-size/2,p.y-size/2,size,size);
  });
  state.trails.forEach(t => {
    const sx = t.x - state.camX;
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.fillRect(sx - t.w / 2, t.y - t.h / 2, t.w, t.h);
  });
  state.scorePopups.forEach(s => {
    const sx = Math.round(s.x - state.camX);
    ctx.globalAlpha = s.life / s.maxLife;
    ctx.fillStyle = s.color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(s.text, sx, s.y);
  });
  ctx.globalAlpha=1;
}

function justPressed(code) {
  return !!keys[code] && !prevKeys[code];
}

function justReleased(code) {
  return !keys[code] && !!prevKeys[code];
}

// ---- HUD ----
function drawHUD() {
  const touchHudLift = document.getElementById('touchControls')?.classList.contains('enabled') ? 54 : 0;
  ctx.fillStyle='rgba(0,0,0,0.66)'; ctx.fillRect(0,0,W,52);
  ctx.fillStyle='#ff69b4'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
  ctx.fillText('LEVEL '+(state.level+1)+': '+state.levelName, 10, 18);
  ctx.fillStyle='#ffe38a'; ctx.font='bold 12px monospace'; ctx.textAlign='right';
  ctx.fillText(`SCORE ${String(state.score).padStart(7, '0')}`, W - 10, 18);
  ctx.fillStyle='#9cf6ff';
  ctx.textAlign='center';
  const spreadActive = state.player.weaponMode === 'spread' && Number.isFinite(state.player.weaponAmmo);
  const beamActive = state.player.weaponMode === 'beam' && Number.isFinite(state.player.weaponAmmo);
  const glitterActive = state.player.weaponMode === 'kiss' && Number.isFinite(state.player.weaponAmmo);
  const heavyActive = state.player.weaponMode === 'heavy' && Number.isFinite(state.player.weaponAmmo);
  ctx.fillText(
    heavyActive ? 'ARMS • HEAVY SHOT' : (glitterActive ? 'ARMS • KISS CANNON' : (beamActive ? 'ARMS • RAINBOW BEAM' : (spreadActive ? 'ARMS • SPREAD POP' : 'ARMS • PISTOL ∞'))),
    W/2,
    18
  );
  ctx.fillStyle='#ffffff'; ctx.font='10px monospace'; ctx.fillText(`AMMO ${Number.isFinite(state.player.weaponAmmo) ? state.player.weaponAmmo : '∞'}`, W/2, 33);
  // hearts
  for (let i=0;i<state.player.maxHp;i++){
    ctx.fillStyle = i < state.player.hp ? '#ff1493' : '#444';
    ctx.font='16px monospace'; ctx.textAlign='right';
    ctx.fillText('♥', W-10-i*22, 18);
  }
  // gems
  const collected = state.gems.filter(g=>g.collected).length;
  const flagCount = state.prideFlags.filter(f => f.collected).length;
  ctx.fillStyle='#ffd700'; ctx.font='12px monospace'; ctx.textAlign='left';
  ctx.fillText('★ '+collected+'/'+Math.max(1, state.gems.length), 10, 42);
  ctx.fillStyle='#ff95c8'; ctx.fillText('⚑ '+flagCount+'/'+state.prideFlags.length, 78, 42);
  ctx.fillStyle='#ffb347'; ctx.fillText('BOMBS '+state.bombs, 170, 42);
  if (state.player.dashCooldown === 0) {
    ctx.fillStyle='#a8ffcf';
    ctx.fillText('ROLL READY', 268, 42);
  } else {
    ctx.fillStyle='#6a8b7b';
    ctx.fillText(`ROLL ${Math.ceil(state.player.dashCooldown / 10)}`, 268, 42);
  }
  if (state.combo > 1 && state.comboTimer > 0) {
    ctx.fillStyle='#ff9f33';
    ctx.font='bold 12px monospace';
    ctx.textAlign='center';
    ctx.fillText(`RUSH x${state.combo}`, W/2 + 110, 42);
  }
  if (state.boss && state.boss.alive) {
    const bw = 220;
    const bh = 9;
    const bx = W / 2 - bw / 2;
    const by = 56;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#3a1010'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#ff4b68'; ctx.fillRect(bx, by, bw * (state.boss.hp / state.boss.maxHp), bh);
    ctx.fillStyle = '#fff'; ctx.font='bold 9px monospace'; ctx.textAlign='center'; ctx.fillText('BOSS CORE', W / 2, by + 8);
  }
  if (state.bonusStage) {
    ctx.fillStyle = '#9ef4ff'; ctx.textAlign = 'right'; ctx.font = 'bold 11px monospace';
    ctx.fillText(`BONUS ${Math.ceil(state.bonusStage.timer / 60)}s`, W - 10, 42);
    ctx.fillStyle = '#ffb2ef'; ctx.fillText(`MULTI x${state.bonusStage.multiplier}`, W - 10, 56);
  }
  if (state.superMode.active) {
    ctx.fillStyle = '#ffd8ff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`ARMOR ${state.superMode.armor}`, 350, 42);
  }
  if (Math.floor(frame / 30) % 2 === 0) {
    ctx.fillStyle='rgba(255,255,255,0.82)';
    ctx.font='10px monospace';
    ctx.textAlign='right';
    ctx.fillText('INSERT COIN', W - 10, H - 10);
  }
  if (state.player.hp <= 1) {
    state.lowHpFlash = Math.min(1, state.lowHpFlash + 0.08);
    const pulse = 0.18 + Math.abs(Math.sin(frame * 0.25)) * 0.2;
    ctx.fillStyle = `rgba(255,20,120,${pulse})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd2eb';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DANGER ♥ LOW HP', W / 2, 60);
  } else {
    state.lowHpFlash = Math.max(0, state.lowHpFlash - 0.05);
  }
  // message
  if (state.msgTimer > 0){
    const alpha = Math.min(1, state.msgTimer/30);
    const msgBoxY = H - 52 - touchHudLift;
    const msgTextY = H - 30 - touchHudLift;
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(W/2-200,msgBoxY,400,36);
    ctx.fillStyle='#adf'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText(state.msgText, W/2, msgTextY);
    ctx.globalAlpha=1;
    state.msgTimer--;
  }

  if (state.levelIntroTimer > 0) {
    const pulse = Math.abs(Math.sin(frame*0.18))*0.25 + 0.72;
    ctx.globalAlpha = pulse;
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(W/2-190, H/2-42, 380, 84);
    ctx.strokeStyle='#ff7a2f'; ctx.lineWidth=2; ctx.strokeRect(W/2-190, H/2-42, 380, 84);
    ctx.fillStyle='#fff';
    ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText(`MISSION ${state.level+1} START!`, W/2, H/2+8);
    ctx.globalAlpha = 1;
    state.levelIntroTimer--;
  }
  if (state.eventBanners.length > 0) {
    const banner = state.eventBanners[0];
    const t = banner.life / banner.maxLife;
    ctx.globalAlpha = Math.min(1, t * 1.6);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W/2-170, 64, 340, 34);
    ctx.strokeStyle = banner.color; ctx.strokeRect(W/2-170, 64, 340, 34);
    ctx.fillStyle = banner.color; ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText(banner.text, W/2, 86);
    ctx.globalAlpha = 1;
    banner.life--;
    if (banner.life <= 0) state.eventBanners.shift();
  }
  const letterbox = state.cinematic ? state.cinematic.letterbox : 0;
  if (letterbox > 0.2) {
    const h = Math.min(52, letterbox);
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, h);
    ctx.fillRect(0, H - h, W, h);
  }
}

// ---- PHYSICS ----
function updatePlayer() {
  const p = state.player;
  const L = LEVELS[state.level];
  const wasOnGround = p.onGround;
  const { maxSpeed, accel, airAccel, friction, grav, jumpPow } = ARCADE_TUNING.move;
  const movingLeft = keys['ArrowLeft'] || keys['KeyA'];
  const movingRight = keys['ArrowRight'] || keys['KeyD'];
  const aimingUp = keys['ArrowUp'] || keys['KeyW'];
  const aimingDown = keys['ArrowDown'] || keys['KeyS'];
  const jumpHeld = keys['Space'] || aimingUp;
  const jumpTap = justPressed('Space') || justPressed('ArrowUp') || justPressed('KeyW');
  const jumpRelease = justReleased('Space') || justReleased('ArrowUp') || justReleased('KeyW');
  const dashTap = justPressed('ShiftLeft') || justPressed('ShiftRight');
  const dashDir = movingLeft && !movingRight ? -1 : (movingRight && !movingLeft ? 1 : p.facing);

  const changingDirection = (movingLeft && p.vx > 1.5) || (movingRight && p.vx < -1.5);
  if (movingLeft && !movingRight) {
    p.vx -= p.onGround ? accel : airAccel;
    p.facing = -1;
  } else if (movingRight && !movingLeft) {
    p.vx += p.onGround ? accel : airAccel;
    p.facing = 1;
  } else {
    p.vx *= p.onGround ? friction : 0.94;
  }
  p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
  p.crouching = p.onGround && aimingDown && Math.abs(p.vx) < 1.35 && p.dashTimer === 0;
  if (p.crouching) p.vx *= 0.55;
  if (aimingUp && p.onGround && !jumpTap) {
    p.aimMode = Math.abs(p.vx) > 1 || movingLeft || movingRight ? 'diagUp' : 'up';
  } else if (p.crouching) p.aimMode = 'low';
  else p.aimMode = 'forward';

  if (p.onGround) p.coyote = 10;
  else p.coyote = Math.max(0, p.coyote - 1);

  if (jumpTap && (p.onGround || p.coyote > 0)) {
    p.vy = jumpPow;
    p.onGround = false;
    p.coyote = 0;
  }

  if (jumpRelease && p.vy < -3 && !jumpHeld) p.vy *= 0.62;

  if (dashTap && p.onGround && p.dashCooldown === 0 && p.dashTimer === 0) {
    p.dashTimer = ARCADE_TUNING.dash.duration;
    p.dashCooldown = ARCADE_TUNING.dash.cooldown;
    p.facing = dashDir;
    p.vx = dashDir * ARCADE_TUNING.dash.speed;
    p.invincible = Math.max(p.invincible, ARCADE_TUNING.dash.invuln);
    state.msgText = "Combat roll! Metal-Slug style movement online.";
    state.msgTimer = 28;
    spawnParticles(p.x, p.y + 30, ['#fff','#ffd27a','#aa7f43'], 8);
    addImpactShake('bullet');
  }

  p.vy += grav;
  if (p.dashTimer > 0) {
    p.dashTimer--;
    p.vy = Math.min(p.vy, 0.6);
    p.vx = p.facing * (ARCADE_TUNING.dash.speed - 0.2);
    if (frame % 2 === 0) {
      state.trails.push({
        x: p.x - p.facing * 10,
        y: p.y + 18,
        w: 24,
        h: 12,
        life: 6,
        maxLife: 6,
        color: `rgba(${220 + Math.floor(Math.random() * 35)},${145 + Math.floor(Math.random() * 100)},255,0.36)`
      });
    }
  }
  p.x += p.vx;
  p.y += p.vy;

  // ground
  if (p.y+32>=L.groundY){ p.y=L.groundY-32; p.vy=0; p.onGround=true; }
  else p.onGround=false;

  // platforms
  state.platforms.forEach(([px,py,pw])=>{
    if (p.x+8>px && p.x-8<px+pw && p.y+32>py && p.y+32<py+20 && p.vy>=0){
      p.y=py-32; p.vy=0; p.onGround=true;
    }
  });
  if (!wasOnGround && p.onGround) {
    p.landingImpact = 10;
    spawnParticles(p.x, p.y + 31, ['#f3cf8a', '#9e7d43', '#fff0c2'], 7);
    addImpactShake('hardLanding');
    if (Math.abs(p.vy) > 4.2) triggerHitStop(1);
  }

  // bounds
  if (p.x<20) p.x=20;
  if (p.x>state.worldW-20) p.x=state.worldW-20;
  if (p.y>H+50){ p.hp=Math.max(0,p.hp-1); p.x=60; p.y=260; p.vy=0; p.invincible=60; }
  if (p.invincible>0) p.invincible--;
  p.hurtTimer = Math.max(0, p.hurtTimer - 1);
  p.shootTimer = Math.max(0, p.shootTimer - 1);
  p.deadTimer = Math.max(0, p.deadTimer - 1);
  if (state.comboTimer > 0) state.comboTimer--;
  else state.combo = 0;
  if (state.fireCooldown>0) state.fireCooldown--;
  p.gunRecoil = Math.max(0, p.gunRecoil - 1);
  p.gunFlash = Math.max(0, p.gunFlash - 1);
  p.runDustTimer = Math.max(0, p.runDustTimer - 1);
  p.landingImpact = Math.max(0, p.landingImpact - 1);
  p.tilt += ((p.vx * 6) - p.tilt) * 0.2;
  p.facingVisual += (p.facing - p.facingVisual) * 0.35;
  p.recoilPose = Math.max(0, p.recoilPose - 1);
  if (Number.isFinite(p.weaponAmmo) && p.weaponAmmo <= 0) {
    p.weaponMode = 'pistol';
    p.weaponAmmo = Infinity;
    spawnEventBanner('PISTOL AUTO-RESTORE', '#ffd7a8', 60);
  }
  if (p.dashCooldown > 0) p.dashCooldown--;

  if (p.onGround && Math.abs(p.vx) > 1.5 && p.runDustTimer === 0) {
    spawnParticles(p.x - p.facing * 8, p.y + 30, ['#d8b57a','#b48a53','#6a4e31'], 3);
    p.runDustTimer = 4;
  }
  if (p.onGround && changingDirection && p.skidFxTimer === 0) {
    spawnParticles(p.x - p.facing * 6, p.y + 30, ['#ffe4aa', '#f9b07e', '#ffffff'], 6);
    p.skidFxTimer = 8;
  }
  p.skidFxTimer = Math.max(0, p.skidFxTimer - 1);
  if ((Math.abs(p.vx) > 2.4 || Math.abs(p.vy) > 3.2) && frame % 2 === 0) {
    state.trails.push({
      x: p.x,
      y: p.y + 12,
      w: 12,
      h: 20,
      life: 8,
      maxLife: 8,
      color: 'rgba(255,105,180,0.22)'
    });
  }

  // camera
  const lookAhead = p.facing * 84 + p.vx * 6;
  const targetCam = Math.max(0, Math.min(state.worldW - W, p.x - W * 0.42 + lookAhead));
  state.camX += (targetCam - state.camX) * 0.13;

  // gem collect
  state.gems.forEach(g=>{
    if (!g.collected && Math.abs(p.x-g.x)<18 && Math.abs(p.y+16-g.y)<18){
      g.collected=true;
      spawnParticles(g.x, g.y, PRIDE_COLS, 12);
      awardScore(100, false);
    }
  });

  state.powerups.forEach(pu => {
    if (pu.collected) return;
    if (Math.abs(p.x - pu.x) < 18 && Math.abs((p.y + 16) - pu.y) < 20) {
      pu.collected = true;
      giveWeapon(pu.type);
      spawnParticles(pu.x, pu.y, ['#ffffff','#d9e8ff','#ff9fd2'], 16);
      addScreenShake(1.8, 5);
    }
  });

  state.rescues.forEach(r => {
    if (r.collected) return;
    if (Math.abs(p.x - r.x) < 18 && Math.abs((p.y + 16) - r.y) < 20) {
      r.collected = true;
      if (r.type === 'health') p.hp = Math.min(p.maxHp, p.hp + 1);
      if (r.type === 'bomb') state.bombs = Math.min(9, state.bombs + 1);
      if (r.type === 'weapon') giveWeapon('heavy');
      spawnParticles(r.x, r.y, ['#fff', '#9cf6ff', '#ff8fd3'], 18);
      spawnScorePopup(r.x, r.y - 18, r.text, '#e1fffb', 50);
    }
  });

  state.prideFlags.forEach(flag => {
    if (flag.collected) return;
    if (Math.abs(p.x - flag.x) < 18 && Math.abs((p.y + 16) - flag.y) < 20) {
      flag.collected = true;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      state.msgText = "Greg raised a Pride flag and restored one heart.";
      state.msgTimer = 110;
      spawnParticles(flag.x, flag.y, PRIDE_COLS, 14);
    }
  });

  if (p.hp<=0) initLevel(state.level);
}

function fireShot() {
  const p = state.player;
  const mode = p.weaponMode || 'pistol';
  const aim = getAimProfile(p);
  const baseX = p.x + aim.muzzleX;
  const baseY = p.y + aim.muzzleY;
  const speedScale = mode === 'beam' ? 10.8 : (mode === 'heavy' ? 6 : (mode === 'kiss' ? 5.2 : 7.3));
  const shotVX = aim.vx * speedScale;
  const shotVY = aim.vy * speedScale;
  if (mode === 'spread') {
    [-5, 0, 5].forEach((offsetY, i) => {
      const s = 6.1 + i * 0.35;
      state.bullets.push({ x: baseX, y: baseY + offsetY, vx: aim.vx * s, vy: aim.vy * s, dir: p.facing, life: 36, type: 'spread' });
    });
  } else if (mode === 'beam') {
    state.bullets.push({ x: baseX, y: baseY, vx: shotVX, vy: shotVY, dir: p.facing, life: 44, type: 'beam', pierce: 4 });
  } else if (mode === 'heavy') {
    state.bullets.push({ x: baseX, y: baseY - 1, vx: shotVX, vy: shotVY, dir: p.facing, life: 60, type: 'heavy' });
  } else if (mode === 'kiss') {
    state.bullets.push({ x: baseX, y: baseY - 2, vx: shotVX, vy: shotVY - 1.2, dir: p.facing, life: 52, type: 'glitter' });
  } else {
    state.bullets.push({ x: baseX, y: baseY, vx: shotVX, vy: shotVY, dir: p.facing, life: 70, type: 'pistol' });
  }
  p.gunRecoil = mode === 'kiss' ? 9 : (mode === 'beam' ? 5 : (mode === 'heavy' ? 11 : 7));
  p.gunFlash = mode === 'beam' ? 6 : (mode === 'heavy' ? 7 : 5);
  p.recoilPose = 5;
  p.shootTimer = 8;
  state.trails.push({
    x: p.x + p.facing * 22,
    y: p.y + 10 + (mode === 'spread' ? (Math.random() - 0.5) * 8 : 0),
    w: mode === 'beam' ? 48 : (mode === 'heavy' ? 36 : 30),
    h: mode === 'beam' ? 6 : (mode === 'heavy' ? 6 : 4),
    life: 5,
    maxLife: 5,
    color: mode === 'beam' ? 'rgba(120,235,255,0.82)' : (mode === 'spread' ? 'rgba(255,166,128,0.8)' : (mode === 'kiss' ? 'rgba(255,120,220,0.82)' : (mode === 'heavy' ? 'rgba(255,120,90,0.82)' : 'rgba(255,240,150,0.7)')))
  });
  spawnParticles(baseX, baseY, mode === 'beam' ? PRIDE_COLS : (mode === 'spread' ? ['#fff799','#ff8c00','#ffd700'] : (mode === 'heavy' ? ['#ffe3bc','#ff5b29','#fff'] : ['#fff0f8','#ffc7e6','#ff93c7'])), mode === 'beam' ? 9 : 6);
  spawnSparkBurst(baseX, baseY, p.facing, mode === 'beam' ? 10 : (mode === 'heavy' ? 12 : 7));
  spawnShellCasings(p.x + p.facing * 8, p.y + 8, p.facing, mode === 'beam' ? 1 : 2);
  if (Number.isFinite(p.weaponAmmo)) p.weaponAmmo--;
  if (mode === 'heavy') triggerHitStop(1);
  addImpactShake('bullet');
}

function getAimProfile(p) {
  const diag = Math.SQRT1_2;
  if (p.aimMode === 'up') return { vx: 0, vy: -1, muzzleX: p.facing * 5, muzzleY: 2 };
  if (p.aimMode === 'diagUp') return { vx: p.facing * diag, vy: -diag, muzzleX: p.facing * 14, muzzleY: 4 };
  if (p.aimMode === 'low') return { vx: p.facing, vy: 0, muzzleX: p.facing * 22, muzzleY: 19 };
  return { vx: p.facing, vy: 0, muzzleX: p.facing * 18, muzzleY: 10 };
}

function tryMeleeStrike() {
  const p = state.player;
  if (p.meleeTimer > 0) return false;
  const target = state.enemies.find(e => e.alive && Math.abs(e.x - p.x) < 34 && Math.abs((e.y - 10) - (p.y + 12)) < 30);
  if (!target) return false;
  p.meleeTimer = 14;
  p.recoilPose = 6;
  state.meleeEffects.push({ x: p.x + p.facing * 20, y: p.y + 10, dir: p.facing, life: 10, maxLife: 10 });
  target.hp -= 3;
  target.knockbackVX = p.facing * 6.2;
  target.vx = target.knockbackVX;
  spawnSparkBurst(target.x, target.y - 12, p.facing, 12);
  spawnParticles(target.x, target.y, ['#fff', '#ffd699', '#ff8a8a'], 12);
  spawnScorePopup(target.x, target.y - 22, 'SLASH +300', '#ffeec2', 40);
  awardScore(300);
  triggerHitStop(2);
  addImpactShake('enemyKill');
  if (target.hp <= 0) {
    target.alive = false;
    target.deadTimer = 24;
  }
  return true;
}

function updateShooting() {
  if ((keys['KeyJ']||keys['KeyK']||keys['KeyX']) && state.fireCooldown===0){
    if (tryMeleeStrike()) {
      state.fireCooldown = 9;
      return;
    }
    fireShot();
    const moving = Math.abs(state.player.vx) > 1.7;
    const mode = state.player.weaponMode || 'pistol';
    const tune = ARCADE_TUNING.weapons[mode] || ARCADE_TUNING.weapons.pistol;
    state.fireCooldown = moving ? tune.cooldownRun : tune.cooldownIdle;
  }
}

function spawnExplosion(x, y, radius = 56) {
  state.explosions.push({ x, y, radius, life: 18, maxLife: 18, anim: createAnimState('boom') });
  spawnParticles(x, y, ['#ffef99','#ff9433','#ff3300'], 22);
  spawnParticles(x, y, PRIDE_COLS, 14);
  triggerHitStop(radius > 70 ? 3 : 2);
  addImpactShake(radius > 70 ? 'bomb' : 'enemyKill');
}

function updateBombs() {
  if (state.bombCooldown > 0) state.bombCooldown--;
  if (justPressed('KeyL') && state.bombs > 0 && state.bombCooldown === 0) {
    const p = state.player;
    state.bombs--;
    state.bombCooldown = 18;
    state.grenades.push({
      x: p.x + p.facing * 10,
      y: p.y + (p.crouching ? 16 : 8),
      vx: p.facing * (p.crouching ? 3.9 : 4.8),
      vy: p.crouching ? -2.8 : -5.6,
      life: 52
    });
    spawnScorePopup(p.x, p.y - 24, 'GRENADE!', '#ffd78e', 22);
  }
}

function updateGrenades() {
  state.grenades = state.grenades.filter(g => {
    g.x += g.vx;
    g.y += g.vy;
    g.vy += 0.28;
    g.life--;
    if (g.y > H - 32) {
      g.y = H - 32;
      g.vy *= -0.45;
      g.vx *= 0.82;
    }
    if (g.life <= 0 || g.x < 0 || g.x > state.worldW) {
      spawnExplosion(g.x, g.y, 76);
      return false;
    }
    return true;
  });
}

function updateExplosions() {
  state.explosions = state.explosions.filter(ex => {
    stepAnim(ex.anim, SPRITES.explosion);
    ex.life--;
    const damageWindow = ex.life === ex.maxLife - 1;
    if (damageWindow) {
      state.destructibles.forEach(obj => {
        if (!obj.alive) return;
        if (Math.hypot(obj.x - ex.x, (obj.y - obj.h / 2) - ex.y) < ex.radius) {
          obj.hp -= 2;
          spawnParticles(obj.x, obj.y - obj.h / 2, ['#fff', '#ffd59a', '#b98a56'], 8);
          if (obj.hp <= 0) {
            obj.alive = false;
            spawnScorePopup(obj.x, obj.y - obj.h, 'BREAK +200', '#ffe8bc', 40);
            awardScore(200, false);
          }
        }
      });
      state.enemies.forEach(e => {
        if (!e.alive) return;
        if (Math.hypot(e.x - ex.x, (e.y - 10) - ex.y) < ex.radius) {
          e.alive = false;
          e.deadTimer = 20;
          e.vx = (e.x < ex.x ? -1 : 1) * 3;
          e.knockbackVX = e.vx;
          awardScore(250);
          spawnParticles(e.x, e.y, PRIDE_COLS, 18);
          spawnSparkBurst(e.x, e.y - 8, (Math.random() > 0.5 ? 1 : -1), 8);
          spawnScorePopup(e.x, e.y - 26, 'BOOM +250', '#ffeaa0');
          addImpactShake('enemyKill');
        }
      });
      if (state.boss && state.boss.alive && Math.hypot(state.boss.x - ex.x, state.boss.y - ex.y) < ex.radius + 16) {
        state.boss.hp = Math.max(0, state.boss.hp - 2);
        state.boss.hurtTimer = 12;
        spawnParticles(state.boss.x, state.boss.y, ['#ffcc66','#ff3333','#fff'], 20);
        addImpactShake('enemyKill');
        if (state.boss.hp <= 0) {
          state.boss.alive = false;
          state.boss.deadTimer = 30;
          awardScore(2000, false);
          spawnParticles(state.boss.x, state.boss.y, PRIDE_COLS, 30);
          spawnScorePopup(state.boss.x, state.boss.y - 40, 'GLITTER K.O. +2000', '#ffd7ff', 58);
          triggerHitStop(5);
          addImpactShake('bossSlam');
        }
      }
    }
    return ex.life > 0;
  });
}

function updateBullets() {
  state.bullets = state.bullets.filter(b=>{
    b.x+=b.vx;
    b.y += b.vy || 0;
    if (b.type === 'glitter') b.vy = (b.vy || -1.2) + 0.14;
    b.life--;
    if (b.life<=0 || b.x<0 || b.x>state.worldW) return false;
    let hit = false;
    let consumed = false;
    if (b.type === 'glitter' && (b.y > H - 36 || b.life <= 1)) {
      spawnExplosion(b.x, b.y, 92);
      return false;
    }
    if (state.bonusStage && state.bonusTargets && state.bonusTargets.length > 0) {
      for (const t of state.bonusTargets) {
        if (Math.abs(b.x - t.x) < 18 && Math.abs(b.y - (t.y - 14)) < 18) {
          state.bonusStage.hits++;
          state.bonusStage.multiplier = Math.min(8, 1 + Math.floor(state.bonusStage.hits / 4));
          awardScore(70 * state.bonusStage.multiplier, false);
          spawnScorePopup(t.x, t.y - 34, `BONUS x${state.bonusStage.multiplier}`, '#ffc9ff', 28);
          t.dodge = 18;
          t.vx *= -1;
          return false;
        }
      }
    }

    for (const obj of state.destructibles) {
      if (!obj.alive) continue;
      if (Math.abs(b.x - obj.x) < obj.w / 2 + 8 && Math.abs(b.y - (obj.y - obj.h / 2)) < obj.h / 2 + 8) {
        obj.hp -= b.type === 'heavy' ? 2 : 1;
        spawnParticles(obj.x, obj.y - obj.h / 2, ['#fff','#ffd699','#a87b4f'], 6);
        if (obj.hp <= 0) {
          obj.alive = false;
          spawnExplosion(obj.x, obj.y - obj.h / 2, obj.type === 'barrel' ? 68 : 38);
          const drops = ['score', 'bomb', 'weapon', 'health'];
          const drop = drops[Math.floor(Math.random() * drops.length)];
          if (drop === 'score') awardScore(400, false);
          else if (drop === 'bomb') state.bombs = Math.min(9, state.bombs + 1);
          else if (drop === 'health') state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
          else state.rescues.push({ x: obj.x, y: obj.y - 6, type: 'weapon', collected: false, text: 'SUPPORT HEAVY REFILL' });
        }
        return b.type === 'beam';
      }
    }

    state.enemies.forEach(e=>{
      if (!e.alive || hit) return;
      if (Math.abs(b.x-e.x)<16 && Math.abs(b.y-(e.y-8))<16){
        const damage = b.type === 'beam' ? 2 : (b.type === 'heavy' ? 3 : 1);
        e.hp -= damage;
        e.hurtTimer = 10;
        e.telegraphTimer = 0;
        e.x += b.dir * (b.type === 'spread' ? 2.3 : 1.6);
        spawnParticles(e.x, e.y-8, b.type === 'beam' ? PRIDE_COLS : ['#ff66ff','#9966ff','#fff'], 8);
        spawnSparkBurst(e.x, e.y - 8, b.dir, b.type === 'beam' ? 7 : 4);
        addImpactShake('bullet');
        if (b.type === 'beam') {
          b.pierce = (b.pierce || 0) - 1;
          consumed = (b.pierce || 0) < 0;
        } else consumed = true;
        if (e.hp<=0){
          e.alive=false;
          e.deadTimer=24;
          e.knockbackVX = b.dir * 3.5;
          e.vx = b.dir * 2.8;
          awardScore(200);
          spawnParticles(e.x, e.y, PRIDE_COLS, 14);
          spawnScorePopup(e.x, e.y - 26, `SLAY +200`, '#ffefb3');
          triggerHitStop(2);
          addImpactShake('enemyKill');
        }
        hit = true;
      }
    });

    if (!hit && state.boss && state.boss.alive){
      const boss = state.boss;
      if (Math.abs(b.x-boss.x)<28 && Math.abs(b.y-(boss.y-12))<30){
        boss.hp -= b.type === 'glitter' ? 3 : (b.type === 'beam' ? 2 : (b.type === 'heavy' ? 4 : 1));
        awardScore(150, false);
        boss.hurtTimer = 12;
        boss.telegraphTimer = 0;
        spawnParticles(boss.x, boss.y-10, ['#ff6666','#ff2222','#fff'], 8);
        spawnSparkBurst(boss.x - 12, boss.y - 12, b.dir, 6);
        addImpactShake('enemyKill');
        if (b.type !== 'beam') consumed = true;
        if (boss.hp<=0){
          boss.alive=false;
          boss.deadTimer = 30;
          awardScore(2000, false);
          spawnParticles(boss.x, boss.y, PRIDE_COLS, 30);
          spawnScorePopup(boss.x, boss.y - 40, 'FABULOUS FINISH +2000', '#ffd1f8', 56);
          triggerHitStop(4);
          addImpactShake('bossSlam');
        }
        hit = true;
      }
    }

    return !(hit && consumed);
  });
}

function updateEnemyShots() {
  const p = state.player;

  state.enemies.forEach(e => {
    if (!e.alive) return;
    e.fireTimer--;
    if (e.fireTimer <= 18 && e.fireTimer > 0) {
      e.telegraphTimer = 12;
    }
    if (e.fireTimer <= 0) {
      const dx = p.x - e.x;
      const dy = (p.y + 8) - (e.y - 8);
      const len = Math.max(1, Math.hypot(dx, dy));
      state.enemyShots.push({ x:e.x, y:e.y-8, vx:(dx/len)*3.2, vy:(dy/len)*3.2, life:140 });
      e.shootTimer = 10;
      e.fireTimer = 44 + Math.floor(Math.random()*32);
      addImpactShake('bullet');
    }
  });

  if (state.boss && state.boss.alive) {
    const phaseRate = state.boss.phase >= 3 ? 16 : (state.boss.phase === 2 ? 20 : 24);
    if (state.boss.atkTimer % phaseRate === phaseRate - 6) state.boss.telegraphTimer = 8;
    if (state.boss.atkTimer % phaseRate === 0) {
    const dx = p.x - state.boss.x;
    const dy = (p.y + 8) - (state.boss.y - 10);
    const len = Math.max(1, Math.hypot(dx, dy));
    state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*4.2, vy:(dy/len)*4.2, life:130 });
    if (state.boss.phase >= 2 || state.boss.atkTimer % (phaseRate * 2) === 0) {
      state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*3.4 - 1.2, vy:(dy/len)*3.4, life:130 });
      state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*3.4 + 1.2, vy:(dy/len)*3.4, life:130 });
    }
    if (state.boss.phase >= 3) {
      state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*3.5, vy:(dy/len)*3.5 - 1, life:130 });
      if (state.boss.atkTimer % 48 === 0) {
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:Math.cos(a) * 2.8, vy:Math.sin(a) * 2.8, life:95 });
        }
        addImpactShake('enemyKill');
      }
    }
    }
  }

  state.enemyShots = state.enemyShots.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    state.trails.push({
      x: s.x,
      y: s.y,
      w: 8,
      h: 2,
      life: 4,
      maxLife: 4,
      color: 'rgba(255,110,60,0.35)'
    });
    s.life--;
    if (s.life <= 0 || s.x < 0 || s.x > state.worldW || s.y < -20 || s.y > H + 20) return false;

    if (p.invincible===0 && Math.abs(p.x-s.x)<12 && Math.abs((p.y+14)-s.y)<18){
      if (state.superMode.active && state.superMode.armor > 0) {
        state.superMode.armor--;
        spawnEventBanner('ARMOR HIT!', '#ffd27a', 40);
      } else p.hp=Math.max(0,p.hp-1);
      p.invincible=75;
      p.hurtTimer = 22;
      p.vy=-4;
      spawnParticles(p.x, p.y, ['#ff2200','#ff8800','#fff'], 8);
      addScreenShake(2.2, 5);
      return false;
    }
    return true;
  });
}

function updateEnemies() {
  const p = state.player;
  state.enemies.forEach(e=>{
    if (!e.alive) {
      e.x += e.knockbackVX || 0;
      e.knockbackVX *= 0.84;
      if (e.deadTimer % 5 === 0 && e.deadTimer > 0) spawnParticles(e.x, e.y - 10, ['#ffcc55', '#ff6633', '#ffffff'], 2);
      e.deadTimer = Math.max(0, e.deadTimer - 1);
      return;
    }
    e.hurtTimer = Math.max(0, e.hurtTimer - 1);
    e.telegraphTimer = Math.max(0, e.telegraphTimer - 1);
    e.shootTimer = Math.max(0, e.shootTimer - 1);
    if (e.patrolPause > 0) {
      e.patrolPause--;
    } else {
      e.x += e.vx;
      if (e.x<e.minX||e.x>e.maxX) {
        e.vx *= -1;
        e.patrolPause = 8;
      }
    }
    // enemy hits player
    if (p.invincible===0 && Math.abs(p.x-e.x)<20 && Math.abs(p.y+16-e.y)<20){
      if (state.superMode.active && state.superMode.armor > 0) state.superMode.armor--;
      else p.hp=Math.max(0,p.hp-1);
      p.invincible=80; p.hurtTimer=22; p.vy=-5;
      spawnParticles(p.x, p.y, ['#ff0000','#ff6600'], 6);
      addScreenShake(2.4, 6);
    }
    // player stomps
    if (p.vy>0 && p.y+32>e.y-10 && p.y+32<e.y+10 && Math.abs(p.x-e.x)<22){
      e.hp--; p.vy=-6;
      if (e.hp<=0){
        e.alive=false; e.deadTimer=22; e.knockbackVX = p.facing * 3.2;
        awardScore(220);
        spawnParticles(e.x, e.y, PRIDE_COLS, 14);
        spawnScorePopup(e.x, e.y - 26, 'STOMP +220', '#fff8c4');
        addImpactShake('enemyKill');
      }
      else e.hurtTimer = 10;
    }
  });
}

function updateBoss() {
  if (!state.boss) return;
  const b=state.boss, p=state.player;
  b.hurtTimer = Math.max(0, b.hurtTimer - 1);
  b.telegraphTimer = Math.max(0, b.telegraphTimer - 1);
  if (!b.alive) {
    if (b.deadTimer > 0 && b.deadTimer % 4 === 0) {
      spawnExplosion(b.x + (Math.random() - 0.5) * 35, b.y + (Math.random() - 0.5) * 20, 48 + Math.random() * 34);
    }
    b.deadTimer = Math.max(0, b.deadTimer - 1);
    return;
  }
  if (b.introTimer > 0) {
    b.introTimer--;
    state.cinematic.letterbox = Math.min(40, state.cinematic.letterbox + 2.4);
    state.cinematic.cardText = 'BOSS APPROACH • TR';
    state.cinematic.cardTimer = Math.max(state.cinematic.cardTimer, 18);
    state.cinematic.slowmo = 1;
    if (b.introTimer === 58) {
      state.cinematic.whiteFlash = 6;
      spawnEventBanner('BOSS APPROACH', '#ff7a92', 90);
    }
    if (b.introTimer % 14 === 0) addImpactShake('bullet');
    return;
  }
  state.cinematic.letterbox = Math.max(0, state.cinematic.letterbox - 1.2);
  b.atkTimer++;
  const prevPhase = b.phase;
  if (b.hp <= Math.ceil(b.maxHp * 0.33)) b.phase = 3;
  else if (b.hp <= Math.ceil(b.maxHp * 0.66)) b.phase = 2;
  if (b.phase !== prevPhase) {
    spawnEventBanner(b.phase === 2 ? 'BOSS PHASE 2' : 'BOSS FINAL PHASE', '#ff9ed6', 80);
    state.cinematic.whiteFlash = 4;
    addImpactShake('bossSlam');
  }
  const pace = b.phase === 3 ? 1.9 : (b.phase === 2 ? 1.5 : 1.2);
  b.x += b.atkTimer%90<45 ? b.dir*pace : -b.dir*pace;
  if (b.phase === 3 && b.atkTimer % 90 === 20) {
    const dashDir = Math.sign((p.x - b.x) || 1);
    b.x += dashDir * 28;
    spawnEventBanner('BOSS DASH!', '#ff9faf', 36);
    addImpactShake('bossSlam');
  }
  if (b.x>state.worldW-60) b.dir=-1;
  if (b.x<W/2) b.dir=1;
  // hits player
  if (p.invincible===0 && Math.abs(p.x-b.x)<36 && Math.abs((p.y+16)-(b.y+20))<36){
    if (state.superMode.active && state.superMode.armor > 0) state.superMode.armor--;
    else p.hp=Math.max(0,p.hp-1);
    p.invincible=80; p.hurtTimer=24; p.vy=-6;
    spawnParticles(p.x, p.y, ['#ff0000','#aa0000'], 6);
    addScreenShake(3.2, 7);
  }
  // player stomps boss
  if (p.vy>0 && p.y+32>b.y-4 && p.y+32<b.y+10 && Math.abs(p.x-b.x)<36){
    b.hp--; p.vy=-8;
    awardScore(180, false);
    spawnParticles(b.x, b.y, PRIDE_COLS, 10);
    if (b.hp<=0){
      b.alive=false; b.deadTimer=36; awardScore(2000, false); spawnParticles(b.x, b.y, PRIDE_COLS, 30);
      spawnScorePopup(b.x, b.y - 40, 'BOSS BREAK +2000', '#ffd7ff', 60);
      triggerHitStop(5);
      addImpactShake('bossSlam');
    }
    else b.hurtTimer = 12;
  }
}

function updateStageSystems() {
  if (state.complete) return;
  runStageEvents();
  if (state.player.meleeTimer > 0) state.player.meleeTimer--;
  state.meleeEffects = state.meleeEffects.filter(m => (--m.life) > 0);
  if (state.superMode.active) {
    state.superMode.timer--;
    if (state.superMode.timer % 90 === 0) spawnEventBanner(state.superMode.name, '#ffd2ff', 32);
    if (state.superMode.timer <= 0 || state.superMode.armor <= 0) {
      state.superMode.active = false;
      spawnEventBanner('SPECIAL MODE END', '#ffe6b2', 54);
    }
  }
  if (state.bonusTargets && state.bonusTargets.length > 0) {
    state.bonusTargets.forEach(t => {
      t.dodge = Math.max(0, t.dodge - 1);
      const pace = t.dodge > 0 ? 2.4 : 1.35;
      t.x += t.vx * pace;
      if (t.x < 80 || t.x > state.worldW - 40) t.vx *= -1;
      t.y = LEVELS[state.level].groundY - 28 + Math.sin((frame + t.x) * 0.06) * 2;
    });
  }
  if (state.bonusStage) {
    state.bonusStage.timer--;
    if (state.bonusStage.timer % 180 === 0) spawnEventBanner('BONUS STAGE', '#ffccff', 50);
    if (state.bonusStage.timer % 120 === 0) state.bonusStage.multiplier = Math.max(1, state.bonusStage.multiplier - 1);
  }
  if (state.cinematic) {
    state.cinematic.cardTimer = Math.max(0, state.cinematic.cardTimer - 1);
    state.cinematic.whiteFlash = Math.max(0, state.cinematic.whiteFlash - 1);
  }
}

function checkLevelComplete() {
  if (state.complete) return;
  if (state.bonusStage) {
    const gained = state.score - state.bonusStage.startScore;
    if (state.bonusStage.timer <= 0 || gained >= state.bonusStage.scoreTarget) {
      state.complete = true;
      state.msgText = 'BONUS COMPLETE! BACK TO THE MAIN MISSION.';
      state.msgTimer = 120;
    } else return;
  }
  const allGems    = state.gems.every(g=>g.collected);
  const allEnemies = state.enemies.every(e=>!e.alive);
  const bossDown   = !state.boss||!state.boss.alive;
  const needsExtraction = !!LEVELS[state.level].bossX;
  const onFinalLevel = state.level === LEVELS.length - 1;
  const reachedFinishGate = needsExtraction && bossDown && state.player.x >= state.finishZoneX - 20;
  const reachedStageExit = !onFinalLevel && state.player.x >= state.worldW - 44;
  const nonFinalClear = !needsExtraction && allGems && bossDown && (allEnemies || reachedStageExit);
  if (state.bonusStage || nonFinalClear || reachedFinishGate){
    state.complete = true;
    const L = LEVELS[state.level];
    const msg = currentLevel===LEVELS.length-1 ? "BONUS COMPLETE! Greg closes the celebration in style." :
                currentLevel===0 ? "First wall broken. Keep moving forward!" :
                currentLevel===LEVELS.length-2 ? "One final push. Face yourself." :
                "Sector clear. Keep running toward your truth.";
    state.msgText=msg; state.msgTimer=180;
    spawnScorePopup(state.player.x, state.player.y - 30, 'AREA CLEAR!', '#9effd4', 64);
    addImpactShake('enemyKill');

    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(()=>{
      transitionTimer = null;
      if (currentLevel >= LEVELS.length - 1) {
        const endingScene = LEVELS[currentLevel].afterCutscene || 'after_bonus';
        gamePhase='cutscene';
        setTouchControlsEnabled(false);
        cutscenePlayer = new CutscenePlayer(()=>{
          gamePhase='won';
          buildWinScreen();
        });
        cutscenePlayer.play(endingScene);
        return;
      }
      gamePhase='cutscene';
      setTouchControlsEnabled(false);
      cutscenePlayer = new CutscenePlayer(()=>{
        currentLevel++;
        initLevel(currentLevel);
        gamePhase='playing';
        setTouchControlsEnabled(true);
        loop();
      });
      cutscenePlayer.play(L.afterCutscene || 'after_level1');
    }, 2500);
  }
  if (needsExtraction && bossDown && !reachedFinishGate && state.msgTimer < 30) {
    state.msgText = "Boss down! Move to the EXTRACT beacon on the far right.";
    state.msgTimer = 45;
  }
}

// ---- MAIN LOOP ----
function loop() {
  if (gamePhase !== 'playing') return;
  frame++;
  if (state.hitStopFrames > 0) state.hitStopFrames--;
  updatePlayer();
  if (state.hitStopFrames === 0) {
    updateShooting();
    updateBombs();
    updateGrenades();
    updateBullets();
    updateEnemyShots();
    updateExplosions();
    updateEnemies();
    updateBoss();
  }
  updateStageSystems();
  updateParticles();
  updateScreenShake();
  checkLevelComplete();

  ctx.clearRect(0,0,W,H);
  ctx.save();
  const cineSwayX = Math.sin(frame * 0.045) * 0.8;
  const cineSwayY = Math.cos(frame * 0.04) * 0.65;
  ctx.translate(screenShake.x + cineSwayX, screenShake.y + cineSwayY);
  drawWorld();
  state.gems.forEach(drawGem);
  state.powerups.forEach(drawPowerup);
  state.rescues.forEach(drawRescue);
  state.destructibles.forEach(drawDestructible);
  drawBonusTargets();
  state.prideFlags.forEach(drawPrideFlag);
  state.bullets.forEach(drawBullet);
  state.grenades.forEach(drawGrenade);
  state.enemyShots.forEach(drawEnemyShot);
  drawExplosions();
  state.enemies.forEach(drawEnemy);
  if (state.boss) drawBoss(state.boss);
  drawGreg(
    state.player.x-state.camX,
    state.player.y - Math.min(2, state.player.recoilPose * 0.35),
    state.player.facingVisual,
    state.player.invincible,
    state.player.gunRecoil,
    state.player.gunFlash
  );
  state.meleeEffects.forEach(m => {
    const x = m.x - state.camX;
    const alpha = m.life / m.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fff0b3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, m.y, 20 + (1 - alpha) * 16, m.dir < 0 ? Math.PI * 0.2 : Math.PI * 1.1, m.dir < 0 ? Math.PI * 1.1 : Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  });
  if (state.superMode.active) {
    const sx = state.player.x - state.camX;
    const sy = state.player.y + 8;
    ctx.fillStyle = 'rgba(255,170,245,0.28)';
    ctx.fillRect(sx - 26, sy - 20, 52, 40);
  }
  drawParticles();
  ctx.restore();
  if (state.cinematic && state.cinematic.whiteFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.cinematic.whiteFlash / 8})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.cinematic && state.cinematic.cardTimer > 0 && state.cinematic.cardText) {
    const alpha = Math.min(1, state.cinematic.cardTimer / 8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(W / 2 - 210, H / 2 - 24, 420, 48);
    ctx.strokeStyle = '#ff7888';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 210, H / 2 - 24, 420, 48);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.cinematic.cardText, W / 2, H / 2 + 7);
    ctx.globalAlpha = 1;
  }
  drawHUD();

  Object.keys(keys).forEach(k => { prevKeys[k] = keys[k]; });

  const delay = (state.cinematic && state.cinematic.slowmo > 0) ? 34 : 0;
  if (state.cinematic && state.cinematic.slowmo > 0) state.cinematic.slowmo--;
  if (delay > 0) setTimeout(() => requestAnimationFrame(loop), delay);
  else requestAnimationFrame(loop);
}

// ---- KICK OFF ----
initSpriteAssets();
buildStartScreen();
bindTouchControls();
