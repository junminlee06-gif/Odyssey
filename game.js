const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('modal');
const panel = document.getElementById('panel');
const hint = document.getElementById('hint');
const cut = document.getElementById('cut');
const nameNow = document.getElementById('nameNow');

const VIEW_W = 384;
const VIEW_H = 216;
const GROUND_Y = 176;
const WORLD_W = 2380;
const MOVE_SPEED = 176;
const JUMP_SPEED = 400;
const GRAVITY = 1120;
const HERO_SCALE = 2;
const NPC_SCALE = 2;

let playerX = 96;
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
  black: '#050403',
  void: '#0a0704',
  skyTop: '#241a10',
  skyMid: '#15100b',
  skyBottom: '#090604',
  dustA: '#382817',
  dustB: '#4b351d',
  ink: '#080604',
  railDark: '#1a120a',
  wall: '#20170f',
  wallDot: '#3a2919',
  bronze0: '#302114',
  bronze1: '#5a3d21',
  bronze2: '#8d642f',
  gold0: '#9d7a3a',
  gold1: '#d7b35d',
  gold2: '#f0d281',
  paper: '#d1b875',
  paperLight: '#ead591',
  red: '#9f3426',
  redHi: '#dd5b3c',
  skin: '#a97b53',
  coat0: '#151515',
  coat1: '#27231d',
  coat2: '#6b5a35',
  smoke: '#584638',
  shadow: 'rgba(0,0,0,.58)'
};

const entities = [
  { id: 'poster', title: '영웅 포스터', x: 170, kind: 'object' },
  { id: 'list', title: '귀환병 명단', x: 390, kind: 'object' },
  { id: 'prop', title: '선전관', x: 620, kind: 'npc' },
  { id: 'cargo', title: '화물칸 문', x: 890, kind: 'object' },
  { id: 'survivor', title: '트로이 생존자', x: 1190, kind: 'npc' },
  { id: 'ticket', title: '검표 구역', x: 1510, kind: 'object' },
  { id: 'inspector', title: '검문관', x: 1740, kind: 'npc' },
  { id: 'gate', title: '검문 게이트', x: 2020, kind: 'gate' }
];

const objectText = {
  poster: ['영웅 포스터', '“트로이를 함락한 자, 귀환하다.”\n\n포스터는 열차 창문보다 낮게 붙어 있다. 영웅의 얼굴은 늘 나보다 먼저 고향에 도착한다.'],
  list: ['귀환병 명단', '같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.'],
  cargo: ['화물칸 문', '이 칸에는 전리품과 유골함이 함께 실려 있다.\n\n오디세우스: 집으로 가는 열차라기보다, 전쟁을 싣고 달리는 관 같다.'],
  ticket: ['검표 구역', '“이타카행 연결편 검문 중.”\n\n검문 도장이 찍히기 전에는 누구도 이 플랫폼의 끝을 지나갈 수 없다.']
};

function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function text(value, x, y, color = C.paper, size = 5) { ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.fillText(value, Math.round(x), Math.round(y)); }
function line(x1, y1, x2, y2, color) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.round(x1)+.5, Math.round(y1)+.5); ctx.lineTo(Math.round(x2)+.5, Math.round(y2)+.5); ctx.stroke(); }
function screenX(worldX, parallax = 1) { return Math.round(worldX - cameraX * parallax); }
function noise(x, y, w, h, base, dot, step = 7) { rect(x, y, w, h, base); for (let yy=0; yy<h; yy+=2) for (let xx=(yy%4); xx<w; xx+=step) rect(x+xx, y+yy, 1, 1, dot); }
function sprite(matrix, palette, x, y, scale, flip) { matrix.forEach((row, yy) => [...row].forEach((ch, xx) => { if (ch==='.' || !palette[ch]) return; const dx = flip ? row.length-1-xx : xx; rect(x + dx*scale, y + yy*scale, scale, scale, palette[ch]); })); }

const heroIdle = [
  '......kkkk......',
  '.....kkkkkk.....',
  '.....kksssk.....',
  '......kss.......',
  '......sss.......',
  '....oooooooo....',
  '...occccccob....',
  '..occhhhccob....',
  '..occhhhhcco....',
  '..occcbbccco....',
  '..occcbbccco....',
  '...occbbcco.....',
  '...occcccco.....',
  '....occccc......',
  '....cc..cc......',
  '....cc..cc......',
  '....ll..ll......',
  '...lll..lll.....',
  '...bb....bb.....'
];
const heroRunA = ['......kkkk......','.....kkkkkk.....','.....kksssk.....','......kss.......','......sss.......','....oooooooo....','...occccccob....','..occhhhccob....','..occhhhhcco....','..occcbbccco....','..occcbbccco....','...occbbcco.....','..occcccco......','..occccc........','..ccc...cc......','..cc....ccc.....','.lll.....ll.....','lll......lll....','bb........bbb...'];
const heroRunB = ['......kkkk......','.....kkkkkk.....','.....kksssk.....','......kss.......','......sss.......','....oooooooo....','...occccccob....','..occhhhccob....','..occhhhhcco....','..occcbbccco....','..occcbbccco....','...occbbcco.....','....occcccco....','.....occccc.....','....cc...ccc....','...ccc....cc....','...ll.....lll...','..lll......lll..','.bbb........bb..'];
const npcSprite = ['...kkkk...','..kkkkkk..','..kksssk..','...kssk...','..ooooo...','.occccoco.','.occhhcco.','.occhhcco.','.occcbbco.','..occbbco.','..occcco..','..cc..cc..','..ll..ll..','.lll..lll.','.bb....bb.'];
const heroPalette = { k:C.black, s:C.skin, o:C.black, c:C.coat0, h:C.coat2, b:C.gold1, l:C.black };

function drawSky() {
  const gradient = ctx.createLinearGradient(0,0,0,VIEW_H);
  gradient.addColorStop(0,C.skyTop);
  gradient.addColorStop(.55,C.skyMid);
  gradient.addColorStop(1,C.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,VIEW_W,VIEW_H);

  for (let i=0;i<28;i++) {
    const x=(i*51-Math.floor(cameraX*.04))%(VIEW_W+70)-35;
    const y=14+(i*23)%68;
    rect(x,y,18+(i%5)*9,1,i%2?C.dustA:C.dustB);
  }

  // Big empty upper field with a broken station roof line, matching the sketch composition.
  const roofY = 118;
  let x = -20 - Math.floor(cameraX*.12)%90;
  while (x < VIEW_W + 40) {
    line(x, roofY + (x%2), x+44, roofY+2, C.gold0);
    line(x+44, roofY+2, x+72, roofY+1, C.bronze2);
    if ((x/90|0)%2===0) { line(x+72, roofY+1, x+74, roofY+8, C.gold1); line(x+74, roofY+8, x+76, roofY+2, C.black); }
    x += 90;
  }
  for (let i=0;i<6;i++) rect((i*77-Math.floor(cameraX*.08))%(VIEW_W+30)-15, roofY+12+(i%3)*7, 1, 9, C.bronze2);
}

function drawLongIthacaTrain() {
  const trainY = 135;
  const trainH = 42;
  rect(0, trainY-5, VIEW_W, trainH+13, 'rgba(0,0,0,.45)');
  rect(0, trainY-2, VIEW_W, 2, C.black);
  rect(0, trainY, VIEW_W, 3, C.gold0);
  rect(0, trainY+trainH, VIEW_W, 3, C.black);

  const offset = Math.floor(cameraX * .62) % 156;
  for (let x = -offset - 156; x < VIEW_W + 180; x += 156) {
    noise(x, trainY+3, 152, trainH-2, '#2a1a0f', '#5b3b20', 6);
    rect(x+2, trainY+6, 148, 1, C.gold0);
    rect(x+2, trainY+trainH-9, 148, 1, C.gold0);
    rect(x+150, trainY, 4, trainH+3, C.black);
    rect(x+145, trainY+2, 2, trainH, C.bronze2);

    // passenger door / window block
    rect(x+18, trainY+13, 19, 25, C.black);
    rect(x+21, trainY+16, 13, 9, C.paper);
    rect(x+24, trainY+18, 7, 5, '#5a3920');
    text('객', x+24, trainY+34, C.gold2, 8);

    // central large compartment
    rect(x+54, trainY+12, 48, 2, C.gold0);
    rect(x+57, trainY+20, 36, 1, C.bronze2);
    text('화', x+72, trainY+32, C.gold1, 8);

    // small inspection/connection door
    rect(x+116, trainY+13, 17, 25, C.black);
    rect(x+119, trainY+16, 11, 9, '#47301b');
    text('검', x+120, trainY+34, C.gold2, 8);
  }

  text('ITHACA RETURN LINE', 14 - offset, trainY+10, C.gold1, 6);
  text('ITHACA RETURN LINE', 170 - offset, trainY+10, C.gold1, 6);
}

function drawPlatform() {
  noise(0,GROUND_Y,VIEW_W,VIEW_H-GROUND_Y,'#1b1209','#3b2a18',6);
  rect(0,GROUND_Y,VIEW_W,3,C.gold1);
  rect(0,GROUND_Y+2,VIEW_W,1,C.gold2);
  rect(0,GROUND_Y+17,VIEW_W,3,C.black);
  const off=Math.floor(cameraX*.95)%32;
  for(let x=-off;x<VIEW_W;x+=32){ rect(x,GROUND_Y+6,24,1,C.bronze2); rect(x+9,GROUND_Y+13,18,1,'#4a321c'); rect(x+5,GROUND_Y+3,3,1,C.gold2); rect(x+28,GROUND_Y+4,3,10,'#100b07'); }
  const railY=GROUND_Y+24; rect(0,railY,VIEW_W,2,C.gold0); rect(0,railY+10,VIEW_W,2,C.gold0);
  for(let x=-Math.floor(cameraX*1.15)%22;x<VIEW_W;x+=22){ rect(x,railY+1,4,12,C.railDark); rect(x+1,railY+2,1,9,C.bronze2); }
}

function drawForegroundTrainDetails() {
  // Fixed foreground details on top of the long train body, following the user's sketch: poster, doors, cargo and checkpoint.
  const visible = wx => screenX(wx)>-120 && screenX(wx)<VIEW_W+120;
  if (visible(170)) drawPoster(screenX(145), 139);
  if (visible(390)) drawNameColumn(screenX(370), 137, '귀환\n명단');
  if (visible(890)) drawCargoMark(screenX(840), 141);
  if (visible(1510)) drawNameColumn(screenX(1490), 137, '검표\n기록');
  if (visible(2020)) drawCheckpoint(screenX(2020), 127);
}

function drawPoster(x,y){ rect(x-2,y-2,28,35,C.black); noise(x,y,24,31,C.paper,C.paperLight,5); rect(x+6,y+5,12,11,'#6b3326'); rect(x+8,y+3,8,4,'#2c1b14'); rect(x+5,y+20,15,2,'#332217'); rect(x+6,y+25,16,2,'#332217'); rect(x+17,y+27,6,5,C.red); }
function drawNameColumn(x,y,label){ rect(x-2,y-2,22,39,C.black); noise(x,y,18,35,'#3a2515','#694621',5); const parts=label.split('\n'); text(parts[0],x+3,y+13,C.gold2,6); text(parts[1],x+3,y+25,C.gold2,6); rect(x+2,y+30,14,2,C.bronze2); }
function drawCargoMark(x,y){ rect(x-3,y+2,62,30,C.black); noise(x,y,56,28,'#422414','#7e4f2d',5); rect(x+10,y+9,32,2,C.gold0); rect(x+15,y+17,25,2,C.gold0); text('화',x+25,y+24,C.gold2,8); }
function drawCheckpoint(x,y){ rect(x-4,y+4,74,52,C.black); noise(x,y+8,66,44,'#3a2512','#6c4723',5); rect(x+5,y+16,56,3,C.gold1); text('검문',x+18,y+36,C.gold2,11); line(x+60,y+6,x+91,y+32,C.gold1); line(x+91,y+32,x+109,y+32,C.bronze2); line(x+63,y+7,x+92,y+48,C.black); }
function drawDebris(x,y){ rect(x,y+14,46,6,C.black); rect(x+4,y+10,15,5,C.rustDark); rect(x+20,y+7,20,4,C.bronze0); rect(x+36,y+4,4,12,C.brassDark); }

function drawNpc(x,y,type){ const palette={...heroPalette}; palette.c=type===0?'#2c2418':type===1?'#201914':'#17120e'; palette.h=type===0?'#8a6b36':type===1?'#5e4930':'#a4823d'; palette.b=type===2?C.gold2:C.gold1; sprite(npcSprite,palette,x-11,y,NPC_SCALE,false); if(type===0) rect(x+11,y+11,8,16,C.paper); if(type===1) rect(x+9,y+30,12,8,'#6b4d31'); if(type===2) rect(x+9,y+18,18,4,C.gold2); }
function drawGlyph(x,y,active){ rect(x-(active?18:11),y-1,active?36:22,active?17:12,C.black); rect(x-(active?17:10),y,active?34:20,active?15:10,active?C.gold1:'#4a3520'); rect(x-(active?15:8),y+2,active?30:16,active?11:6,active?'#171008':'#120d08'); text(active?'E':'...',x-(active?3:5),y+(active?11:8),active?C.gold2:'#a78b4a',active?8:5); }
function drawHero(){ const moving=input.left||input.right; const frame=moving?(Math.floor(currentTime/110)%2?heroRunA:heroRunB):heroIdle; const heroHeight=frame.length*HERO_SCALE; const hx=screenX(playerX)-16; const hy=GROUND_Y-heroHeight-Math.round(playerY); rect(hx-4,GROUND_Y-3,36,4,'rgba(0,0,0,.70)'); rect(hx-3,hy-3,38,heroHeight+6,'rgba(215,179,93,.10)'); sprite(frame,heroPalette,hx,hy,HERO_SCALE,facing<0); rect(hx+(facing<0?3:27),hy+25,6,2,C.redHi); }
function drawRainAndScanlines(){ const phase=Math.floor(currentTime/45); for(let i=0;i<36;i++){ const x=(i*43+phase*2)%VIEW_W; const y=(i*19+phase*6)%VIEW_H; rect(x,y,1,4,'rgba(215,179,93,.13)'); } for(let y=0;y<VIEW_H;y+=2) rect(0,y,VIEW_W,1,'rgba(0,0,0,.08)'); }

function drawScene(){
  cameraX=Math.max(0,Math.min(WORLD_W-VIEW_W,playerX-170));
  drawSky();
  drawLongIthacaTrain();
  drawForegroundTrainDetails();
  drawPlatform();
  if(screenX(760)>-100&&screenX(760)<VIEW_W+100)drawDebris(screenX(740),158);
  if(screenX(1220)>-100&&screenX(1220)<VIEW_W+100)drawDebris(screenX(1190),158);
  entities.forEach(e=>{ const x=screenX(e.x); if(x<-80||x>VIEW_W+80)return; if(e.kind==='npc'){ const type=e.id==='survivor'?1:e.id==='inspector'?2:0; drawNpc(x,GROUND_Y-npcSprite.length*NPC_SCALE,type); } });
  // Player is intentionally rendered after train, doors, objects, NPCs and checkpoint so he is always in front.
  drawHero();
  entities.forEach(e=>{ const x=screenX(e.x); if(x<-80||x>VIEW_W+80)return; drawGlyph(x,GROUND_Y-67,near&&near.id===e.id); });
  drawRainAndScanlines();
}

function update(now){ const dt=Math.min((now-previousTime)/1000,.033); previousTime=now; currentTime=now; const dir=Number(input.right)-Number(input.left); if(dir!==0)facing=dir; playerX=Math.max(48,Math.min(WORLD_W-70,playerX+dir*MOVE_SPEED*dt)); if(input.jumpQueued&&playerY===0) velocityY=JUMP_SPEED; input.jumpQueued=false; if(playerY>0||velocityY!==0){ playerY+=velocityY*dt; velocityY-=GRAVITY*dt; if(playerY<0){playerY=0; velocityY=0;} } near=entities.find(e=>Math.abs(e.x-playerX)<58)||null; hint.textContent=near?'E / 터치: '+near.title:'A/D 이동 · Space 점프 · E 상호작용 · I 신분철'; drawScene(); requestAnimationFrame(update); }
function show(title,body,extra=''){ panel.innerHTML='<h1>'+title+'</h1><p>'+body+'</p>'+extra+'<button onclick="hide()">닫기</button>'; modal.style.display='grid'; }
function hide(){ modal.style.display='none'; }
function describeName(identity){ if(identity==='귀환병')return '공감, 낮은 위험. 민간인 대화에 적합.'; if(identity==='라에르테스의 아들')return '이타카 왕가 혈통명. 귀향 자격에 적합.'; if(identity==='도시를 함락한 자')return '강한 전공명. 생존자에게 반감을 산다.'; return '분석적이고 우회적인 이름.'; }
function openNames(){ const html=['귀환병','라에르테스의 아들','도시를 함락한 자','지략이 많은 자'].map(identity=>'<button class="choice" onclick="equippedName=\''+identity+'\';nameNow.textContent=equippedName;openNames()"><b>['+identity+']</b><br>'+describeName(identity)+'</button>').join('')+'<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>'; show('신분철',html,''); }
function openTicket(){ show('귀향표','<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">'+(inspected?'APPROVED':'VALID')+'</span></div>'); }
function talk(id){ if(id==='prop')show('선전관','장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.','<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>['+equippedName+']</b> 나는 집으로 간다.</button>'); if(id==='survivor')show('트로이 생존자','당신이 그 열차를 들여보낸 사람이군요.','<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>['+equippedName+']</b> 전쟁은 끝났습니다.</button>'); if(id==='inspector'){ inspected=true; show('검표 결과','<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검문관: 기록은 사람보다 오래 기다립니다.'); } }
function interact(){ if(!near)return; if(near.id==='gate'){ if(!inspected){show('검표 필요','검문 게이트를 지나려면 먼저 검문관에게 귀향표와 탑승명을 제시해야 한다.'); return;} cut.style.display='grid'; cut.innerHTML='<article><h1>1장. 트로이 폐허역</h1><p>이타카행 열차가 긴 갈색 그림자처럼 플랫폼을 메운다. 전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>'; return; } if(objectText[near.id])show(objectText[near.id][0],objectText[near.id][1]); else talk(near.id); }
window.onkeydown=e=>{ const key=e.key.toLowerCase(); if([' ','arrowleft','arrowright','a','d','e','i'].includes(key))e.preventDefault(); if(e.repeat)return; if(key==='a'||key==='arrowleft')input.left=true; if(key==='d'||key==='arrowright')input.right=true; if(key===' ')input.jumpQueued=true; if(key==='e')interact(); if(key==='i')openNames(); };
window.onkeyup=e=>{ const key=e.key.toLowerCase(); if(key==='a'||key==='arrowleft')input.left=false; if(key==='d'||key==='arrowright')input.right=false; };
function bindHold(button,property){ button.onpointerdown=e=>{e.preventDefault(); input[property]=true; button.setPointerCapture?.(e.pointerId);}; button.onpointerup=e=>{e.preventDefault(); input[property]=false;}; button.onpointercancel=()=>{input[property]=false;}; button.onpointerleave=()=>{input[property]=false;}; }
bindHold(leftBtn,'left'); bindHold(rightBtn,'right'); jumpBtn.onclick=e=>{e.preventDefault(); input.jumpQueued=true;}; actBtn.onclick=interact; nameBtn.onclick=openNames; ticketBtn.onclick=openTicket; requestAnimationFrame(update);
