// ============================================================
//  GREG'S PRIDE QUEST — Cutscene Engine
// ============================================================

const PRIDE = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];

// ---- Pixel art scene painter ----
function paintScene(canvas, sceneId, frame) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // Subtle camera drift for more cinematic cutscene motion.
  const driftX = Math.sin(frame * 0.025) * 2.4;
  const driftY = Math.cos(frame * 0.02) * 1.6;
  const punch = (sceneId === 'boss_intro' && frame % 150 > 120) ? 1.08 : 1;
  ctx.save();
  ctx.translate(driftX, driftY);
  ctx.scale(punch, punch);
  drawSceneAtmosphere(ctx, W, H, frame, sceneId);

  switch (sceneId) {
    case 'intro_bedroom':   drawBedroom(ctx, W, H, frame);   break;
    case 'intro_mirror':    drawMirror(ctx, W, H, frame);    break;
    case 'intro_door':      drawDoor(ctx, W, H, frame);      break;
    case 'level1_trans':    drawCityDawn(ctx, W, H, frame);  break;
    case 'pov_mark':        drawPovMark(ctx, W, H, frame);   break;
    case 'pov_charly':      drawPovCharly(ctx, W, H, frame); break;
    case 'level2_trans':    drawCrowdScene(ctx, W, H, frame);break;
    case 'pov_jairo':       drawPovJairo(ctx, W, H, frame);  break;
    case 'pov_chris':       drawPovChris(ctx, W, H, frame);  break;
    case 'night_tender':    drawNightTender(ctx, W, H, frame); break;
    case 'raid_abduction':  drawRaidAbduction(ctx, W, H, frame); break;
    case 'dungeon_cell':    drawDungeonCell(ctx, W, H, frame); break;
    case 'rescue_vow':      drawRescueVow(ctx, W, H, frame); break;
    case 'boss_intro':      drawBossIntro(ctx, W, H, frame); break;
    case 'hero_closeup_greg': drawHeroCloseup(ctx, W, H, frame, 'Greg'); break;
    case 'hero_closeup_jairo': drawHeroCloseup(ctx, W, H, frame, 'Jairo'); break;
    case 'hero_closeup_chris': drawHeroCloseup(ctx, W, H, frame, 'Chris'); break;
    case 'bonus_celebration': drawBonusCelebration(ctx, W, H, frame); break;
    case 'victory':         drawVictory(ctx, W, H, frame);   break;
    case 'victory_snowball':drawVictorySnowball(ctx, W, H, frame); break;
    default:                drawDefault(ctx, W, H, frame);   break;
  }
  ctx.restore();
  drawCinematicFX(ctx, W, H, frame, sceneId);
}

function drawSceneAtmosphere(ctx, W, H, frame, sceneId) {
  const haze = sceneId === 'boss_intro' ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 16; i++) {
    const x = ((i * 44) + frame * (0.25 + (i % 3) * 0.15)) % (W + 20) - 10;
    const y = (i * 17 + Math.sin(frame * 0.02 + i) * 10 + 24) % H;
    ctx.fillStyle = haze;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawCinematicFX(ctx, W, H, f, sceneId) {
  // soft scanlines + vignette for smoother perceived animation in cutscenes
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = (f % 3); y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H));
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  // Stronger transition pulse for arcade-style scene energy.
  const flash = Math.max(0, 1 - (f / 24));
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  // letterbox + subtle speed lines for arcade cinema
  const lb = sceneId === 'boss_intro' ? 20 : 12;
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, W, lb);
  ctx.fillRect(0, H - lb, W, lb);
  for (let i = 0; i < 14; i++) {
    const sx = ((i * 52) - (f * 5.5)) % (W + 60) - 30;
    ctx.fillStyle = `rgba(255,255,255,${sceneId === 'boss_intro' ? 0.1 : 0.04})`;
    ctx.fillRect(sx, H * 0.2 + (i % 5) * 20, 24, 1);
  }
  if (sceneId === 'boss_intro' && f % 90 < 8) {
    ctx.fillStyle = `rgba(255,70,70,${0.22 - (f % 90) * 0.02})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (sceneId === 'boss_intro') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINAL APPROACH', W / 2, 26);
  } else if (sceneId === 'bonus_celebration') {
    ctx.fillStyle = 'rgba(255,225,255,0.92)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BONUS CLEAR!', W / 2, 24);
  }
  ctx.restore();
}

function drawGreg8bit(ctx, x, y, scale=1, facing=1) {
  const wobble = Math.sin((x + y) * 0.01 + performance.now() * 0.004) * 1.2;
  const shine = Math.max(0, Math.sin(performance.now() * 0.003));
  ctx.save();
  ctx.translate(x, y + wobble);
  ctx.scale(scale * facing, scale);
  const r = PRIDE;
  // shadow + chunky outline for metal-slug feel
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(-10,30,22,3);
  ctx.fillStyle='#1a0f06'; ctx.fillRect(-9,23,20,11);
  // boots
  ctx.fillStyle='#3a1a00'; ctx.fillRect(-7,24,7,8); ctx.fillRect(2,24,7,8);
  // pants
  ctx.fillStyle='#1a1a5c'; ctx.fillRect(-7,14,14,12);
  ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(-5,15,4,9);
  // belt
  ctx.fillStyle='#8b4513'; ctx.fillRect(-7,12,14,4);
  ctx.fillStyle='#ffd700'; ctx.fillRect(-2,12,4,4);
  // shirt
  ctx.fillStyle='#ff69b4'; ctx.fillRect(-8,2,16,12);
  ctx.fillStyle='#ff9fcd'; ctx.fillRect(-5,3,10,3);
  // arms
  ctx.fillStyle='#c68642'; ctx.fillRect(-12,2,5,10); ctx.fillRect(8,2,5,10);
  // head
  ctx.fillStyle='#c68642'; ctx.fillRect(-6,-10,13,14);
  // beard
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(-6,0,13,6); ctx.fillRect(-7,-2,3,6); ctx.fillRect(11,-2,3,6);
  // eyes
  ctx.fillStyle='#000'; ctx.fillRect(0,-7,3,3); ctx.fillRect(-4,-7,3,3);
  // smile
  ctx.fillStyle='#ff9999'; ctx.fillRect(-3,-1,7,2);
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(-1,-2,3,1);
  // mohawk rainbow
  for(let i=0;i<6;i++){ctx.fillStyle=r[i]; ctx.fillRect(-2,-12-i*3,5,4);}
  // ponytail
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(4,-10,3,14); ctx.fillRect(5,-5,4,3);
  // sidearm silhouette
  ctx.fillStyle='#111'; ctx.fillRect(11,7,8,4); ctx.fillRect(12,11,3,4);
  ctx.fillStyle=`rgba(255,255,255,${0.2 + shine * 0.2})`; ctx.fillRect(12,8,4,1);
  ctx.restore();
}

function drawHeroVariant(ctx, x, y, f, opts = {}) {
  const {
    facing = 1,
    scale = 1,
    shirt = '#2f8f57',
    pants = '#8a8a50',
    skin = '#c68642',
    beard = '#4a2f1a',
    hair = '#1a1a1a',
    throwPose = false
  } = opts;
  const bob = Math.sin(f * 0.2 + x * 0.01) * 1.3;
  const stride = Math.sin(f * 0.35 + x * 0.02) * (throwPose ? 0.9 : 2.2);
  const armSwing = Math.sin(f * 0.4 + x * 0.01) * 2.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * facing, scale);
  // boots
  ctx.fillStyle='#2b2b2b'; ctx.fillRect(-8+stride*0.3,24,8,8); ctx.fillRect(1-stride*0.3,24,8,8);
  // pants
  ctx.fillStyle=pants; ctx.fillRect(-8,14,16,12);
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(-8,20,16,6);
  // shirt + vest
  ctx.fillStyle=shirt; ctx.fillRect(-9,2,18,12);
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(-9,8,18,6);
  // arms
  ctx.fillStyle=skin;
  ctx.fillRect(-13,2+stride*0.2,5,10);
  ctx.fillRect(8,2-(throwPose ? 4 : stride*0.2)-armSwing*0.2,5,10);
  // head
  ctx.fillStyle=skin; ctx.fillRect(-6,-10,13,14);
  ctx.fillStyle=beard; ctx.fillRect(-6,0,13,6);
  ctx.fillStyle=hair; ctx.fillRect(-6,-12,13,4);
  // face details
  ctx.fillStyle='#000'; ctx.fillRect(-4,-7,3,3); ctx.fillRect(0,-7,3,3);
  ctx.fillStyle='#ff9999'; ctx.fillRect(-2,-1,6,2);
  // action: snowball
  if (throwPose) {
    ctx.fillStyle='#f2f6ff';
    ctx.fillRect(11,0,4,4);
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillRect(14 + Math.sin(f*0.3)*7, -2, 3, 3);
  }
  ctx.restore();
}

// ---- Individual scene painters ----

function drawBedroom(ctx, W, H, f) {
  // dark room, pre-dawn
  ctx.fillStyle='#0d0d1f'; ctx.fillRect(0,0,W,H);
  // window - faint light
  ctx.fillStyle='#1a1a3f'; ctx.fillRect(W-120,20,90,70);
  ctx.fillStyle='rgba(100,100,200,0.15)'; ctx.fillRect(W-118,22,86,66);
  ctx.fillStyle='#333'; ctx.fillRect(W-75,22,2,66); ctx.fillRect(W-118,55,86,2);
  // bed
  ctx.fillStyle='#3a1a00'; ctx.fillRect(20,H-100,180,80);
  ctx.fillStyle='#1a3a6e'; ctx.fillRect(20,H-110,180,20);
  ctx.fillStyle='#2a4a8e'; ctx.fillRect(22,H-108,176,16);
  // pillow
  ctx.fillStyle='#ddd'; ctx.fillRect(30,H-105,60,14);
  // Greg lying in bed, thinking
  drawGreg8bit(ctx, 120, H-95, 0.9, 1);
  // thought bubble
  const bx = 180, by = H-160;
  ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(bx,by,30,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,105,180,0.5)';
  ctx.font='10px monospace'; ctx.textAlign='center';
  ctx.fillText('who am I?', bx, by+4);
  // stars out window
  for(let i=0;i<8;i++){
    ctx.fillStyle='#fff';
    const sx=W-115+((i*37)%80), sy=25+((i*23)%60);
    if(f%40<20||i%2) ctx.fillRect(sx,sy,1.5,1.5);
  }
}

function drawMirror(ctx, W, H, f) {
  ctx.fillStyle='#111118'; ctx.fillRect(0,0,W,H);
  // mirror frame
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(W/2-55,20,110,200);
  // mirror surface with shimmer
  ctx.fillStyle='#1e1e40'; ctx.fillRect(W/2-48,28,96,184);
  const shimmer = Math.sin(f*0.04)*0.08+0.08;
  ctx.fillStyle=`rgba(150,150,255,${shimmer})`; ctx.fillRect(W/2-48,28,96,184);
  // reflection — Greg, slightly brighter/more colourful
  drawGreg8bit(ctx, W/2-2, 170, 1.2, -1);
  // Pride glow around reflection
  for(let i=0;i<6;i++){
    ctx.fillStyle=PRIDE[i];
    ctx.globalAlpha=0.18+Math.sin(f*0.06+i)*0.07;
    ctx.fillRect(W/2-48,28+i*30,96,30);
  }
  ctx.globalAlpha=1;
  // Greg standing looking in mirror
  drawGreg8bit(ctx, W/2+90, 200, 1.2, -1);
  // floor
  ctx.fillStyle='#2a1a00'; ctx.fillRect(0,H-60,W,60);
}

function drawDoor(ctx, W, H, f) {
  ctx.fillStyle='#111118'; ctx.fillRect(0,0,W,H);
  // hallway walls
  ctx.fillStyle='#1a1a30'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#0d0d1e'; ctx.fillRect(40,40,W-80,H-80);
  // door
  const doorX = W/2-40, doorY=60, doorW=80, doorH=180;
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(doorX,doorY,doorW,doorH);
  ctx.fillStyle='#3a2200'; ctx.fillRect(doorX+8,doorY+8,doorW-16,doorH-16);
  // door panels
  ctx.fillStyle='#4a2d10'; ctx.fillRect(doorX+12,doorY+12,28,70); ctx.fillRect(doorX+44,doorY+12,28,70);
  ctx.fillRect(doorX+12,doorY+96,28,70); ctx.fillRect(doorX+44,doorY+96,28,70);
  // doorknob
  ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(doorX+doorW-14,doorY+doorH/2,5,0,Math.PI*2); ctx.fill();
  // light leaking from under door
  const glow = Math.sin(f*0.05)*0.3+0.7;
  ctx.fillStyle=`rgba(255,200,100,${glow*0.4})`; ctx.fillRect(doorX,doorY+doorH-2,doorW,4);
  // rainbow light burst — door slightly ajar
  for(let i=0;i<6;i++){
    ctx.fillStyle=PRIDE[i];
    ctx.globalAlpha=(0.1+Math.sin(f*0.08)*0.05)*glow;
    ctx.beginPath(); ctx.moveTo(doorX+doorW,doorY+doorH/2);
    ctx.lineTo(doorX+doorW+100, doorY+doorH/2-60+i*20);
    ctx.lineTo(doorX+doorW+100, doorY+doorH/2-40+i*20);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha=1;
  // Greg standing at door, hand reaching for knob
  drawGreg8bit(ctx, doorX-50, doorY+doorH-50, 1.2, 1);
}

function drawCityDawn(ctx, W, H, f) {
  // sunrise
  for(let i=0;i<6;i++){ctx.fillStyle=PRIDE[i]; ctx.fillRect(0,i*(H/6),W,Math.ceil(H/6));}
  // buildings (silhouette)
  ctx.fillStyle='#0a0a18';
  [[0,80,60,H],[70,100,50,H],[130,60,70,H],[210,90,55,H],[275,50,80,H],[365,100,60,H],[435,70,90,H],[535,85,55,H],[600,55,40,H]].forEach(([x,y,w,h])=>{
    ctx.fillRect(x,y,w,h-y);
    // windows
    ctx.fillStyle='#ffff88';
    for(let wy=y+10;wy<H-20;wy+=14){for(let wx=x+6;wx<x+w-6;wx+=10){if((wx+wy)%3)ctx.fillRect(wx,wy,4,6);}}
    ctx.fillStyle='#0a0a18';
  });
  // ground
  ctx.fillStyle='#1a1a30'; ctx.fillRect(0,H-50,W,50);
  // Greg walking, pride flag in hand
  const gx = 80 + (f*0.8)%200;
  drawGreg8bit(ctx, gx, H-80, 1.3, 1);
  // flag
  ctx.fillStyle='#888'; ctx.fillRect(gx+10, H-120, 3, 42);
  for(let i=0;i<6;i++){ctx.fillStyle=PRIDE[i]; ctx.fillRect(gx+13, H-120+i*6, 28, 6);}
}

function drawCrowdScene(ctx, W, H, f) {
  ctx.fillStyle='#0a1530'; ctx.fillRect(0,0,W,H);
  // crowd silhouettes
  const crowd = [30,70,110,150,190,230,270,310,360,400,440,490,530,570];
  crowd.forEach((x,i)=>{
    const bob = Math.sin(f*0.05+i*0.7)*2;
    ctx.fillStyle=i%2===0?'#1a2a4a':'#1e1e3a';
    ctx.fillRect(x,H-90+bob,24,50);
    ctx.fillRect(x+4,H-112+bob,16,24);
    // some carry flags
    if(i%3===0){
      ctx.fillStyle='#666'; ctx.fillRect(x+20,H-130+bob,2,42);
      for(let p=0;p<6;p++){ctx.fillStyle=PRIDE[p]; ctx.fillRect(x+22,H-130+bob+p*5,18,5);}
    }
  });
  // Greg prominent in centre
  drawGreg8bit(ctx, W/2, H-80, 1.5, 1);
  // spotlight
  ctx.fillStyle='rgba(255,200,255,0.07)';
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2-80,H); ctx.lineTo(W/2+80,H); ctx.closePath(); ctx.fill();
  // rainbow streaks
  for(let i=0;i<6;i++){
    ctx.fillStyle=PRIDE[i];
    ctx.globalAlpha=0.25+Math.sin(f*0.06+i)*0.1;
    ctx.fillRect(0,i*(H/6),W,Math.ceil(H/6*0.3));
  }
  ctx.globalAlpha=1;
}

function drawSupportSprite(ctx, x, y, opts = {}) {
  const {
    shirtColor = '#9ec5ff',
    skinColor = '#d6a370',
    hairColor = '#2b1b08',
    accentColor = '#ffffff',
    glasses = false,
    hat = false,
    beard = false,
    longHair = false
  } = opts;
  const bob = opts.bob || 0;
  const blink = Math.sin(opts.frame * 0.08) > 0.82;

  // torso + jacket
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x - 2, y + 84 + bob, 72, 4);
  ctx.fillStyle='#5e3521'; ctx.fillRect(x, y + bob, 68, 86);
  ctx.fillStyle=shirtColor; ctx.fillRect(x + 9, y + 33 + bob, 50, 34);
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x + 16, y + 36 + bob, 10, 24);
  // neck + head
  ctx.fillStyle=skinColor; ctx.fillRect(x + 28, y + 24 + bob, 12, 10);
  ctx.fillStyle=skinColor; ctx.fillRect(x + 20, y + 10 + bob, 28, 24);

  if (longHair) { ctx.fillStyle=hairColor; ctx.fillRect(x + 16, y + 10 + bob, 36, 24); }
  if (hat) {
    ctx.fillStyle=hairColor; ctx.fillRect(x + 16, y + 6 + bob, 36, 7);
    ctx.fillStyle=accentColor; ctx.fillRect(x + 22, y + 8 + bob, 12, 3);
  } else {
    ctx.fillStyle=hairColor; ctx.fillRect(x + 19, y + 7 + bob, 30, 8);
  }

  ctx.fillStyle='#1d120b'; // eyes
  if (!blink) {
    ctx.fillRect(x + 26, y + 20 + bob, 4, 3);
    ctx.fillRect(x + 38, y + 20 + bob, 4, 3);
  } else {
    ctx.fillRect(x + 25, y + 21 + bob, 5, 1);
    ctx.fillRect(x + 37, y + 21 + bob, 5, 1);
  }
  if (glasses) {
    ctx.fillStyle='#111';
    ctx.fillRect(x + 24, y + 18 + bob, 7, 5);
    ctx.fillRect(x + 37, y + 18 + bob, 7, 5);
    ctx.fillRect(x + 31, y + 19 + bob, 6, 2);
  }
  if (beard) { ctx.fillStyle=hairColor; ctx.fillRect(x + 23, y + 28 + bob, 22, 7); }
  ctx.fillStyle='#c2786b'; ctx.fillRect(x + 30, y + 27 + bob, 8, 2); // mouth
  // pixel-outline trim for higher contrast
  ctx.strokeStyle='rgba(0,0,0,0.35)';
  ctx.lineWidth=1;
  ctx.strokeRect(x, y + bob, 68, 86);
}

function drawPOVBase(ctx, W, H, f, characterName, shirtColor, speechColor, charOpts = {}) {
  const pulse = Math.sin(f * 0.08) * 0.05 + 0.08;
  // painterly dusk background blocks for pseudo-real pixel look
  for (let y=0; y<H; y+=12) {
    const shade = 20 + Math.floor((y/H) * 45);
    ctx.fillStyle=`rgb(${shade-8},${shade+10},${shade})`;
    ctx.fillRect(0, y, W, 12);
  }
  for (let i=0;i<8;i++){
    const tx=(i*85 + (f*0.3)%W)%W;
    ctx.fillStyle='rgba(18,55,25,0.35)';
    ctx.fillRect(tx, 40, 24, H-68);
    ctx.fillRect(tx-8, 60, 40, 16);
  }
  // over-shoulder POV (left foreground)
  ctx.fillStyle='#7a4a2a'; ctx.fillRect(24,H-102,62,84);
  ctx.fillStyle='#d6a370'; ctx.fillRect(16,H-72,44,42);
  ctx.fillStyle='#f4ba7f'; ctx.fillRect(14,H-60,22,32);
  ctx.fillStyle='#ffb54d'; ctx.fillRect(42,H-96,30,30); // hair block
  // target character right-midground (improved sprite detail + idle animation)
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  drawSupportSprite(ctx, tx, ty, { ...charOpts, shirtColor, frame: f, bob: Math.sin(f * 0.09) * 2 });
  // cinematic bars
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,0,W,14); ctx.fillRect(0,H-14,W,14);
  // dialogue panel
  ctx.fillStyle=`rgba(0,0,0,${0.5+pulse})`; ctx.fillRect(74,20,W-148,56);
  ctx.strokeStyle=speechColor; ctx.lineWidth=2; ctx.strokeRect(74,20,W-148,56);
  ctx.fillStyle=speechColor; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText(characterName, W/2, 39);
}

function drawPovMark(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'MARK', '#8ec8ff', '#d8eeff', {
    glasses: true,
    beard: true,
    hairColor: '#2a2018',
    accentColor: '#f2f8ff'
  });
  ctx.fillStyle='#d8eeff'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"Eric says your heart found the right destination."', W/2, 63);
}

function drawPovCharly(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'CHARLY', '#9ec5ff', '#d9e9ff', {
    glasses: true,
    hairColor: '#2d1f12'
  });
  ctx.fillStyle='#d9e9ff'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"I believe in you. You are always in my heart."', W/2, 60);
}

function drawPovJairo(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'JAIRO', '#ffcf6a', '#ffe7b3', {
    hat: true,
    beard: true,
    hairColor: '#2d1b08',
    accentColor: '#f3d57d'
  });
  ctx.fillStyle='#fff0cc'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"You are seen, querido. Keep that fire."', W/2, 60);
}

function drawPovChris(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'CHRIS', '#89f2c4', '#d6ffe8', {
    beard: true,
    hairColor: '#2b1b10'
  });
  // ex-military patch + bigger beard accent
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  ctx.fillStyle='#335f44'; ctx.fillRect(tx+6,ty+36,9,9);
  ctx.fillStyle='#e3fff2'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"You got this, brother. Laugh and move."', W/2, 60);
}

function drawNightTender(ctx, W, H, f) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#120b25');
  grad.addColorStop(1, '#2b1140');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 24; i++) {
    const sx = (i * 47 + f * 0.2) % W;
    const sy = (i * 29) % 110;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.fillStyle = '#2d1b10';
  ctx.fillRect(32, H - 108, W - 64, 86);
  ctx.fillStyle = '#5a3450';
  ctx.fillRect(58, H - 120, W - 116, 62);
  ctx.fillStyle = '#ff9dcf';
  ctx.fillRect(62, H - 118, W - 124, 10);
  drawHeroVariant(ctx, W / 2 - 20, H - 78, f + 4, {
    facing: 1, scale: 1.28, shirt: '#ff5ea8', pants: '#5969a2', skin: '#c68642', beard: '#5c3a1e', hair: '#232323'
  });
  drawHeroVariant(ctx, W / 2 + 8, H - 78, f + 8, {
    facing: -1, scale: 1.25, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08'
  });
  drawHeroVariant(ctx, W / 2 + 38, H - 78, f + 12, {
    facing: -1, scale: 1.22, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b'
  });
  ctx.fillStyle = 'rgba(255,160,210,0.35)';
  ctx.fillRect(0, H - 145, W, 5);
}

function drawRaidAbduction(ctx, W, H, f) {
  ctx.fillStyle = '#1a000c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(255,30,70,${0.08 + i * 0.03})`;
    ctx.fillRect(0, i * 28, W, 20);
  }
  const siren = Math.abs(Math.sin(f * 0.2));
  ctx.fillStyle = `rgba(255,80,120,${0.2 + siren * 0.3})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2b0c15';
  ctx.fillRect(24, H - 108, W - 48, 86);
  drawHeroVariant(ctx, 120, H - 74, f, {
    facing: 1, scale: 1.2, shirt: '#ff5ea8', pants: '#5969a2', skin: '#c68642', beard: '#5c3a1e', hair: '#232323'
  });
  drawHeroVariant(ctx, 208 + Math.sin(f * 0.22) * 3, H - 74, f + 9, {
    facing: -1, scale: 1.2, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08'
  });
  drawHeroVariant(ctx, 258 + Math.cos(f * 0.22) * 3, H - 74, f + 15, {
    facing: -1, scale: 1.2, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b'
  });
  ctx.fillStyle = '#7a1c2f';
  ctx.fillRect(W - 132, H - 132, 90, 116);
  ctx.fillStyle = '#ff8db5';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TR STRIKE UNIT', W - 88, H - 116);
  ctx.fillStyle = '#ffd2e6';
  ctx.fillRect(176 + Math.sin(f * 0.35) * 8, H - 100, 52, 3);
  ctx.fillRect(228 + Math.cos(f * 0.35) * 8, H - 92, 46, 3);
}

function drawDungeonCell(ctx, W, H, f) {
  ctx.fillStyle = '#08101f';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = i % 2 ? '#101a2e' : '#0c1425';
    ctx.fillRect(i * 30, 0, 24, H);
  }
  ctx.fillStyle = '#263349';
  for (let i = 0; i < 9; i++) ctx.fillRect(56 + i * 24, 22, 4, H - 44);
  ctx.fillStyle = '#334762';
  ctx.fillRect(48, 24, W - 96, 6);
  ctx.fillRect(48, H - 30, W - 96, 6);
  drawHeroVariant(ctx, W / 2 - 34, H - 74, f + 6, {
    facing: 1, scale: 1.18, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08'
  });
  drawHeroVariant(ctx, W / 2 + 26, H - 74, f + 11, {
    facing: -1, scale: 1.18, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b'
  });
  const pulse = Math.abs(Math.sin(f * 0.12));
  ctx.fillStyle = `rgba(120,210,255,${0.2 + pulse * 0.25})`;
  ctx.fillRect(W / 2 - 90, 0, 180, H);
}

function drawRescueVow(ctx, W, H, f) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#200014');
  g.addColorStop(1, '#3a1128');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const beamX = ((i * 80) - f * 1.8) % (W + 90) - 45;
    ctx.fillStyle = `rgba(255,120,170,${0.08 + i * 0.04})`;
    ctx.fillRect(beamX, 0, 16, H);
  }
  drawGreg8bit(ctx, 104, H - 68, 1.45, 1);
  ctx.fillStyle = '#ff9ec8';
  ctx.fillRect(128, H - 96, 56, 4);
  ctx.fillStyle = '#b8e9ff';
  ctx.fillRect(188, H - 88, 52, 4);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('JAIRO + CHRIS', 182, H - 104);
  ctx.fillStyle = '#ff76af';
  ctx.fillRect(250, H - 132, 42, 42);
  ctx.fillStyle = '#1b0a15';
  ctx.fillRect(254, H - 128, 34, 34);
}

function drawBossIntro(ctx, W, H, f) {
  ctx.fillStyle='#1a0000'; ctx.fillRect(0,0,W,H);
  // red sky streaks
  for(let i=0;i<8;i++){
    ctx.fillStyle=`rgba(${100+i*10},0,0,0.4)`;
    ctx.fillRect(0,i*(H/8),W,H/8);
  }
  // storm parallax layers for heavier intro energy
  for (let i = 0; i < 5; i++) {
    const cloudX = ((i * 90) - f * (0.7 + i * 0.1)) % (W + 120) - 60;
    ctx.fillStyle = 'rgba(20,0,0,0.28)';
    ctx.fillRect(cloudX, 20 + i * 22, 110, 16);
  }
  // boss form — large looming
  const pulse = Math.sin(f*0.08)*4;
  ctx.fillStyle='#220000'; ctx.fillRect(W/2-70,40+pulse,140,200);
  ctx.fillStyle='#440000'; ctx.fillRect(W/2-60,30+pulse,120,50);
  ctx.fillStyle='#880000'; ctx.fillRect(W/2-55,40+pulse,110,110);
  // boss eyes
  ctx.fillStyle='#ff2200';
  ctx.fillRect(W/2-30,60+pulse,20,20); ctx.fillRect(W/2+10,60+pulse,20,20);
  ctx.fillStyle='#ff8800';
  ctx.fillRect(W/2-26,64+pulse,12,12); ctx.fillRect(W/2+14,64+pulse,12,12);
  // boss mouth — cruel frown
  ctx.fillStyle='#110000'; ctx.fillRect(W/2-25,100+pulse,50,10);
  ctx.fillRect(W/2-30,95+pulse,10,10); ctx.fillRect(W/2+20,95+pulse,10,10);
  // label
  ctx.fillStyle='#ff7aa8';
  ctx.font='bold 14px monospace'; ctx.textAlign='center';
  ctx.fillText('TR', W/2, 30+pulse);
  ctx.font='bold 10px monospace';
  ctx.fillText('FIRED GREG FOR BEING GAY', W/2, 44 + pulse);
  // Greg small but brave at bottom
  drawGreg8bit(ctx, W/2, H-60, 1.1, 1);
  // dramatic light between them
  ctx.fillStyle='rgba(255,50,50,0.05)';
  ctx.beginPath(); ctx.moveTo(W/2,250); ctx.lineTo(W/2-60,H-60); ctx.lineTo(W/2+60,H-60); ctx.closePath(); ctx.fill();
  // warning frame pulse
  ctx.strokeStyle = `rgba(255,90,120,${0.45 + Math.abs(Math.sin(f * 0.12)) * 0.4})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);
}

function drawVictory(ctx, W, H, f) {
  // Metal-slug style sunset sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#ff975e');
  sky.addColorStop(0.45, '#ff5f88');
  sky.addColorStop(1, '#50204f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // heart-shaped sunset
  const sunX = W/2, sunY = 88;
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.fillStyle = 'rgba(255,226,140,0.95)';
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.bezierCurveTo(40, -18, 74, 18, 0, 66);
  ctx.bezierCurveTo(-74, 18, -40, -18, 0, 22);
  ctx.fill();
  ctx.restore();

  // battlefield silhouettes / ruins
  for (let i=0; i<7; i++) {
    const rx = (i*58 + (f*0.35)) % (W+80) - 40;
    ctx.fillStyle='rgba(40,18,30,0.38)';
    ctx.fillRect(rx, H-120, 22, 68);
    ctx.fillRect(rx+4, H-132, 14, 14);
  }
  ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.fillRect(0, H-64, W, 64);

  // sparkling confetti
  for (let i=0;i<36;i++){
    const sx=(i*77+(f*1.7))%W, sy=(i*53+(f*0.7))%H;
    ctx.fillStyle=PRIDE[i%6];
    ctx.fillRect(sx,sy,3,3);
  }
  // celebratory rainbow speed lines
  ctx.globalAlpha = 0.26;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = PRIDE[(i + Math.floor(f / 6)) % 6];
    ctx.fillRect(0, 24 + i * 6, W, 2);
  }
  ctx.globalAlpha = 1;

  // Charlie left side, waving farewell
  drawHeroVariant(ctx, 64, H-74, f+10, {
    facing: 1, scale: 1.2, shirt: '#9ec5ff', pants: '#7080b5', skin: '#d6a370', beard: '#2d1b12', hair: '#2d1f12'
  });
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.font='9px monospace';
  ctx.fillText('Bye, Greg', 58, H-86);

  // Greg + Jairo kiss centre (tasteful)
  drawHeroVariant(ctx, W/2 - 28, H-74, f, {
    facing: 1, scale: 1.38, shirt: '#ff5ea8', pants: '#5969a2', skin: '#c68642', beard: '#5c3a1e', hair: '#232323'
  });
  drawHeroVariant(ctx, W/2 + 8, H-74, f+7, {
    facing: -1, scale: 1.42, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08'
  });
  const kissPulse = Math.abs(Math.sin(f*0.12))*2;
  ctx.fillStyle='#ff9ac8';
  ctx.fillRect(W/2-4, H-96-kissPulse, 2, 2);
  ctx.fillRect(W/2+2, H-96-kissPulse, 2, 2);

  // Chris joins as trio walking away
  drawHeroVariant(ctx, W-90, H-74, f+20, {
    facing: -1, scale: 1.34, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b'
  });
  ctx.fillStyle='#fff';
  ctx.font='8px monospace';
  ctx.fillText('Jairo + Greg + Chris', W-84, H-86);

  // motion lines for arcade finish
  ctx.globalAlpha = 0.28;
  for (let i=0;i<5;i++) {
    ctx.fillStyle = '#ffe8a8';
    ctx.fillRect(20, H - 118 + i*8, W - 40, 2);
  }
  ctx.globalAlpha = 1;

  // title
  ctx.fillStyle='rgba(0,0,0,0.36)'; ctx.fillRect(0,10,W,42);
  ctx.fillStyle='#fff';
  ctx.font='bold 17px monospace'; ctx.textAlign='center';
  ctx.fillText('MISSION COMPLETE: LOVE WINS', W/2, 37);
}

function drawVictorySnowball(ctx, W, H, f) {
  // winter-night gradient with parallax snow
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1840');
  g.addColorStop(1, '#1a2755');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle='#f5f8ff';
  ctx.fillRect(0, H-60, W, 60);
  for (let i=0;i<64;i++) {
    const sx = (i*47 + f*1.7 + (i%7)*13) % W;
    const sy = (i*29 + f*0.95) % (H-40);
    ctx.fillStyle = i%3===0 ? '#ffffff' : '#dbe8ff';
    ctx.fillRect(sx, sy, 2, 2);
  }

  // movement trails for a more arcade / metal-run-and-gun vibe
  ctx.globalAlpha = 0.25;
  for (let i=0;i<4;i++) {
    const y = H - 95 + i * 8;
    ctx.fillStyle = '#9ec5ff';
    ctx.fillRect(40, y, W - 80, 2);
  }
  ctx.globalAlpha = 1;

  // Greg + Jairo + Chris throwing snowballs at each other
  drawHeroVariant(ctx, 96, H-74, f, {
    facing: 1, scale: 1.35, shirt: '#ff5ea8', pants: '#5a6b99', skin: '#c68642', beard: '#5c3a1e', hair: '#232323', throwPose: true
  });
  drawHeroVariant(ctx, W/2, H-76, f+20, {
    facing: -1, scale: 1.45, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08', throwPose: true
  });
  drawHeroVariant(ctx, W-102, H-74, f+40, {
    facing: -1, scale: 1.4, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b', throwPose: true
  });

  // snowball arcs crossing between everyone
  const t = f * 0.05;
  const arcs = [
    { x: 120, y: H-110, dir: 1 },
    { x: W/2 - 10, y: H-122, dir: -1 },
    { x: W-130, y: H-108, dir: -1 }
  ];
  arcs.forEach((a, idx) => {
    const px = a.x + Math.sin(t + idx) * 55 * a.dir;
    const py = a.y - Math.abs(Math.cos(t + idx * 1.4)) * 22;
    ctx.fillStyle = '#fff';
    ctx.fillRect(px, py, 5, 5);
    ctx.fillStyle = 'rgba(170,200,255,0.45)';
    ctx.fillRect(px-4, py+2, 4, 2);
  });

  ctx.fillStyle='rgba(0,0,0,0.4)';
  ctx.fillRect(0, 10, W, 42);
  ctx.fillStyle='#fff';
  ctx.font='bold 15px monospace';
  ctx.textAlign='center';
  ctx.fillText('GREG • JAIRO • CHRIS | PROUD, GAY, AND JOYFULLY CHAOTIC', W/2, 36);
}

function drawDefault(ctx, W, H, f) {
  ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
  drawGreg8bit(ctx, W/2, H/2, 1.2, 1);
}

function drawHeroCloseup(ctx, W, H, f, who = 'Greg') {
  ctx.fillStyle = who === 'Greg' ? '#1a1038' : (who === 'Jairo' ? '#1f2a3d' : '#1f3a2a');
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 2) * 0.05})`;
    ctx.fillRect(0, 30 + i * 18 + Math.sin(f * 0.05 + i) * 6, W, 2);
  }
  if (who === 'Greg') {
    drawGreg8bit(ctx, W * 0.42, H * 0.8, 2.6, 1);
  } else if (who === 'Jairo') {
    drawHeroVariant(ctx, W * 0.42, H * 0.8, f, { facing: 1, scale: 2.5, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08' });
  } else {
    drawHeroVariant(ctx, W * 0.42, H * 0.8, f, { facing: 1, scale: 2.5, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b' });
  }
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H - 54, W, 54);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`${who.toUpperCase()} • HERO CLOSE-UP`, 18, H - 24);
}

function drawBonusCelebration(ctx, W, H, f) {
  ctx.fillStyle = '#200b3f'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = PRIDE[(i + Math.floor(f / 8)) % PRIDE.length];
    ctx.fillRect((i * 27 + f * 2.8) % (W + 20) - 10, (i * 19) % H, 4, 4);
  }
  drawGreg8bit(ctx, 90, H - 70, 1.5, 1);
  drawHeroVariant(ctx, W / 2, H - 72, f, { facing: -1, scale: 1.55, shirt: '#ffcf6a', pants: '#80864a', skin: '#bf7d42', beard: '#2d1b08', hair: '#2d1b08', throwPose: true });
  drawHeroVariant(ctx, W - 96, H - 70, f + 25, { facing: -1, scale: 1.5, shirt: '#89f2c4', pants: '#6b8b58', skin: '#b87740', beard: '#2b1b10', hair: '#1b1b1b', throwPose: true });
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 8, W, 44);
  ctx.fillStyle = '#fff'; ctx.font='bold 15px monospace'; ctx.textAlign='center';
  ctx.fillText('BONUS CLEAR • LOVE CHAOS MULTIPLIER!', W / 2, 35);
}

// ============================================================
//  CUTSCENE DEFINITIONS
// ============================================================

const CUTSCENES = {
  // Plays before the game starts
  intro: [
    {
      scene: 'intro_bedroom',
      title: 'A Night Like Any Other',
      lines: [
        "Eric (Narrator): Greg Mills lies awake, tall and bearded, mohawk ponytail catching faint moonlight.",
        "Eric (Narrator): He has carried a truth for years — and tonight he chooses to live it.",
        "Eric (Narrator): His journey begins toward the man he loves."
      ]
    },
    {
      scene: 'intro_mirror',
      title: 'The Mirror Moment',
      lines: [
        "Eric (Narrator): Greg studies his reflection and finally sees himself clearly.",
        "Eric (Narrator): He smiles for real, maybe for the first time in years.",
        "\"That's me,\" Greg says. \"No more hiding.\""
      ]
    },
    {
      scene: 'intro_door',
      title: 'The Door',
      lines: [
        "Eric (Narrator): The door feels heavy, but the rainbow light beyond it is louder than fear.",
        "Eric (Narrator): Outside waits a world that has not met the full Greg yet.",
        "Eric (Narrator): He breathes in, opens the door, and steps toward love."
      ]
    }
  ],

  // Between Level 1 and Level 2
  after_level1: [
    {
      scene: 'level1_trans',
      title: 'First Steps',
      lines: [
        "Greg walks into the morning light, rainbow gems sparkling in his pocket.",
        "The city stretches ahead, vast and uncertain.",
        "But something feels different now. Lighter. Greg keeps walking."
      ]
    },
    {
      scene: 'pov_mark',
      title: 'POV: Mark At The Corner Cafe',
      lines: [
        "From Greg's POV, Mark leans over the counter and grins.",
        "\"Eric has been narrating this right,\" Mark says. \"You are becoming exactly who you are.\"",
        "Greg nods, checks his sidearm, and heads back into the street."
      ]
    },
    {
      scene: 'pov_charly',
      title: 'POV: Charly\'s Promise',
      lines: [
        "Charly — tall, slim, glasses catching the streetlight — wraps Greg in a steady hug.",
        "Their marriage was a cover, but their bond is real and deep.",
        "\"I believe in you,\" Charly says. \"Go find your man. I'll always be in your corner.\""
      ]
    }
  ],

  // Between Level 2 and Level 3
  after_level2: [
    {
      scene: 'level2_trans',
      title: 'Finding His People',
      lines: [
        "Eric (Narrator): Greg finds people who cheer, wave flags, and understand what arriving means.",
        "Mark radios from the cafe roof and guides Greg through side streets packed with old fear and new courage.",
        "Charly keeps civilians moving to safety while Greg clears each block one burst at a time.",
        "Still, stray doubts keep rushing him from the edges.",
        "Eric (Narrator): Every alley he survives becomes a sentence in the life he should have lived from day one."
      ]
    }
  ],

  after_level3: [
    {
      scene: 'pov_mark',
      title: 'POV: Mark Sends Coordinates',
      lines: [
        "Mark appears on Greg's comms with a scribbled city map and a grin.",
        "\"Two more chokepoints and you punch through,\" Mark says. \"Stay mobile and keep your heart loud.\"",
        "Eric (Narrator): Greg nods, checks ammo, and charges deeper into the district."
      ]
    },
    {
      scene: 'pov_jairo',
      title: 'POV: Jairo Steps In',
      lines: [
        "Jairo Short appears — buff, bearded, Latino, hat tilted low and confident smile ready.",
        "\"Come here,\" Jairo says, touching Greg's shoulder. \"You don't fight alone.\"",
        "Eric (Narrator): Greg feels his chest open. This love is brave, loud, and real.",
        "They lock eyes, laugh through the gunfire, and sprint back into the parade of chaos."
      ]
    },
    {
      scene: 'pov_chris',
      title: 'POV: Chris Brings The Laugh',
      lines: [
        "Chris arrives, ex-military and goofy, long beard bouncing as he jogs in.",
        "\"Tactical plan: be yourself and wreck doubt,\" Chris jokes.",
        "Eric (Narrator): Greg laughs, reloads, and charges with both men beside him."
      ]
    }
  ],

  after_level4: [
    {
      scene: 'pov_charly',
      title: 'POV: Charly Holds The Line',
      lines: [
        "Charly steps from a flickering doorway, glasses bright with rain and siren light.",
        "\"Go,\" Charly says, reloading a sidearm and covering Greg's flank. \"I've got this block.\"",
        "Eric (Narrator): In that moment Greg understands chosen family as battlefield truth."
      ]
    }
  ],

  after_level5: [
    {
      scene: 'night_tender',
      title: 'A Quiet Night Together',
      lines: [
        "For one precious night, Greg, Jairo, and Chris finally breathe between missions.",
        "Jairo kisses Greg's forehead while Chris pulls the blanket over all three and jokes that this is the real victory loot.",
        "Eric (Narrator): The city is still dangerous, but this room feels like home."
      ]
    },
    {
      scene: 'raid_abduction',
      title: 'TR Strikes In The Dark',
      lines: [
        "Sirens rip through the night as TR's strike crew crashes the room and drags Jairo and Chris away from Greg's arms.",
        "\"You want them back?\" TR taunts over loudspeakers. \"Come to my dungeon and beg.\"",
        "Greg wakes into chaos, grabs his weapon, and swears he will tear through every gate to save his lovers."
      ]
    },
    {
      scene: 'dungeon_cell',
      title: 'Dungeon Broadcast',
      lines: [
        "A hacked city feed flashes a cold dungeon cell where Jairo and Chris are trapped behind steel bars.",
        "Jairo grips Chris's hand and shouts: \"Greg, don't fold. We know you. You always come through.\"",
        "Chris grins through bruises: \"Bring that fabulous chaos, babe. We'll hold the line till you arrive.\"",
        "Eric (Narrator): Greg slams a fresh magazine into place and starts running before the feed even cuts."
      ]
    }
  ],

  after_level6: [
    {
      scene: 'hero_closeup_greg',
      title: 'Greg Locks In',
      subtitle: 'Resolve rising',
      lines: [
        "Greg breathes once, steady and fierce, and lets every doubt burn away.",
        "His grin sharpens. \"No one takes my people from me.\""
      ]
    },
    {
      scene: 'hero_closeup_jairo',
      title: 'Jairo Signal',
      subtitle: 'Signal from the dungeon',
      lines: [
        "On a cracked monitor feed, Jairo nods with that fearless smile.",
        "\"You already won in your heart. Now finish the run.\""
      ]
    },
    {
      scene: 'hero_closeup_chris',
      title: 'Chris Signal',
      subtitle: 'Signal from the dungeon',
      lines: [
        "Chris laughs through the static and raises a fist to the camera.",
        "\"Bring the chaos, babe. We trust you.\""
      ]
    },
    {
      scene: 'rescue_vow',
      title: 'No One Gets Left Behind',
      lines: [
        "Greg reloads under neon rain and pins their names to his heart: Jairo. Chris.",
        "He promises out loud: \"I'm coming for both of you. Nobody cages my lovers.\"",
        "Eric (Narrator): Mark and Charly keep comms alive while Greg storms toward TR's final fortress."
      ]
    },
    {
      scene: 'boss_intro',
      title: 'Final Approach',
      subtitle: 'Warning: Core Hostile',
      lines: [
        "The sky burns red as TR steps out for one last stand above the dungeon controls.",
        "TR once fired Greg for being gay and now cages the men Greg loves, pretending cruelty is power.",
        "Greg hears every ally in his mind — Eric, Charly, Mark, Jairo, and Chris — then chambers a round and steps forward."
      ]
    }
  ],

  after_bonus: [
    {
      scene: 'bonus_celebration',
      title: 'Bonus Debrief',
      subtitle: 'Arcade intermission',
      lines: [
        "Greg, Jairo, and Chris are still laughing from the bonus chaos warmup.",
        "\"Now we finish this together,\" Greg says, loading fresh ammo and smiling hard."
      ]
    }
  ],

  // After winning
  victory: [
    {
      scene: 'victory',
      title: 'Greg Mills — Proudly Himself',
      lines: [
        "TR's hate campaign shatters into a thousand pieces of light.",
        "Greg kisses Jairo in the middle of the street while Chris cheers and pulls them into a laughing hug.",
        "Charly gives Greg a soft smile and lets him go, proud that he finally chose his truth.",
        "Mark and Eric watch from the curb as the three men walk into a heart-shaped sunset together — loud, gay, and deeply in love."
      ]
    },
    {
      scene: 'victory_snowball',
      title: 'After The Battle: Snowball Truce',
      lines: [
        "Later, Greg, Jairo, and Chris start a wild snowball fight in the street.",
        "They laugh, duck, and throw like a run-and-gun bonus stage.",
        "All three are proudly gay for each other — open-hearted, safe, and fully themselves.",
        "No shame. Just joy, chosen family, and love that keeps showing up."
      ]
    }
  ]
};

// ============================================================
//  CUTSCENE PLAYER
// ============================================================
class CutscenePlayer {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.el = null;
    this.csCanvas = null;
    this.animFrame = null;
    this.frame = 0;
    this.lineIndex = 0;
    this.sceneIndex = 0;
    this.scenes = [];
    this.autoAdvanceTimer = null;
    this.boundAdvance = () => this._advance();
    this.onKeyDown = this._onKeyDown.bind(this);
  }

  play(key) {
    this.scenes = CUTSCENES[key];
    if (!this.scenes || this.scenes.length === 0) { this.onComplete(); return; }
    this.sceneIndex = 0;
    this.lineIndex = 0;
    this.frame = 0;
    this._buildDOM();
    this._showScene();
    this._animate();
  }

  _buildDOM() {
    if (this.el) this.el.remove();
    const el = document.createElement('div');
    el.id = 'cutscene';
    el.innerHTML = `
      <div class="rainbow-bar">
        ${PRIDE.map(c=>`<div style="background:${c}"></div>`).join('')}
      </div>
      <div class="cs-art"><canvas id="csCanvas" width="320" height="180"></canvas></div>
      <div class="cs-title" id="csTitle"></div>
      <div class="cs-subtitle" id="csSubtitle"></div>
      <div class="cs-text" id="csText"></div>
      <button class="cs-next" id="csNext">[ NEXT ]</button>
    `;
    document.getElementById('gameContainer').appendChild(el);
    this.el = el;
    this.csCanvas = document.getElementById('csCanvas');
    document.getElementById('csNext').addEventListener('click', () => this._advance());
    window.addEventListener('keydown', this.onKeyDown);
  }

  _showScene() {
    const s = this.scenes[this.sceneIndex];
    document.getElementById('csTitle').textContent = s.title;
    document.getElementById('csSubtitle').textContent = s.subtitle || this._subtitleForScene(s.scene);
    this._showLine();
  }

  _showLine() {
    const s = this.scenes[this.sceneIndex];
    const line = s.lines[this.lineIndex];
    const textEl = document.getElementById('csText');
    textEl.textContent = '';
    // typewriter effect
    let i = 0;
    clearInterval(this._typer);
    this._typer = setInterval(() => {
      textEl.textContent += line[i++];
      if (i >= line.length) clearInterval(this._typer);
    }, 28);
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    const punctuationDelay = (line.match(/[!?]/g) || []).length * 260 + (line.match(/—/g) || []).length * 220;
    this.autoAdvanceTimer = setTimeout(this.boundAdvance, 4800 + punctuationDelay);

    const isLast = this.sceneIndex === this.scenes.length-1 && this.lineIndex === s.lines.length-1;
    document.getElementById('csNext').textContent = isLast ? '[ BEGIN ]' : '[ NEXT ]';
  }

  _advance() {
    const s = this.scenes[this.sceneIndex];
    // If typewriter still running, finish it instantly
    clearInterval(this._typer);
    document.getElementById('csText').textContent = s.lines[this.lineIndex];

    this.lineIndex++;
    if (this.lineIndex < s.lines.length) {
      this._showLine();
    } else {
      this.sceneIndex++;
      this.lineIndex = 0;
      this.frame = 0;
      if (this.sceneIndex < this.scenes.length) {
        this._showScene();
      } else {
        this._cleanup();
        this.onComplete();
      }
    }
  }

  _animate() {
    this.animFrame = requestAnimationFrame(() => {
      if (!this.csCanvas) return;
      const s = this.scenes[this.sceneIndex];
      if (s) paintScene(this.csCanvas, s.scene, this.frame++);
      this._animate();
    });
  }

  _cleanup() {
    clearInterval(this._typer);
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.el) { this.el.remove(); this.el = null; }
    this.csCanvas = null;
  }

  _onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      this._advance();
    }
  }

  _subtitleForScene(sceneId) {
    if (sceneId === 'boss_intro') return 'WARNING ENERGY • FINAL APPROACH';
    if (sceneId.startsWith('hero_closeup')) return 'Hero close-up';
    if (sceneId === 'bonus_celebration') return 'Playful intermission scene';
    if (sceneId === 'victory_snowball') return 'Post-battle joy';
    return 'Cinematic story sequence';
  }
}
