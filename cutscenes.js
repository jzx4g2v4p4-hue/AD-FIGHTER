// ============================================================
//  GREG'S PRIDE QUEST — Cutscene Engine
// ============================================================

const PRIDE = ['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'];

// ---- Pixel art scene painter ----
function paintScene(canvas, sceneId, frame) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  switch (sceneId) {
    case 'intro_bedroom':   drawBedroom(ctx, W, H, frame);   break;
    case 'intro_mirror':    drawMirror(ctx, W, H, frame);    break;
    case 'intro_door':      drawDoor(ctx, W, H, frame);      break;
    case 'level1_trans':    drawCityDawn(ctx, W, H, frame);  break;
    case 'pov_mark':        drawPovMark(ctx, W, H, frame);   break;
    case 'pov_charly':      drawPovCharly(ctx, W, H, frame); break;
    case 'level2_trans':    drawCrowdScene(ctx, W, H, frame);break;
    case 'pov_jules':       drawPovJules(ctx, W, H, frame);  break;
    case 'pov_jairo':       drawPovJairo(ctx, W, H, frame);  break;
    case 'pov_chris':       drawPovChris(ctx, W, H, frame);  break;
    case 'pov_marco':       drawPovMarco(ctx, W, H, frame);  break;
    case 'boss_intro':      drawBossIntro(ctx, W, H, frame); break;
    case 'victory':         drawVictory(ctx, W, H, frame);   break;
    case 'victory_snowball':drawVictorySnowball(ctx, W, H, frame); break;
    default:                drawDefault(ctx, W, H, frame);   break;
  }
  drawCinematicFX(ctx, W, H, frame);
}

function drawCinematicFX(ctx, W, H, f) {
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

function drawPovJules(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'JULES', '#ff7e9f', '#ffc7d8', {
    longHair: true,
    hairColor: '#5f2a8a'
  });
  ctx.fillStyle='#ffdbe7'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"Breathe. Aim true. Your story is valid."', W/2, 63);
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

function drawPovMarco(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'MARCO', '#90ff90', '#d4ffd4', {
    glasses: true,
    longHair: true,
    hairColor: '#1a3e1a',
    accentColor: '#d9ffd9'
  });
  ctx.fillStyle='#e8ffe8'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"We got your six, Greg. Keep moving."', W/2, 63);
}

function drawBossIntro(ctx, W, H, f) {
  ctx.fillStyle='#1a0000'; ctx.fillRect(0,0,W,H);
  // red sky streaks
  for(let i=0;i<8;i++){
    ctx.fillStyle=`rgba(${100+i*10},0,0,0.4)`;
    ctx.fillRect(0,i*(H/8),W,H/8);
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
        "For the first time, Greg feels the city answering back with love.",
        "Still, stray doubts keep rushing him from the edges.",
        "Eric (Narrator): He keeps moving — one block closer to his gay lover, one breath at a time."
      ]
    }
  ],

  after_level3: [
    {
      scene: 'pov_jules',
      title: 'POV: Jules Checks In',
      lines: [
        "Greg spots Jules waiting beneath a train sign, calm as ever.",
        "\"You're doing it,\" Jules says. \"Every step is proof.\"",
        "Eric (Narrator): Greg tightens his grip and pushes toward the parade route."
      ]
    },
    {
      scene: 'pov_jairo',
      title: 'POV: Jairo Steps In',
      lines: [
        "Jairo Short appears — buff, bearded, Latino, hat tilted low and confident smile ready.",
        "\"Come here,\" Jairo says, touching Greg's shoulder. \"You don't fight alone.\"",
        "Eric (Narrator): Greg feels his chest open. This love is brave, loud, and real."
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
      scene: 'pov_marco',
      title: 'POV: Marco Joins The Push',
      lines: [
        "Music thumps from a distant block party as Marco jogs up beside Greg.",
        "\"No more hiding,\" Marco says. \"Let's clear this last street together.\"",
        "Charly, Mark, Jairo, and Chris stand behind him — chosen family and true love in one frame."
      ]
    },
    {
      scene: 'boss_intro',
      title: 'Final Approach',
      lines: [
        "The sky burns red as TR steps out for one last stand.",
        "TR once fired Greg for being gay and tried to call that power.",
        "Greg hears every ally in his mind: Eric narrating, Charly, Mark, Jairo, Chris, Jules, Marco — and his own voice strongest of all.",
        "He chambers a round, steps forward, and chooses himself."
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
        "The three men walk into a heart-shaped sunset together — loud, gay, and deeply in love."
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
    this.autoAdvanceTimer = setTimeout(this.boundAdvance, 5200);

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
}
