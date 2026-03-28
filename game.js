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
    frameWidth: 48,
    frameHeight: 48,
    originX: 24,
    originY: 42,
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
    -cfg.originX, -cfg.originY, fw, fh
  );
  ctx.restore();
  return true;
}

function addScreenShake(power = 2, time = 6) {
  screenShake.power = Math.max(screenShake.power, power);
  screenShake.time = Math.max(screenShake.time, time);
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
    bg:        ['#1a0533','#3d0f6b'],
    groundY:   300,
    worldW:    760,
    platforms: [[150,260,100],[320,230,100],[480,200,100]],
    gems:      [[180,240],[350,210],[510,180]],
    enemies:   [{x:250,y:288,dir:1},{x:610,y:288,dir:-1}],
    bossX:     null,
    msg:       "Collect all gems and blast the Doubt Demons!",
    afterCutscene: 'after_level1'
  },
  {
    name:      "Neon Block",
    bg:        ['#0a1a4d','#1a3a8f'],
    groundY:   300,
    worldW:    900,
    platforms: [[100,250,80],[240,210,80],[400,170,100],[540,210,80],[700,180,90]],
    gems:      [[120,230],[265,190],[430,150],[565,190],[725,160]],
    enemies:   [{x:160,y:288,dir:1},{x:340,y:288,dir:-1},{x:650,y:288,dir:1}],
    bossX:     null,
    msg:       "Push forward. Keep firing. Doubts don't get the last word.",
    afterCutscene: 'after_level2'
  },
  {
    name:      "Open Streets",
    bg:        ['#001a14','#00573f'],
    groundY:   300,
    worldW:    980,
    platforms: [[120,250,90],[260,220,100],[430,190,110],[620,230,100],[800,200,100]],
    gems:      [[145,230],[290,200],[460,170],[645,210],[830,180]],
    enemies:   [{x:200,y:288,dir:1},{x:390,y:288,dir:-1},{x:560,y:288,dir:1},{x:840,y:288,dir:-1}],
    bossX:     null,
    msg:       "Run-and-gun through the noise. You're getting stronger.",
    afterCutscene: 'after_level3'
  },
  {
    name:      "Parade Route",
    bg:        ['#14143a','#3f1f6b'],
    groundY:   300,
    worldW:    1040,
    platforms: [[120,245,100],[290,205,95],[450,170,90],[620,215,110],[810,180,90],[940,220,70]],
    gems:      [[150,225],[320,185],[475,150],[655,195],[835,160],[960,200]],
    enemies:   [{x:210,y:288,dir:1},{x:370,y:288,dir:-1},{x:540,y:288,dir:1},{x:700,y:288,dir:-1},{x:910,y:288,dir:1}],
    bossX:     null,
    msg:       "Friends are near. Clear the path and keep your courage loud.",
    afterCutscene: 'after_level4'
  },
  {
    name:      "Iron Rain District",
    bg:        ['#0f0f1f','#342c54'],
    groundY:   300,
    worldW:    1180,
    platforms: [[110,245,110],[300,200,100],[460,165,110],[640,220,95],[820,185,110],[980,225,100]],
    gems:      [[140,225],[330,180],[490,145],[670,200],[850,165],[1010,205]],
    enemies:   [{x:180,y:288,dir:1},{x:360,y:288,dir:-1},{x:520,y:288,dir:1},{x:730,y:288,dir:-1},{x:920,y:288,dir:1},{x:1080,y:288,dir:-1}],
    bossX:     null,
    msg:       "Heavy resistance. Keep rolling, firing, and breaking through.",
    afterCutscene: 'after_level4'
  },
  {
    name:      "Steel Sky Highway",
    bg:        ['#071f29','#12576d'],
    groundY:   300,
    worldW:    1260,
    platforms: [[140,248,95],[310,215,100],[490,180,95],[660,145,100],[820,210,95],[980,178,100],[1130,225,85]],
    gems:      [[170,228],[340,195],[520,160],[690,125],[850,190],[1010,158],[1155,205]],
    enemies:   [{x:220,y:288,dir:1},{x:410,y:288,dir:-1},{x:590,y:288,dir:1},{x:760,y:288,dir:-1},{x:930,y:288,dir:1},{x:1110,y:288,dir:-1}],
    bossX:     null,
    msg:       "Final gauntlet. This is full run-and-gun chaos.",
    afterCutscene: 'after_level4'
  },
  {
    name:      "Face Yourself",
    bg:        ['#1a0000','#4d0000'],
    groundY:   300,
    worldW:    980,
    platforms: [[120,240,100],[290,198,95],[470,240,95],[640,205,95]],
    gems:      [[145,220],[315,178],[495,220],[665,185]],
    enemies:   [],
    bossX:     700,
    msg:       "Defeat the Shame Boss — shoot your doubts away!",
    afterCutscene: 'victory'
  }
];

// ---- KEYS ----
const keys = {};
const prevKeys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowLeft','ArrowRight','ArrowDown','KeyJ','KeyK','KeyX','KeyL'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ---- STATE ----
let state = null;
let currentLevel = 0;
let frame = 0;
let gamePhase = 'start'; // 'start' | 'cutscene' | 'playing' | 'won'
let cutscenePlayer = null;
let campaignScore = 0;
const touchPointerMap = new Map();

// ---- INIT ----
function initLevel(li) {
  const L = LEVELS[li];
  screenShake.time = 0;
  screenShake.power = 0;
  screenShake.x = 0;
  screenShake.y = 0;
  state = {
    level: li,
    player: {
      x:60, y:260, vx:0, vy:0, onGround:false, facing:1, hp:3, maxHp:3, invincible:0,
      coyote: 0, gunRecoil: 0, gunFlash: 0, runFrame: 0,
      anim: createAnimState('idle'),
      hurtTimer: 0,
      shootTimer: 0,
      deadTimer: 0
    },
    gems:     L.gems.map(g => ({ x:g[0], y:g[1], collected:false })),
    enemies:  L.enemies.map(e => ({
      x:e.x, y:e.y, dir:e.dir, vx:1.2*e.dir, alive:true, hp:2,
      minX: Math.max(24, e.x - 95), maxX: Math.min((L.worldW || 700) - 24, e.x + 95),
      fireTimer: 45 + Math.floor(Math.random()*80),
      anim: createAnimState('run'),
      hurtTimer: 0,
      shootTimer: 0,
      deadTimer: 0
    })),
    boss:     L.bossX ? {
      x:L.bossX, y:220, hp:8, maxHp:8, dir:-1, alive:true, atkTimer:0,
      anim: createAnimState('idle'),
      hurtTimer: 0,
      deadTimer: 0
    } : null,
    bullets:  [],
    enemyShots: [],
    explosions: [],
    particles: [],
    fireCooldown: 0,
    bombCooldown: 0,
    bombs: 6,
    score: campaignScore,
    combo: 0,
    comboTimer: 0,
    msgTimer:  180,
    msgText:   L.msg,
    levelName: L.name,
    camX:      0,
    worldW:    L.worldW || 700,
    complete:  false,
    levelIntroTimer: 90
  };
}

function awardScore(points, comboable = true) {
  campaignScore += points;
  state.score = campaignScore;
  if (comboable) {
    state.combo = Math.min(9, state.combo + 1);
    state.comboTimer = 120;
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
    <div class="controls">Keyboard: Arrow Keys / WASD Move, Space Jump, J / K / X Fire, L Bomb<br>iPhone, iPad, and Samsung/Android: on-screen buttons + full-screen layout</div>
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
    <div class="win-sub">Proud. Loud. 100% Himself.</div>
    <div class="rainbow-bar">${PRIDE_COLS.map(c=>`<div style="background:${c}"></div>`).join('')}</div>
    <div class="win-text">
      Greg collected all the rainbow gems, defeated every Doubt Demon,<br>
      and crushed the Shame Boss into glitter.<br><br>
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
  setTouchControlsEnabled(true);
  const ss = document.getElementById('startScreen');
  if (ss) ss.remove();
  currentLevel = 0;
  campaignScore = 0;
  // Play intro cutscene first
  gamePhase = 'cutscene';
  cutscenePlayer = new CutscenePlayer(() => {
    initLevel(0);
    gamePhase = 'playing';
    loop();
  });
  cutscenePlayer.play('intro');
}

// ---- DRAW GREG ----
function drawGregFallback(x, y, facing, invincible, gunRecoil = 0, gunFlash = 0) {
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;
  const bob = Math.abs(Math.sin(frame * 0.2)) * 1.4;
  const stride = Math.sin(frame * 0.38) * 2.9;
  const shoulderLift = Math.sin(frame * 0.5) * 1.5;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(facing, 1);
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
  // animated Glock-style sidearm + slide recoil
  const recoil = Math.min(4, gunRecoil);
  ctx.fillStyle='#101010'; ctx.fillRect(10-recoil,7-shoulderLift*0.35,11,5);      // slide
  ctx.fillStyle='#2b2b2b'; ctx.fillRect(10,12,7,4);             // frame
  ctx.fillStyle='#111'; ctx.fillRect(12,14,3,4);                // grip
  ctx.fillStyle='#888'; ctx.fillRect(20-recoil,9-shoulderLift*0.35,5,2);          // barrel
  ctx.fillStyle='rgba(180,200,255,0.25)'; ctx.fillRect(12,8,5,1);
  if (gunFlash > 0) {
    const flashGrow = 6 - gunFlash;
    ctx.fillStyle='rgba(255,240,120,0.95)'; ctx.fillRect(24,6,5+flashGrow,6);
    ctx.fillStyle='rgba(255,170,0,0.88)';   ctx.fillRect(28+flashGrow,7,4,4);
    ctx.fillStyle='rgba(255,90,0,0.7)';     ctx.fillRect(31+flashGrow,8,3,2);
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
  ctx.fillStyle='#180000'; ctx.fillRect(x-26,y-42+pulse,52,54);
  ctx.fillStyle='#4b0000'; ctx.fillRect(x-21,y-46+pulse,42,15);
  ctx.fillStyle='#8c0000'; ctx.fillRect(x-19,y-40+pulse,38,33);
  ctx.fillStyle='#cf3535'; ctx.fillRect(x-12,y-35+pulse,24,4);
  ctx.fillStyle='#ff4400'; ctx.fillRect(x-12,y-34+pulse,8,8); ctx.fillRect(x+4,y-34+pulse,8,8);
  ctx.fillStyle='#fff0c0'; ctx.fillRect(x-9,y-32+pulse,2,2); ctx.fillRect(x+7,y-32+pulse,2,2);
  ctx.fillStyle='#330000'; ctx.fillRect(x-12,y-20+pulse+jaw,24,6);
  ctx.fillRect(x-13,y-18+pulse+jaw,5,5); ctx.fillRect(x+8,y-18+pulse+jaw,5,5);
  ctx.fillStyle='rgba(255,100,100,0.18)'; ctx.fillRect(x-22,y-30+pulse,44,7);
  ctx.fillStyle='#ff6666';
  ctx.font='bold 9px monospace'; ctx.textAlign='center';
  ctx.fillText('SHAME BOSS', x, y-50+pulse);
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
}

function drawBoss(b) {
  if (!b.alive && b.deadTimer <= 0) return;
  const next = getBossAnimState(b);
  setAnimState(b.anim, next);
  stepAnim(b.anim, SPRITES.boss);
  const alpha = !b.alive ? Math.max(0, b.deadTimer / 30) : 1;
  const drawn = drawSpriteFrame('boss', b.anim, b.x, b.y + 30, b.dir >= 0 ? 1 : -1, alpha);
  if (!drawn) drawBossFallback(b, alpha);
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

function drawBullet(b) {
  const x = Math.round(b.x - state.camX), y = Math.round(b.y);
  ctx.save();
  ctx.fillStyle='rgba(255,180,0,0.35)';
  ctx.fillRect(x-8*b.dir,y-2,7,4);
  ctx.fillStyle='#ffee66'; ctx.fillRect(x-3,y-1,7,3);
  ctx.fillStyle='#fff'; ctx.fillRect(x+3*b.dir,y-1,2,2);
  ctx.restore();
}

function drawEnemyShot(s) {
  const x = Math.round(s.x - state.camX), y = Math.round(s.y);
  ctx.save();
  ctx.fillStyle='#ff5522'; ctx.fillRect(x-2,y-2,4,4);
  ctx.fillStyle='#ffd27a'; ctx.fillRect(x-1,y-1,2,2);
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
  // metal-slug style parallax jungle + ruins
  for (let i=0;i<6;i++) {
    const tx = ((i*150) - (state.camX*0.25)%900);
    ctx.fillStyle='rgba(12,40,20,0.35)';
    ctx.fillRect(tx, 110, 34, 120);
    ctx.fillRect(tx+7, 86, 20, 30);
    ctx.fillStyle='rgba(20,60,25,0.25)';
    ctx.fillRect(tx-12, 98, 62, 15);
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
  // ground
  ctx.fillStyle='#2d1b00'; ctx.fillRect(0-state.camX%state.worldW,L.groundY,state.worldW+W,H);
  ctx.fillStyle='#1a5c1a'; ctx.fillRect(0-state.camX%state.worldW,L.groundY,state.worldW+W,8);
  for (let i=0;i<6;i++){ctx.fillStyle=PRIDE_COLS[i]; ctx.fillRect(0-state.camX%state.worldW,L.groundY+8+i*2,state.worldW+W,2);}
  // platforms
  L.platforms.forEach(([px,py,pw])=>{
    const sx = px - state.camX;
    ctx.fillStyle='#3a2200'; ctx.fillRect(sx,py,pw,16);
    ctx.fillStyle='#5a3300'; ctx.fillRect(sx,py,pw,6);
    for(let i=0;i<6;i++){ctx.fillStyle=PRIDE_COLS[i]; ctx.fillRect(sx,py+8+i,pw,1);}
  });
}

// ---- PARTICLES ----
function spawnParticles(x, y, colors, n=8) {
  for (let i=0;i<n;i++){
    state.particles.push({
      x: x-state.camX, y,
      vx: (Math.random()-0.5)*4,
      vy: -Math.random()*4-1,
      life: 40,
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
      color: ['#d7b97a', '#f4d77f', '#b38b42'][Math.floor(Math.random() * 3)]
    });
  }
}

function updateParticles() {
  state.particles = state.particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
    return p.life>0;
  });
}

function drawParticles() {
  state.particles.forEach(p=>{
    ctx.globalAlpha=p.life/40;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-2,p.y-2,4,4);
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
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,28);
  ctx.fillStyle='#ff69b4'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
  ctx.fillText('LEVEL '+(state.level+1)+': '+state.levelName, 10, 18);
  ctx.fillStyle='#ffe38a';
  ctx.font='bold 12px monospace';
  ctx.textAlign='right';
  ctx.fillText(`SCORE ${String(state.score).padStart(6, '0')}`, W - 10, 42);
  ctx.fillStyle='#9cf6ff';
  ctx.textAlign='center';
  ctx.fillText('ARMS • HANDGUN', W/2, 18);
  // hearts
  for (let i=0;i<state.player.maxHp;i++){
    ctx.fillStyle = i < state.player.hp ? '#ff1493' : '#444';
    ctx.font='16px monospace'; ctx.textAlign='right';
    ctx.fillText('♥', W-10-i*22, 18);
  }
  // gems
  const collected = state.gems.filter(g=>g.collected).length;
  ctx.fillStyle='#ffd700'; ctx.font='12px monospace'; ctx.textAlign='left';
  ctx.fillText('★ '+collected+'/'+state.gems.length, 10, 42);
  ctx.fillStyle='#ffb347'; ctx.fillText('BOMBS '+state.bombs, 86, 42);
  if (state.combo > 1 && state.comboTimer > 0) {
    ctx.fillStyle='#ff9f33';
    ctx.font='bold 12px monospace';
    ctx.textAlign='center';
    ctx.fillText(`RUSH x${state.combo}`, W/2, 42);
  }
  if (Math.floor(frame / 30) % 2 === 0) {
    ctx.fillStyle='rgba(255,255,255,0.82)';
    ctx.font='10px monospace';
    ctx.textAlign='right';
    ctx.fillText('INSERT COIN', W - 10, H - 10);
  }
  // message
  if (state.msgTimer > 0){
    const alpha = Math.min(1, state.msgTimer/30);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(W/2-200,H-52,400,36);
    ctx.fillStyle='#adf'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText(state.msgText, W/2, H-30);
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
}

// ---- PHYSICS ----
function updatePlayer() {
  const p = state.player;
  const L = LEVELS[state.level];
  const maxSpeed = 4.2;
  const accel = 0.58;
  const airAccel = 0.33;
  const friction = 0.8;
  const grav = 0.42;
  const jumpPow = -9.2;
  const movingLeft = keys['ArrowLeft'] || keys['KeyA'];
  const movingRight = keys['ArrowRight'] || keys['KeyD'];
  const jumpHeld = keys['Space'] || keys['ArrowUp'] || keys['KeyW'];
  const jumpTap = justPressed('Space') || justPressed('ArrowUp') || justPressed('KeyW');
  const jumpRelease = justReleased('Space') || justReleased('ArrowUp') || justReleased('KeyW');

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

  if (p.onGround) p.coyote = 7;
  else p.coyote = Math.max(0, p.coyote - 1);

  if (jumpTap && (p.onGround || p.coyote > 0)) {
    p.vy = jumpPow;
    p.onGround = false;
    p.coyote = 0;
  }

  if (jumpRelease && p.vy < -3 && !jumpHeld) p.vy *= 0.62;

  p.vy += grav;
  p.x += p.vx;
  p.y += p.vy;

  // ground
  if (p.y+32>=L.groundY){ p.y=L.groundY-32; p.vy=0; p.onGround=true; }
  else p.onGround=false;

  // platforms
  L.platforms.forEach(([px,py,pw])=>{
    if (p.x+8>px && p.x-8<px+pw && p.y+32>py && p.y+32<py+20 && p.vy>=0){
      p.y=py-32; p.vy=0; p.onGround=true;
    }
  });

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

  // camera
  state.camX = Math.max(0, Math.min(state.worldW-W, p.x-W*0.4));

  // gem collect
  state.gems.forEach(g=>{
    if (!g.collected && Math.abs(p.x-g.x)<18 && Math.abs(p.y+16-g.y)<18){
      g.collected=true;
      spawnParticles(g.x, g.y, PRIDE_COLS, 12);
      awardScore(100, false);
    }
  });

  if (p.hp<=0) initLevel(state.level);
}

function fireShot() {
  const p = state.player;
  state.bullets.push({
    x: p.x + p.facing*15,
    y: p.y + 10,
    vx: p.facing*7,
    dir: p.facing,
    life: 70
  });
  p.gunRecoil = 6;
  p.gunFlash = 4;
  p.shootTimer = 8;
  spawnParticles(p.x+p.facing*16, p.y+10, ['#fff799','#ff8c00','#ffd700'], 5);
  spawnParticles(p.x+p.facing*8, p.y+8, ['#c2a35f','#f0d28a'], 2);
  spawnSparkBurst(p.x + p.facing*16, p.y + 10, p.facing, 7);
  spawnShellCasings(p.x + p.facing * 8, p.y + 8, p.facing, 2);
  addScreenShake(1.4, 4);
}

function updateShooting() {
  if ((keys['KeyJ']||keys['KeyK']||keys['KeyX']) && state.fireCooldown===0){
    fireShot();
    const moving = Math.abs(state.player.vx) > 1.7;
    state.fireCooldown = moving ? 7 : 9;
  }
}

function spawnExplosion(x, y, radius = 56) {
  state.explosions.push({ x, y, radius, life: 18, maxLife: 18, anim: createAnimState('boom') });
  spawnParticles(x, y, ['#ffef99','#ff9433','#ff3300'], 26);
  addScreenShake(radius > 70 ? 5.5 : 4, 10);
}

function updateBombs() {
  if (state.bombCooldown > 0) state.bombCooldown--;
  if (justPressed('KeyL') && state.bombs > 0 && state.bombCooldown === 0) {
    const p = state.player;
    state.bombs--;
    state.bombCooldown = 24;
    spawnExplosion(p.x + p.facing * 68, p.y + 10, 76);
  }
}

function updateExplosions() {
  state.explosions = state.explosions.filter(ex => {
    stepAnim(ex.anim, SPRITES.explosion);
    ex.life--;
    const damageWindow = ex.life === ex.maxLife - 1;
    if (damageWindow) {
      state.enemies.forEach(e => {
        if (!e.alive) return;
        if (Math.hypot(e.x - ex.x, (e.y - 10) - ex.y) < ex.radius) {
          e.alive = false;
          e.deadTimer = 20;
          e.vx = 0;
          awardScore(250);
          spawnParticles(e.x, e.y, PRIDE_COLS, 18);
          spawnSparkBurst(e.x, e.y - 8, (Math.random() > 0.5 ? 1 : -1), 8);
          addScreenShake(2.4, 6);
        }
      });
      if (state.boss && state.boss.alive && Math.hypot(state.boss.x - ex.x, state.boss.y - ex.y) < ex.radius + 16) {
        state.boss.hp = Math.max(0, state.boss.hp - 2);
        state.boss.hurtTimer = 12;
        spawnParticles(state.boss.x, state.boss.y, ['#ffcc66','#ff3333','#fff'], 20);
        addScreenShake(2.8, 7);
        if (state.boss.hp <= 0) {
          state.boss.alive = false;
          state.boss.deadTimer = 30;
          awardScore(2000, false);
          spawnParticles(state.boss.x, state.boss.y, PRIDE_COLS, 30);
          addScreenShake(7, 18);
        }
      }
    }
    return ex.life > 0;
  });
}

function updateBullets() {
  state.bullets = state.bullets.filter(b=>{
    b.x+=b.vx;
    b.life--;
    if (b.life<=0 || b.x<0 || b.x>state.worldW) return false;
    let hit = false;

    state.enemies.forEach(e=>{
      if (!e.alive || hit) return;
      if (Math.abs(b.x-e.x)<16 && Math.abs(b.y-(e.y-8))<16){
        e.hp--;
        e.hurtTimer = 10;
        e.x += b.dir * 1.6;
        spawnParticles(e.x, e.y-8, ['#ff66ff','#9966ff','#fff'], 8);
        spawnSparkBurst(e.x, e.y - 8, b.dir, 4);
        addScreenShake(1.1, 3);
        if (e.hp<=0){
          e.alive=false;
          e.deadTimer=20;
          e.vx = 0;
          awardScore(200);
          spawnParticles(e.x, e.y, PRIDE_COLS, 14);
          addScreenShake(2.2, 6);
        }
        hit = true;
      }
    });

    if (!hit && state.boss && state.boss.alive){
      const boss = state.boss;
      if (Math.abs(b.x-boss.x)<28 && Math.abs(b.y-(boss.y-12))<30){
        boss.hp--;
        awardScore(150, false);
        boss.hurtTimer = 12;
        spawnParticles(boss.x, boss.y-10, ['#ff6666','#ff2222','#fff'], 8);
        spawnSparkBurst(boss.x - 12, boss.y - 12, b.dir, 6);
        addScreenShake(1.6, 4);
        if (boss.hp<=0){
          boss.alive=false;
          boss.deadTimer = 30;
          awardScore(2000, false);
          spawnParticles(boss.x, boss.y, PRIDE_COLS, 30);
          addScreenShake(7, 18);
        }
        hit = true;
      }
    }

    return !hit;
  });
}

function updateEnemyShots() {
  const p = state.player;

  state.enemies.forEach(e => {
    if (!e.alive) return;
    e.fireTimer--;
    if (e.fireTimer <= 0) {
      const dx = p.x - e.x;
      const dy = (p.y + 8) - (e.y - 8);
      const len = Math.max(1, Math.hypot(dx, dy));
      state.enemyShots.push({ x:e.x, y:e.y-8, vx:(dx/len)*3.2, vy:(dy/len)*3.2, life:140 });
      e.shootTimer = 10;
      e.fireTimer = 56 + Math.floor(Math.random()*45);
    }
  });

  if (state.boss && state.boss.alive && state.boss.atkTimer % 24 === 0) {
    const dx = p.x - state.boss.x;
    const dy = (p.y + 8) - (state.boss.y - 10);
    const len = Math.max(1, Math.hypot(dx, dy));
    state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*4.2, vy:(dy/len)*4.2, life:130 });
    if (state.boss.atkTimer % 48 === 0) {
      state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*3.4 - 1.2, vy:(dy/len)*3.4, life:130 });
      state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*3.4 + 1.2, vy:(dy/len)*3.4, life:130 });
    }
  }

  state.enemyShots = state.enemyShots.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    if (s.life <= 0 || s.x < 0 || s.x > state.worldW || s.y < -20 || s.y > H + 20) return false;

    if (p.invincible===0 && Math.abs(p.x-s.x)<12 && Math.abs((p.y+14)-s.y)<18){
      p.hp=Math.max(0,p.hp-1);
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
      e.deadTimer = Math.max(0, e.deadTimer - 1);
      return;
    }
    e.hurtTimer = Math.max(0, e.hurtTimer - 1);
    e.shootTimer = Math.max(0, e.shootTimer - 1);
    e.x+=e.vx;
    if (e.x<e.minX||e.x>e.maxX) e.vx*=-1;
    // enemy hits player
    if (p.invincible===0 && Math.abs(p.x-e.x)<20 && Math.abs(p.y+16-e.y)<20){
      p.hp=Math.max(0,p.hp-1); p.invincible=80; p.hurtTimer=22; p.vy=-5;
      spawnParticles(p.x, p.y, ['#ff0000','#ff6600'], 6);
      addScreenShake(2.4, 6);
    }
    // player stomps
    if (p.vy>0 && p.y+32>e.y-10 && p.y+32<e.y+10 && Math.abs(p.x-e.x)<22){
      e.hp--; p.vy=-6;
      if (e.hp<=0){ e.alive=false; e.deadTimer=20; awardScore(220); spawnParticles(e.x, e.y, PRIDE_COLS, 14); }
      else e.hurtTimer = 10;
    }
  });
}

function updateBoss() {
  if (!state.boss) return;
  const b=state.boss, p=state.player;
  b.hurtTimer = Math.max(0, b.hurtTimer - 1);
  if (!b.alive) {
    b.deadTimer = Math.max(0, b.deadTimer - 1);
    return;
  }
  b.atkTimer++;
  b.x += b.atkTimer%90<45 ? b.dir*1.2 : -b.dir*1.2;
  if (b.x>state.worldW-60) b.dir=-1;
  if (b.x<W/2) b.dir=1;
  // hits player
  if (p.invincible===0 && Math.abs(p.x-b.x)<36 && Math.abs((p.y+16)-(b.y+20))<36){
    p.hp=Math.max(0,p.hp-1); p.invincible=80; p.hurtTimer=24; p.vy=-6;
    spawnParticles(p.x, p.y, ['#ff0000','#aa0000'], 6);
    addScreenShake(3.2, 7);
  }
  // player stomps boss
  if (p.vy>0 && p.y+32>b.y-4 && p.y+32<b.y+10 && Math.abs(p.x-b.x)<36){
    b.hp--; p.vy=-8;
    awardScore(180, false);
    spawnParticles(b.x, b.y, PRIDE_COLS, 10);
    if (b.hp<=0){ b.alive=false; b.deadTimer=30; awardScore(2000, false); spawnParticles(b.x, b.y, PRIDE_COLS, 30); }
    else b.hurtTimer = 12;
  }
}

function checkLevelComplete() {
  if (state.complete) return;
  const allGems    = state.gems.every(g=>g.collected);
  const allEnemies = state.enemies.every(e=>!e.alive);
  const bossDown   = !state.boss||!state.boss.alive;
  if (allGems && allEnemies && bossDown){
    state.complete = true;
    const L = LEVELS[state.level];
    const msg = currentLevel===LEVELS.length-1 ? "SHAME DEFEATED! Greg is FREE!" :
                currentLevel===0 ? "First wall broken. Keep moving forward!" :
                currentLevel===LEVELS.length-2 ? "One final push. Face yourself." :
                "Sector clear. Keep running toward your truth.";
    state.msgText=msg; state.msgTimer=180;

    setTimeout(()=>{
      gamePhase='cutscene';
      cutscenePlayer = new CutscenePlayer(()=>{
        if (currentLevel < LEVELS.length-1){
          currentLevel++;
          initLevel(currentLevel);
          gamePhase='playing';
          loop();
        } else {
          gamePhase='won';
          buildWinScreen();
        }
      });
      cutscenePlayer.play(L.afterCutscene);
    }, 2500);
  }
}

// ---- MAIN LOOP ----
function loop() {
  if (gamePhase !== 'playing') return;
  frame++;
  updatePlayer();
  updateShooting();
  updateBombs();
  updateBullets();
  updateEnemyShots();
  updateExplosions();
  updateEnemies();
  updateBoss();
  updateParticles();
  updateScreenShake();
  checkLevelComplete();

  ctx.clearRect(0,0,W,H);
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  drawWorld();
  state.gems.forEach(drawGem);
  state.bullets.forEach(drawBullet);
  state.enemyShots.forEach(drawEnemyShot);
  drawExplosions();
  state.enemies.forEach(drawEnemy);
  if (state.boss) drawBoss(state.boss);
  drawGreg(
    state.player.x-state.camX,
    state.player.y,
    state.player.facing,
    state.player.invincible,
    state.player.gunRecoil,
    state.player.gunFlash
  );
  drawParticles();
  ctx.restore();
  drawHUD();

  Object.keys(keys).forEach(k => { prevKeys[k] = keys[k]; });

  requestAnimationFrame(loop);
}

// ---- KICK OFF ----
initSpriteAssets();
buildStartScreen();
bindTouchControls();
