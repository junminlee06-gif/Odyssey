const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('modal');
const panel = document.getElementById('panel');
const hint = document.getElementById('hint');
const cut = document.getElementById('cut');
const nameNow = document.getElementById('nameNow');

const VIEW_W = 768;
const VIEW_H = 432;
const GROUND_Y = 354;
const WORLD_W = 4760;
const MOVE_SPEED = 350;
const JUMP_SPEED = 790;
const GRAVITY = 2240;
const HERO_SCALE = 2;
const NPC_SCALE = 3;

canvas.width = VIEW_W;
canvas.height = VIEW_H;
ctx.imageSmoothingEnabled = false;

let playerX = 190;
let playerY = 0;
let velocityY = 0;
let facing = 1;
let cameraX = 0;
let previousTime = performance.now();
let currentTime = 0;
let equippedName = '귀환병';
let inspected = false;
let near = null;

const input = { left: false, right: false, jumpQueued: false };

const C = {
  black: '#050403', void: '#0a0704', skyTop: '#241a10', skyMid: '#15100b', skyBottom: '#090604',
  dustA: '#382817', dustB: '#4b351d', railDark: '#1a120a', bronze0: '#302114', bronze1: '#5a3d21',
  bronze2: '#8d642f', gold0: '#9d7a3a', gold1: '#d7b35d', gold2: '#f0d281', paper: '#d1b875',
  paperLight: '#ead591', red: '#9f3426', redHi: '#dd5b3c', skin: '#a97b53', coat0: '#12100d',
  coat1: '#27231d', coat2: '#6b5a35', smoke: '#584638', shadow: 'rgba(0,0,0,.58)'
};

const entities = [
  { id: 'poster', title: '영웅 포스터', x: 340, kind: 'object' },
  { id: 'list', title: '귀환병 명단', x: 780, kind: 'object' },
  { id: 'prop', title: '선전관', x: 1240, kind: 'npc' },
  { id: 'cargo', title: '화물칸 문', x: 1780, kind: 'object' },
  { id: 'survivor', title: '트로이 생존자', x: 2380, kind: 'npc' },
  { id: 'ticket', title: '검표 구역', x: 3020, kind: 'object' },
  { id: 'inspector', title: '검문관', x: 3480, kind: 'npc' },
  { id: 'gate', title: '검문 게이트', x: 4040, kind: 'gate' }
];

const objectText = {
  poster: ['영웅 포스터', '포스터는 열차 창문보다 낮게 붙어 있다.\n\n영웅의 얼굴은 늘 나보다 먼저 고향에 도착한다.'],
  list: ['귀환병 명단', '같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.'],
  cargo: ['화물칸 문', '이 칸에는 전리품과 유골함이 함께 실려 있다.\n\n오디세우스: 집으로 가는 열차라기보다, 전쟁을 싣고 달리는 관 같다.'],
  ticket: ['검표 구역', '검문 도장이 찍히기 전에는 누구도 이 플랫폼의 끝을 지나갈 수 없다.']
};

function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function text(value, x, y, color = C.paper, size = 10) { ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.fillText(value, Math.round(x), Math.round(y)); }
function line(x1, y1, x2, y2, color) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.round(x1)+.5, Math.round(y1)+.5); ctx.lineTo(Math.round(x2)+.5, Math.round(y2)+.5); ctx.stroke(); }
function screenX(worldX, parallax = 1) { return Math.round(worldX - cameraX * parallax); }
function noise(x, y, w, h, base, dot, step = 10) { rect(x, y, w, h, base); for (let yy=0; yy<h; yy+=3) for (let xx=(yy%6); xx<w; xx+=step) rect(x+xx, y+yy, 1, 1, dot); }
function sprite(matrix, palette, x, y, scale, flip) { matrix.forEach((row, yy) => [...row].forEach((ch, xx) => { if (ch==='.' || !palette[ch]) return; const dx = flip ? row.length-1-xx : xx; rect(x + dx*scale, y + yy*scale, scale, scale, palette[ch]); })); }

const heroIdle = [
  '.....kkkk.....',
  '....kkkkkk....',
  '....kksssk....',
  '.....kss......',
  '.....sss......',
  '...ooooooo....',
  '..occcccco....',
  '.occhhhcco....',
  '.occhhhcco....',
  '.occcbbcco....',
  '..occbbco.....',
  '..occccc......',
  '..cc..cc......',
  '..ll..ll......',
  '.bbb..bbb.....'
];
const heroRunA = ['.....kkkk.....','....kkkkkk....','....kksssk....','.....kss......','.....sss......','...ooooooo....','..occcccco....','.occhhhcco....','.occhhhcco....','.occcbbcco....','..occbbco.....','.occccc.......','.ccc..cc......','.ll...lll.....','bbb....bb.....'];
const heroRunB = ['.....kkkk.....','....kkkkkk....','....kksssk....','.....kss......','.....sss......','...ooooooo....','..occcccco....','.occhhhcco....','.occhhhcco....','.occcbbcco....','..occbbco.....','...occccc.....','..cc..ccc.....','.lll...ll.....','.bb....bbb....'];
const npcSprite = ['...kkkk...','..kkkkkk..','..kksssk..','...kssk...','..ooooo...','.occccoco.','.occhhcco.','.occcbbco.','..occbbco.','..occcco..','..cc..cc..','.lll..lll.','.bb....bb.'];
const heroPalette = { k:C.black, s:C.skin, o:C.black, c:C.coat0, h:C.coat2, b:C.gold1, l:C.black };

function drawSky() {
  const gradient = ctx.createLinearGradient(0,0,0,VIEW_H);
  gradient.addColorStop(0,C.skyTop);
  gradient.addColorStop(.55,C.skyMid);
  gradient.addColorStop(1,C.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,VIEW_W,VIEW_H);
  for (let i=0;i<44;i++) {
    const x=(i*102-Math.floor(cameraX*.04))%(VIEW_W+140)-70;
    const y=26+(i*43)%138;
    rect(x,y,38+(i%5)*18,2,i%2?C.dustA:C.dustB);
  }
  const roofY = 236;
  let x = -40 - Math.floor(cameraX*.12)%180;
  while (x < VIEW_W + 80) {
    line(x, roofY, x+88, roofY+4, C.gold0);
    line(x+88, roofY+4, x+144, roofY+2, C.bronze2);
    if ((x/180|0)%2===0) { line(x+144, roofY+2, x+148, roofY+16, C.gold1); line(x+148, roofY+16, x+152, roofY+4, C.black); }
    x += 180;
  }
  for (let i=0;i<9;i++) rect((i*154-Math.floor(cameraX*.08))%(VIEW_W+60)-30, roofY+24+(i%3)*14, 2, 18, C.bronze2);
}

function drawLongIthacaTrain() {
  const trainY = 270;
  const trainH = 84;
  rect(0, trainY-10, VIEW_W, trainH+25, 'rgba(0,0,0,.45)');
  rect(0, trainY-4, VIEW_W, 4, C.black);
  rect(0, trainY, VIEW_W, 5, C.gold0);
  rect(0, trainY+trainH, VIEW_W, 5, C.black);
  const offset = Math.floor(cameraX * .62) % 312;
  for (let x = -offset - 312; x < VIEW_W + 360; x += 312) {
    noise(x, trainY+6, 304, trainH-4, '#2a1a0f', '#5b3b20', 10);
    rect(x+4, trainY+12, 296, 2, C.gold0);
    rect(x+4, trainY+trainH-18, 296, 2, C.gold0);
    rect(x+300, trainY, 8, trainH+6, C.black);
    rect(x+290, trainY+4, 4, trainH, C.bronze2);

    // passenger door/window block without letters
    rect(x+36, trainY+26, 38, 50, C.black);
    rect(x+42, trainY+32, 26, 18, C.paper);
    rect(x+48, trainY+36, 14, 10, '#5a3920');
    rect(x+44, trainY+58, 22, 3, C.gold0);
    rect(x+50, trainY+66, 12, 3, C.gold0);

    // central cargo panel without letters
    rect(x+108, trainY+24, 96, 4, C.gold0);
    rect(x+116, trainY+40, 72, 2, C.bronze2);
    rect(x+130, trainY+56, 54, 2, C.bronze2);
    rect(x+148, trainY+64, 26, 3, C.gold0);

    // small inspection/connection door without letters
    rect(x+232, trainY+26, 34, 50, C.black);
    rect(x+238, trainY+32, 22, 18, '#47301b');
    rect(x+240, trainY+58, 18, 3, C.gold0);
  }
}

function drawPlatform() {
  noise(0,GROUND_Y,VIEW_W,VIEW_H-GROUND_Y,'#1b1209','#3b2a18',10);
  rect(0,GROUND_Y,VIEW_W,5,C.gold1);
  rect(0,GROUND_Y+4,VIEW_W,2,C.gold2);
  rect(0,GROUND_Y+34,VIEW_W,5,C.black);
  const off=Math.floor(cameraX*.95)%64;
  for(let x=-off;x<VIEW_W;x+=64){ rect(x,GROUND_Y+12,48,2,C.bronze2); rect(x+18,GROUND_Y+26,36,2,'#4a321c'); rect(x+10,GROUND_Y+6,6,2,C.gold2); rect(x+56,GROUND_Y+8,6,20,'#100b07'); }
  const railY=GROUND_Y+48; rect(0,railY,VIEW_W,4,C.gold0); rect(0,railY+20,VIEW_W,4,C.gold0);
  for(let x=-Math.floor(cameraX*1.15)%44;x<VIEW_W;x+=44){ rect(x,railY+2,8,24,C.railDark); rect(x+2,railY+4,2,18,C.bronze2); }
}

function drawForegroundTrainDetails() {
  const visible = wx => screenX(wx)>-240 && screenX(wx)<VIEW_W+240;
  if (visible(340)) drawPoster(screenX(290), 278);
  if (visible(780)) drawNameColumn(screenX(740), 274);
  if (visible(1780)) drawCargoMark(screenX(1680), 282);
  if (visible(3020)) drawNameColumn(screenX(2980), 274);
  if (visible(4040)) drawCheckpoint(screenX(4040), 254);
}
function drawPoster(x,y){ rect(x-4,y-4,56,70,C.black); noise(x,y,48,62,C.paper,C.paperLight,8); rect(x+12,y+10,24,22,'#6b3326'); rect(x+16,y+6,16,8,'#2c1b14'); rect(x+10,y+40,30,4,'#332217'); rect(x+12,y+50,32,4,'#332217'); rect(x+34,y+54,12,10,C.red); }
function drawNameColumn(x,y){ rect(x-4,y-4,44,78,C.black); noise(x,y,36,70,'#3a2515','#694621',8); rect(x+5,y+14,24,4,C.gold1); rect(x+7,y+28,20,3,C.gold0); rect(x+8,y+44,18,3,C.bronze2); rect(x+4,y+60,28,4,C.bronze2); }
function drawCargoMark(x,y){ rect(x-6,y+4,124,60,C.black); noise(x,y,112,56,'#422414','#7e4f2d',8); rect(x+20,y+18,64,4,C.gold0); rect(x+30,y+34,50,4,C.gold0); rect(x+46,y+46,28,4,C.bronze2); }
function drawCheckpoint(x,y){ rect(x-8,y+8,148,104,C.black); noise(x,y+16,132,88,'#3a2512','#6c4723',8); rect(x+10,y+32,112,6,C.gold1); rect(x+18,y+58,88,4,C.bronze2); rect(x+32,y+74,58,4,C.gold0); line(x+120,y+12,x+182,y+64,C.gold1); line(x+182,y+64,x+218,y+64,C.bronze2); line(x+126,y+14,x+184,y+96,C.black); }
function drawDebris(x,y){ rect(x,y+28,92,12,C.black); rect(x+8,y+20,30,10,C.rustDark || '#351914'); rect(x+40,y+14,40,8,C.bronze0); rect(x+72,y+8,8,24,C.brassDark || C.bronze2); }

function drawNpc(x,y,type){ const palette={...heroPalette}; palette.c=type===0?'#2c2418':type===1?'#201914':'#17120e'; palette.h=type===0?'#8a6b36':type===1?'#5e4930':'#a4823d'; palette.b=type===2?C.gold2:C.gold1; sprite(npcSprite,palette,x-17,y,NPC_SCALE,false); if(type===0) rect(x+17,y+17,12,24,C.paper); if(type===1) rect(x+14,y+45,18,12,'#6b4d31'); if(type===2) rect(x+14,y+28,28,6,C.gold2); }
function drawGlyph(x,y,active){ rect(x-(active?34:20),y-2,active?68:40,active?28:20,C.black); rect(x-(active?32:18),y,active?64:36,active?26:18,active?C.gold1:'#4a3520'); rect(x-(active?28:14),y+4,active?56:28,active?18:10,active?'#171008':'#120d08'); text(active?'E':'...',x-(active?6:10),y+(active?21:15),active?C.gold2:'#a78b4a',active?14:10); }
function drawHero(){ const moving=input.left||input.right; const frame=moving?(Math.floor(currentTime/110)%2?heroRunA:heroRunB):heroIdle; const heroHeight=frame.length*HERO_SCALE; const hx=screenX(playerX)-14; const hy=GROUND_Y-heroHeight-Math.round(playerY); rect(hx-4,GROUND_Y-3,34,5,'rgba(0,0,0,.72)'); rect(hx-3,hy-3,34,heroHeight+6,'rgba(215,179,93,.08)'); sprite(frame,heroPalette,hx,hy,HERO_SCALE,facing<0); rect(hx+(facing<0?3:24),hy+24,5,2,C.redHi); }
function drawRainAndScanlines(){ const phase=Math.floor(currentTime/45); for(let i=0;i<52;i++){ const x=(i*87+phase*3)%VIEW_W; const y=(i*37+phase*7)%VIEW_H; rect(x,y,1,5,'rgba(215,179,93,.11)'); } for(let y=0;y<VIEW_H;y+=3) rect(0,y,VIEW_W,1,'rgba(0,0,0,.07)'); }

function drawScene(){
  cameraX=Math.max(0,Math.min(WORLD_W-VIEW_W,playerX-340));
  drawSky();
  drawLongIthacaTrain();
  drawForegroundTrainDetails();
  drawPlatform();
  if(screenX(1520)>-200&&screenX(1520)<VIEW_W+200)drawDebris(screenX(1480),316);
  if(screenX(2440)>-200&&screenX(2440)<VIEW_W+200)drawDebris(screenX(2380),316);
  entities.forEach(e=>{ const x=screenX(e.x); if(x<-160||x>VIEW_W+160)return; if(e.kind==='npc'){ const type=e.id==='survivor'?1:e.id==='inspector'?2:0; drawNpc(x,GROUND_Y-npcSprite.length*NPC_SCALE,type); } });
  drawHero();
  entities.forEach(e=>{ const x=screenX(e.x); if(x<-160||x>VIEW_W+160)return; drawGlyph(x,GROUND_Y-115,near&&near.id===e.id); });
  drawRainAndScanlines();
}

function update(now){ const dt=Math.min((now-previousTime)/1000,.033); previousTime=now; currentTime=now; const dir=Number(input.right)-Number(input.left); if(dir!==0)facing=dir; playerX=Math.max(96,Math.min(WORLD_W-140,playerX+dir*MOVE_SPEED*dt)); if(input.jumpQueued&&playerY===0) velocityY=JUMP_SPEED; input.jumpQueued=false; if(playerY>0||velocityY!==0){ playerY+=velocityY*dt; velocityY-=GRAVITY*dt; if(playerY<0){playerY=0; velocityY=0;} } near=entities.find(e=>Math.abs(e.x-playerX)<95)||null; hint.textContent=near?'E / 터치: '+near.title:'A/D 이동 · Space 점프 · E 상호작용 · I 신분철'; drawScene(); requestAnimationFrame(update); }
function show(title,body,extra=''){ panel.innerHTML='<h1>'+title+'</h1><p>'+body+'</p>'+extra+'<button onclick="hide()">닫기</button>'; modal.style.display='grid'; }
function hide(){ modal.style.display='none'; }
function describeName(identity){ if(identity==='귀환병')return '공감, 낮은 위험. 민간인 대화에 적합.'; if(identity==='라에르테스의 아들')return '이타카 왕가 혈통명. 귀향 자격에 적합.'; if(identity==='도시를 함락한 자')return '강한 전공명. 생존자에게 반감을 산다.'; return '분석적이고 우회적인 이름.'; }
function openNames(){ const html=['귀환병','라에르테스의 아들','도시를 함락한 자','지략이 많은 자'].map(identity=>'<button class="choice" onclick="equippedName=\''+identity+'\';nameNow.textContent=equippedName;openNames()"><b>['+identity+']</b><br>'+describeName(identity)+'</button>').join('')+'<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>'; show('신분철',html,''); }
function openTicket(){ show('귀향표','<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">'+(inspected?'APPROVED':'VALID')+'</span></div>'); }
function talk(id){ if(id==='prop')show('선전관','장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.','<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>['+equippedName+']</b> 나는 집으로 간다.</button>'); if(id==='survivor')show('트로이 생존자','당신이 그 열차를 들여보낸 사람이군요.','<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>['+equippedName+']</b> 전쟁은 끝났습니다.</button>'); if(id==='inspector'){ inspected=true; show('검표 결과','<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검문관: 기록은 사람보다 오래 기다립니다.'); } }
function interact(){ if(!near)return; if(near.id==='gate'){ if(!inspected){show('검표 필요','검문 게이트를 지나려면 먼저 검문관에게 귀향표와 탑승명을 제시해야 한다.'); return;} cut.style.display='grid'; cut.innerHTML='<article><h1>1장. 트로이 폐허역</h1><p>갈색 객차들이 플랫폼을 가득 메운다. 전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>'; return; } if(objectText[near.id])show(objectText[near.id][0],objectText[near.id][1]); else talk(near.id); }
window.onkeydown=e=>{ const key=e.key.toLowerCase(); if([' ','arrowleft','arrowright','a','d','e','i'].includes(key))e.preventDefault(); if(e.repeat)return; if(key==='a'||key==='arrowleft')input.left=true; if(key==='d'||key==='arrowright')input.right=true; if(key===' ')input.jumpQueued=true; if(key==='e')interact(); if(key==='i')openNames(); };
window.onkeyup=e=>{ const key=e.key.toLowerCase(); if(key==='a'||key==='arrowleft')input.left=false; if(key==='d'||key==='arrowright')input.right=false; };
function bindHold(button,property){ button.onpointerdown=e=>{e.preventDefault(); input[property]=true; button.setPointerCapture?.(e.pointerId);}; button.onpointerup=e=>{e.preventDefault(); input[property]=false;}; button.onpointercancel=()=>{input[property]=false;}; button.onpointerleave=()=>{input[property]=false;}; }
bindHold(leftBtn,'left'); bindHold(rightBtn,'right'); jumpBtn.onclick=e=>{e.preventDefault(); input.jumpQueued=true;}; actBtn.onclick=interact; nameBtn.onclick=openNames; ticketBtn.onclick=openTicket; requestAnimationFrame(update);
