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
    case 'pov_roxie':       drawPovRoxie(ctx, W, H, frame);  break;
    case 'pov_charly':      drawPovCharly(ctx, W, H, frame); break;
    case 'level2_trans':    drawCrowdScene(ctx, W, H, frame);break;
    case 'pov_jules':       drawPovJules(ctx, W, H, frame);  break;
    case 'pov_jairo':       drawPovJairo(ctx, W, H, frame);  break;
    case 'pov_chris':       drawPovChris(ctx, W, H, frame);  break;
    case 'pov_marco':       drawPovMarco(ctx, W, H, frame);  break;
    case 'boss_intro':      drawBossIntro(ctx, W, H, frame); break;
    case 'victory':         drawVictory(ctx, W, H, frame);   break;
    default:                drawDefault(ctx, W, H, frame);   break;
  }
}

function drawGreg8bit(ctx, x, y, scale=1, facing=1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  const r = PRIDE;
  // boots
  ctx.fillStyle='#3a1a00'; ctx.fillRect(-7,24,7,8); ctx.fillRect(2,24,7,8);
  // pants
  ctx.fillStyle='#1a1a5c'; ctx.fillRect(-7,14,14,12);
  // belt
  ctx.fillStyle='#8b4513'; ctx.fillRect(-7,12,14,4);
  ctx.fillStyle='#ffd700'; ctx.fillRect(-2,12,4,4);
  // shirt
  ctx.fillStyle='#ff69b4'; ctx.fillRect(-8,2,16,12);
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
  // mohawk rainbow
  for(let i=0;i<6;i++){ctx.fillStyle=r[i]; ctx.fillRect(-2,-12-i*3,5,4);}
  // ponytail
  ctx.fillStyle='#5c3a1e'; ctx.fillRect(4,-10,3,14); ctx.fillRect(5,-5,4,3);
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

function drawPOVBase(ctx, W, H, f, characterName, shirtColor, speechColor) {
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
  // target character right-midground
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  ctx.fillStyle='#6d3f24'; ctx.fillRect(tx, ty, 66, 86);
  ctx.fillStyle=shirtColor; ctx.fillRect(tx+8, ty+32, 50, 30);
  ctx.fillStyle='#d6a370'; ctx.fillRect(tx+20, ty+10, 24, 24);
  // cinematic bars
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,0,W,14); ctx.fillRect(0,H-14,W,14);
  // dialogue panel
  ctx.fillStyle=`rgba(0,0,0,${0.5+pulse})`; ctx.fillRect(74,20,W-148,56);
  ctx.strokeStyle=speechColor; ctx.lineWidth=2; ctx.strokeRect(74,20,W-148,56);
  ctx.fillStyle=speechColor; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText(characterName, W/2, 39);
}

function drawPovRoxie(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'ROXIE', '#36d1ff', '#7fe9ff');
  ctx.fillStyle='#b8f7ff'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"You are not late to your own life."', W/2, 63);
}

function drawPovCharly(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'CHARLY', '#9ec5ff', '#d9e9ff');
  // glasses + taller silhouette
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  ctx.fillStyle='#222'; ctx.fillRect(tx+18,ty+18,8,2); ctx.fillRect(tx+30,ty+18,8,2); ctx.fillRect(tx+26,ty+18,4,2);
  ctx.fillStyle='#d9e9ff'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"I believe in you. You are always in my heart."', W/2, 60);
}

function drawPovJules(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'JULES', '#ff7e9f', '#ffc7d8');
  ctx.fillStyle='#ffdbe7'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"Breathe. Aim true. Your story is valid."', W/2, 63);
}

function drawPovJairo(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'JAIRO', '#ffcf6a', '#ffe7b3');
  // hat + beard accents
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  ctx.fillStyle='#5b3a12'; ctx.fillRect(tx+14,ty+7,30,6);
  ctx.fillStyle='#2d1b08'; ctx.fillRect(tx+20,ty+26,18,8);
  ctx.fillStyle='#fff0cc'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"You are seen, querido. Keep that fire."', W/2, 60);
}

function drawPovChris(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'CHRIS', '#89f2c4', '#d6ffe8');
  // ex-military patch + bigger beard accent
  const tx = W - 118;
  const ty = H - 104 + Math.sin(f*0.09)*2;
  ctx.fillStyle='#335f44'; ctx.fillRect(tx+6,ty+36,9,9);
  ctx.fillStyle='#2b1b10'; ctx.fillRect(tx+18,ty+26,18,9);
  ctx.fillStyle='#e3fff2'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('"You got this, brother. Laugh and move."', W/2, 60);
}

function drawPovMarco(ctx, W, H, f) {
  drawPOVBase(ctx, W, H, f, 'MARCO', '#90ff90', '#d4ffd4');
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
  ctx.fillStyle='#ff4444';
  ctx.font='bold 14px monospace'; ctx.textAlign='center';
  ctx.fillText('SHAME', W/2, 30+pulse);
  // Greg small but brave at bottom
  drawGreg8bit(ctx, W/2, H-60, 1.1, 1);
  // dramatic light between them
  ctx.fillStyle='rgba(255,50,50,0.05)';
  ctx.beginPath(); ctx.moveTo(W/2,250); ctx.lineTo(W/2-60,H-60); ctx.lineTo(W/2+60,H-60); ctx.closePath(); ctx.fill();
}

function drawVictory(ctx, W, H, f) {
  // full rainbow background
  for(let i=0;i<6;i++){ctx.fillStyle=PRIDE[i]; ctx.fillRect(0,i*(H/6),W,Math.ceil(H/6)+1);}
  // sparkles everywhere
  ctx.fillStyle='#fff';
  for(let i=0;i<30;i++){
    const sx=(i*137+(f*2))%W, sy=(i*97+(f))%H;
    const s=Math.sin(f*0.1+i)*0.7+1;
    ctx.globalAlpha=Math.abs(Math.sin(f*0.07+i));
    ctx.fillRect(sx,sy,s*3,s*3);
  }
  ctx.globalAlpha=1;
  // ground
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,H-70,W,70);
  // Greg LARGE and triumphant, centre stage
  const bounce = Math.abs(Math.sin(f*0.06))*8;
  drawGreg8bit(ctx, W/2, H-80-bounce, 2, 1);
  // Stars/confetti
  for(let i=0;i<20;i++){
    ctx.fillStyle=PRIDE[i%6];
    const cx=(i*73+f*1.5)%W, cy=(i*41+f*0.8)%H;
    ctx.fillRect(cx,cy,5,5);
  }
  // Title overlay
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,10,W,40);
  ctx.fillStyle='#fff';
  ctx.font='bold 20px monospace'; ctx.textAlign='center';
  ctx.fillText('GREG IS FREE', W/2, 38);
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
        "Greg Mills lies awake. Tall, bearded, mohawk ponytail catching the faint light.",
        "He has a secret he's been carrying for years — a truth that belongs only to him.",
        "But tonight feels different. Tonight, he decides... it's time."
      ]
    },
    {
      scene: 'intro_mirror',
      title: 'The Mirror Moment',
      lines: [
        "Greg stands before the mirror. He looks at the man staring back at him.",
        "And for the first time in a long time... he smiles.",
        "\"That's me,\" he says. \"The real me. And I'm not hiding anymore.\""
      ]
    },
    {
      scene: 'intro_door',
      title: 'The Door',
      lines: [
        "The front door feels heavier than usual. Rainbow light seeps through the cracks.",
        "On the other side: a world that doesn't know Greg yet. Not the full Greg.",
        "He takes a breath, grabs the handle... and steps forward."
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
      scene: 'pov_roxie',
      title: 'POV: Roxie At The Corner Cafe',
      lines: [
        "From Greg's POV, Roxie leans over the counter and grins.",
        "\"You're not broken,\" she says. \"You're becoming.\"",
        "Greg nods. He checks his Glock, breathes, and heads back into the street."
      ]
    },
    {
      scene: 'pov_charly',
      title: 'POV: Charly\'s Promise',
      lines: [
        "Charly — tall, slim, glasses catching the streetlight — wraps Greg in a steady hug.",
        "Their marriage was a cover, but their bond is real and deep.",
        "\"I believe in you,\" Charly says. \"You will always be in my heart.\""
      ]
    }
  ],

  // Between Level 2 and Level 3
  after_level2: [
    {
      scene: 'level2_trans',
      title: 'Finding His People',
      lines: [
        "Greg finds them — people who cheer, who wave flags, who know what it means to arrive.",
        "For the first time, Greg feels the city answering back with love.",
        "Still, stray doubts keep rushing him from the edges.",
        "He keeps moving: one block, one breath, one burst at a time."
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
        "Greg tightens his grip and keeps pushing toward the parade route."
      ]
    },
    {
      scene: 'pov_jairo',
      title: 'POV: Jairo Steps In',
      lines: [
        "Jairo Short appears — buff, bearded, Latino, hat tilted low and confident smile ready.",
        "\"Come here,\" Jairo says, touching Greg's shoulder. \"You don't fight alone.\"",
        "Greg feels his chest open. This love is brave, loud, and real."
      ]
    },
    {
      scene: 'pov_chris',
      title: 'POV: Chris Brings The Laugh',
      lines: [
        "Chris arrives, ex-military and goofy, long beard bouncing as he jogs in.",
        "\"Tactical plan: be yourself and wreck doubt,\" Chris jokes.",
        "Greg laughs out loud. Then he reloads and charges forward with both men beside him."
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
        "Charly, Jairo, and Chris stand behind him — chosen family and true love all in one frame."
      ]
    },
    {
      scene: 'boss_intro',
      title: 'Final Approach',
      lines: [
        "The sky burns red as SHAME gathers for one last stand.",
        "Greg hears every ally in his mind: Charly, Jairo, Chris, Roxie, Jules, Marco — and his own voice, strongest of all.",
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
        "The Shame Boss shatters into a thousand pieces of light.",
        "Greg stands tall — mohawk blazing, beard fierce, heart open.",
        "Charly smiles with tears in her eyes while Jairo and Chris pull Greg into a laughing embrace.",
        "He is not perfect. He is not finished. But he is FREE — and deeply loved."
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
    cancelAnimationFrame(this.animFrame);
    if (this.el) { this.el.remove(); this.el = null; }
    this.csCanvas = null;
  }
}
