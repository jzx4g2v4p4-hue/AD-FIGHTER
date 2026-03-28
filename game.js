// ============================================================
//  GREG'S PRIDE QUEST — Main Game
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 640, H = 360;
canvas.width = W; canvas.height = H;

// ---- COLORS ----
const PRIDE_COLS = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];

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
    name:      "Face Yourself",
    bg:        ['#1a0000','#4d0000'],
    groundY:   300,
    worldW:    860,
    platforms: [[120,240,90],[280,200,90],[460,240,90]],
    gems:      [[145,220],[305,180],[485,220]],
    enemies:   [],
    bossX:     520,
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

// ---- INIT ----
function initLevel(li) {
  const L = LEVELS[li];
  state = {
    level: li,
    player: {
      x:60, y:260, vx:0, vy:0, onGround:false, facing:1, hp:3, maxHp:3, invincible:0,
      coyote: 0, gunRecoil: 0, gunFlash: 0
    },
    gems:     L.gems.map(g => ({ x:g[0], y:g[1], collected:false })),
    enemies:  L.enemies.map(e => ({
      x:e.x, y:e.y, dir:e.dir, vx:1.2*e.dir, alive:true, hp:2,
      minX: Math.max(24, e.x - 95), maxX: Math.min((L.worldW || 700) - 24, e.x + 95),
      fireTimer: 45 + Math.floor(Math.random()*80)
    })),
    boss:     L.bossX ? { x:L.bossX, y:220, hp:8, maxHp:8, dir:-1, alive:true, atkTimer:0 } : null,
    bullets:  [],
    enemyShots: [],
    explosions: [],
    particles: [],
    fireCooldown: 0,
    bombCooldown: 0,
    bombs: 6,
    msgTimer:  180,
    msgText:   L.msg,
    levelName: L.name,
    camX:      0,
    worldW:    L.worldW || 700,
    complete:  false,
    levelIntroTimer: 90
  };
}

// ---- START FLOW ----
function buildStartScreen() {
  const gc = document.getElementById('gameContainer');
  const s = document.createElement('div');
  s.id = 'startScreen';
  s.innerHTML = `
    <div class="pixel-title">GREG'S PRIDE QUEST</div>
    <div class="pixel-sub">a journey to self-acceptance</div>
    <div class="rainbow-bar">${PRIDE_COLS.map(c=>`<div style="background:${c}"></div>`).join('')}</div>
    <button class="start-btn" id="startBtn">PRESS START</button>
    <div class="controls">Arrow Keys / WASD — Move &amp; Jump &nbsp;|&nbsp; Space — Jump &nbsp;|&nbsp; J / K / X — Fire &nbsp;|&nbsp; L — Bomb<br>Metal-Slug energy: bullets, bombs, and full action across every mission</div>
  `;
  gc.appendChild(s);
  document.getElementById('startBtn').addEventListener('click', beginGame);
}

function buildWinScreen() {
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
  const ss = document.getElementById('startScreen');
  if (ss) ss.remove();
  currentLevel = 0;
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
function drawGreg(x, y, facing, invincible, gunRecoil = 0, gunFlash = 0) {
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;
  const bob = Math.abs(Math.sin(frame * 0.2)) * 1.4;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(facing, 1);
  // boots
  ctx.fillStyle='#3a1a00'; ctx.fillRect(-7,24,7,8); ctx.fillRect(2,24,7,8);
  // pants
  ctx.fillStyle='#1a1a5c'; ctx.fillRect(-7,14,14,12);
  // belt
  ctx.fillStyle='#8b4513'; ctx.fillRect(-7,12,14,4);
  ctx.fillStyle='#ffd700'; ctx.fillRect(-2,12,4,4);
  // shirt (pride colours cycle)
  ctx.fillStyle='#ff69b4'; ctx.fillRect(-8,2,16,12);
  // arms
  ctx.fillStyle='#c68642'; ctx.fillRect(-12,2,5,10); ctx.fillRect(8,2,5,10);
  // animated Glock-style sidearm + slide recoil
  const recoil = Math.min(4, gunRecoil);
  ctx.fillStyle='#101010'; ctx.fillRect(10-recoil,7,11,5);      // slide
  ctx.fillStyle='#2b2b2b'; ctx.fillRect(10,12,7,4);             // frame
  ctx.fillStyle='#111'; ctx.fillRect(12,14,3,4);                // grip
  ctx.fillStyle='#888'; ctx.fillRect(20-recoil,9,4,2);          // barrel
  if (gunFlash > 0) {
    ctx.fillStyle='rgba(255,240,120,0.95)'; ctx.fillRect(24,7,4,5);
    ctx.fillStyle='rgba(255,130,0,0.85)';   ctx.fillRect(28,8,3,3);
  }
  // head
  ctx.fillStyle='#c68642'; ctx.fillRect(-6,-10,13,14);
  // beard
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(-6,0,13,6); ctx.fillRect(-7,-2,3,6); ctx.fillRect(11,-2,3,6);
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
function drawEnemy(e) {
  if (!e.alive) return;
  const x = Math.round(e.x - state.camX), y = Math.round(e.y);
  ctx.save();
  ctx.fillStyle='#3d0066'; ctx.fillRect(x-10,y-18,20,20);
  ctx.fillStyle='#6600cc'; ctx.fillRect(x-8,y-20,16,8);
  ctx.fillStyle='#ff0000'; ctx.fillRect(x-5,y-18,4,4); ctx.fillRect(x+2,y-18,4,4);
  ctx.fillStyle='#220044'; ctx.fillRect(x-8,y-26,4,10); ctx.fillRect(x+4,y-26,4,10);
  ctx.fillStyle='rgba(200,100,255,0.7)';
  ctx.font='7px monospace'; ctx.textAlign='center';
  ctx.fillText('DOUBT', x, y-29);
  ctx.restore();
}

// ---- DRAW BOSS ----
function drawBoss(b) {
  if (!b.alive) return;
  const x = Math.round(b.x - state.camX), y = Math.round(b.y);
  const pulse = Math.sin(frame*0.1)*2;
  ctx.save();
  ctx.fillStyle='#1a0000'; ctx.fillRect(x-24,y-40+pulse,48,50);
  ctx.fillStyle='#660000'; ctx.fillRect(x-20,y-44+pulse,40,14);
  ctx.fillStyle='#aa0000'; ctx.fillRect(x-18,y-38+pulse,36,30);
  ctx.fillStyle='#ff4400'; ctx.fillRect(x-12,y-34+pulse,8,8); ctx.fillRect(x+4,y-34+pulse,8,8);
  ctx.fillStyle='#330000'; ctx.fillRect(x-10,y-20+pulse,20,5);
  ctx.fillRect(x-12,y-18+pulse,4,4); ctx.fillRect(x+8,y-18+pulse,4,4);
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
  ctx.fillStyle='#ffee66'; ctx.fillRect(x-3,y-1,6,2);
  ctx.fillStyle='#fff'; ctx.fillRect(x+2*b.dir,y-1,2,2);
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
    const x = Math.round(ex.x - state.camX), y = Math.round(ex.y);
    const r = Math.max(4, ex.radius * (ex.life / ex.maxLife));
    ctx.save();
    ctx.globalAlpha = ex.life / ex.maxLife;
    ctx.fillStyle='rgba(255,120,30,0.8)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,220,120,0.9)';
    ctx.beginPath(); ctx.arc(x, y, r*0.45, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

// ---- DRAW WORLD ----
function drawWorld() {
  const L = LEVELS[state.level];
  ctx.fillStyle=L.bg[0]; ctx.fillRect(0,0,W,H/2);
  ctx.fillStyle=L.bg[1]; ctx.fillRect(0,H/2,W,H/2);
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
  p.gunFlash = 3;
  spawnParticles(p.x+p.facing*16, p.y+10, ['#fff799','#ff8c00','#ffd700'], 5);
  spawnParticles(p.x+p.facing*8, p.y+8, ['#c2a35f','#f0d28a'], 2);
}

function updateShooting() {
  if ((keys['KeyJ']||keys['KeyK']||keys['KeyX']) && state.fireCooldown===0){
    fireShot();
    state.fireCooldown = 11;
  }
}

function spawnExplosion(x, y, radius = 56) {
  state.explosions.push({ x, y, radius, life: 18, maxLife: 18 });
  spawnParticles(x, y, ['#ffef99','#ff9433','#ff3300'], 26);
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
    ex.life--;
    const damageWindow = ex.life === ex.maxLife - 1;
    if (damageWindow) {
      state.enemies.forEach(e => {
        if (!e.alive) return;
        if (Math.hypot(e.x - ex.x, (e.y - 10) - ex.y) < ex.radius) {
          e.alive = false;
          spawnParticles(e.x, e.y, PRIDE_COLS, 18);
        }
      });
      if (state.boss && state.boss.alive && Math.hypot(state.boss.x - ex.x, state.boss.y - ex.y) < ex.radius + 16) {
        state.boss.hp = Math.max(0, state.boss.hp - 2);
        spawnParticles(state.boss.x, state.boss.y, ['#ffcc66','#ff3333','#fff'], 20);
        if (state.boss.hp <= 0) {
          state.boss.alive = false;
          spawnParticles(state.boss.x, state.boss.y, PRIDE_COLS, 30);
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
        spawnParticles(e.x, e.y-8, ['#ff66ff','#9966ff','#fff'], 8);
        if (e.hp<=0){
          e.alive=false;
          spawnParticles(e.x, e.y, PRIDE_COLS, 14);
        }
        hit = true;
      }
    });

    if (!hit && state.boss && state.boss.alive){
      const boss = state.boss;
      if (Math.abs(b.x-boss.x)<28 && Math.abs(b.y-(boss.y-12))<30){
        boss.hp--;
        spawnParticles(boss.x, boss.y-10, ['#ff6666','#ff2222','#fff'], 8);
        if (boss.hp<=0){
          boss.alive=false;
          spawnParticles(boss.x, boss.y, PRIDE_COLS, 30);
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
      e.fireTimer = 72 + Math.floor(Math.random()*60);
    }
  });

  if (state.boss && state.boss.alive && state.boss.atkTimer % 35 === 0) {
    const dx = p.x - state.boss.x;
    const dy = (p.y + 8) - (state.boss.y - 10);
    const len = Math.max(1, Math.hypot(dx, dy));
    state.enemyShots.push({ x:state.boss.x, y:state.boss.y-8, vx:(dx/len)*4.2, vy:(dy/len)*4.2, life:130 });
  }

  state.enemyShots = state.enemyShots.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    if (s.life <= 0 || s.x < 0 || s.x > state.worldW || s.y < -20 || s.y > H + 20) return false;

    if (p.invincible===0 && Math.abs(p.x-s.x)<12 && Math.abs((p.y+14)-s.y)<18){
      p.hp=Math.max(0,p.hp-1);
      p.invincible=75;
      p.vy=-4;
      spawnParticles(p.x, p.y, ['#ff2200','#ff8800','#fff'], 8);
      return false;
    }
    return true;
  });
}

function updateEnemies() {
  const p = state.player;
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    e.x+=e.vx;
    if (e.x<e.minX||e.x>e.maxX) e.vx*=-1;
    // enemy hits player
    if (p.invincible===0 && Math.abs(p.x-e.x)<20 && Math.abs(p.y+16-e.y)<20){
      p.hp=Math.max(0,p.hp-1); p.invincible=80; p.vy=-5;
      spawnParticles(p.x, p.y, ['#ff0000','#ff6600'], 6);
    }
    // player stomps
    if (p.vy>0 && p.y+32>e.y-10 && p.y+32<e.y+10 && Math.abs(p.x-e.x)<22){
      e.hp--; p.vy=-6;
      if (e.hp<=0){ e.alive=false; spawnParticles(e.x, e.y, PRIDE_COLS, 14); }
    }
  });
}

function updateBoss() {
  if (!state.boss||!state.boss.alive) return;
  const b=state.boss, p=state.player;
  b.atkTimer++;
  b.x += b.atkTimer%90<45 ? b.dir*1.2 : -b.dir*1.2;
  if (b.x>state.worldW-60) b.dir=-1;
  if (b.x<W/2) b.dir=1;
  // hits player
  if (p.invincible===0 && Math.abs(p.x-b.x)<36 && Math.abs((p.y+16)-(b.y+20))<36){
    p.hp=Math.max(0,p.hp-1); p.invincible=80; p.vy=-6;
    spawnParticles(p.x, p.y, ['#ff0000','#aa0000'], 6);
  }
  // player stomps boss
  if (p.vy>0 && p.y+32>b.y-4 && p.y+32<b.y+10 && Math.abs(p.x-b.x)<36){
    b.hp--; p.vy=-8;
    spawnParticles(b.x, b.y, PRIDE_COLS, 10);
    if (b.hp<=0){ b.alive=false; spawnParticles(b.x, b.y, PRIDE_COLS, 30); }
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
  checkLevelComplete();

  ctx.clearRect(0,0,W,H);
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
  drawHUD();

  Object.keys(keys).forEach(k => { prevKeys[k] = keys[k]; });

  requestAnimationFrame(loop);
}

// ---- KICK OFF ----
buildStartScreen();
