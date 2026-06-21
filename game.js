const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('modal');
const panel = document.getElementById('panel');
const hint = document.getElementById('hint');
const cut = document.getElementById('cut');
const nameNow = document.getElementById('nameNow');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const actBtn = document.getElementById('actBtn');
const nameBtn = document.getElementById('nameBtn');
const ticketBtn = document.getElementById('ticketBtn');

const VIEW_W = 768;
const VIEW_H = 432;
const GROUND_Y = 356;
const WORLD_W = 4800;
const MOVE_SPEED = 350;
const JUMP_SPEED = 790;
const GRAVITY = 2240;

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

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const assets = {
  station: loadImage('./assets/backgrounds/station_far.svg'),
  train: loadImage('./assets/backgrounds/train_long.svg'),
  platform: loadImage('./assets/tiles/platform.svg'),
  heroIdle: loadImage('./assets/characters/odysseus_idle.svg'),
  heroIdleB: loadImage('./assets/characters/odysseus_idle_b.svg'),
  heroWalkA: loadImage('./assets/characters/odysseus_walk_a.svg'),
  heroWalkB: loadImage('./assets/characters/odysseus_walk_b.svg'),
  heroWalkC: loadImage('./assets/characters/odysseus_walk_c.svg'),
  heroWalkD: loadImage('./assets/characters/odysseus_walk_d.svg'),
  heroJump: loadImage('./assets/characters/odysseus_jump.svg'),
  heroFall: loadImage('./assets/characters/odysseus_fall.svg'),
  prop: loadImage('./assets/characters/npc_propagandist.svg'),
  propB: loadImage('./assets/characters/npc_propagandist_idle_b.svg'),
  survivor: loadImage('./assets/characters/npc_survivor.svg'),
  survivorB: loadImage('./assets/characters/npc_survivor_idle_b.svg'),
  inspector: loadImage('./assets/characters/npc_inspector.svg'),
  inspectorB: loadImage('./assets/characters/npc_inspector_idle_b.svg'),
  poster: loadImage('./assets/objects/poster.svg'),
  listBoard: loadImage('./assets/objects/list_board.svg'),
  cargo: loadImage('./assets/objects/cargo_mark.svg'),
  checkpoint: loadImage('./assets/objects/checkpoint.svg')
};

const heroIdleFrames = [assets.heroIdle, assets.heroIdleB];
const heroWalkFrames = [assets.heroWalkA, assets.heroWalkC, assets.heroWalkB, assets.heroWalkD];

const C = {
  black: '#050403',
  void: '#101013',
  gold0: '#9d7a3a',
  gold1: '#d7b35d',
  gold2: '#f0d281',
  paper: '#d1b875',
  paperLight: '#ead591',
  red: '#9f3426',
  redHi: '#dd5b3c',
  bronze0: '#302114',
  bronze1: '#5a3d21',
  bronze2: '#8d642f',
  steamA: 'rgba(210,198,168,.32)',
  steamB: 'rgba(240,220,180,.18)',
  shadow: 'rgba(0,0,0,.58)'
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

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function text(value, x, y, color = C.paper, size = 10) {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.fillText(value, Math.round(x), Math.round(y));
}
function line(x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + .5, Math.round(y1) + .5);
  ctx.lineTo(Math.round(x2) + .5, Math.round(y2) + .5);
  ctx.stroke();
}
function screenX(worldX, parallax = 1) {
  return Math.round(worldX - cameraX * parallax);
}
function drawImage(image, x, y, w, h, flip = false) {
  if (!image.complete || image.naturalWidth === 0) return false;
  ctx.save();
  if (flip) {
    ctx.scale(-1, 1);
    ctx.drawImage(image, -Math.round(x + w), Math.round(y), Math.round(w), Math.round(h));
  } else {
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  ctx.restore();
  return true;
}
function drawTiled(image, x, y, tileW, tileH, areaW) {
  if (!image.complete || image.naturalWidth === 0) return false;
  for (let px = x; px < areaW; px += tileW) ctx.drawImage(image, Math.round(px), Math.round(y), tileW, tileH);
  return true;
}

function drawFallbackStation() {
  rect(0, 0, VIEW_W, VIEW_H, '#171719');
  rect(0, 0, VIEW_W, 120, '#2b3134');
  rect(0, 214, VIEW_W, 8, '#11100e');
  for (let x = -80; x < VIEW_W + 160; x += 160) {
    line(x, 230, x + 92, 58, '#5c564c');
    line(x + 92, 58, x + 184, 230, '#5c564c');
    rect(x + 88, 204, 12, 162, '#070605');
  }
}

function drawBackground() {
  rect(0, 0, VIEW_W, VIEW_H, C.void);
  const offset = -Math.floor(cameraX * 0.12) % 768;
  if (!drawTiled(assets.station, offset - 768, 0, 1536, 432, VIEW_W + 1536)) drawFallbackStation();
  rect(0, 0, VIEW_W, VIEW_H, 'rgba(0,0,0,.08)');
}

function drawSteamPuff(x, y, size, color) {
  rect(x, y + size * 0.35, size, size * 0.45, color);
  rect(x + size * 0.2, y, size * 0.62, size * 0.7, color);
  rect(x + size * 0.55, y + size * 0.22, size * 0.55, size * 0.5, color);
}
function drawTrainSteam() {
  const period = 4300;
  const active = 1650;
  const local = currentTime % period;
  if (local > active) return;
  const baseT = local / active;
  const offset = -Math.floor(cameraX * 0.62) % 936;
  for (let base = offset - 936; base < VIEW_W + 936; base += 936) {
    const vents = [base + 82, base + 402, base + 706];
    vents.forEach((ventX, ventIndex) => {
      for (let i = 0; i < 5; i++) {
        const t = Math.max(0, baseT - i * 0.12 - ventIndex * 0.04);
        if (t <= 0 || t > 1) continue;
        const drift = t * (36 + i * 7);
        const rise = t * (64 + i * 10);
        const size = 8 + t * 18 + i * 2;
        const color = i % 2 ? C.steamA : C.steamB;
        drawSteamPuff(ventX - drift + i * 7, 270 - rise - i * 4, size, color);
      }
    });
  }
}
function drawTrain() {
  const y = 258;
  const offset = -Math.floor(cameraX * 0.62) % 936;
  if (!drawTiled(assets.train, offset - 936, y, 936, 110, VIEW_W + 936)) {
    rect(0, y + 12, VIEW_W, 84, '#332012');
    rect(0, y + 18, VIEW_W, 2, C.gold0);
    rect(0, y + 78, VIEW_W, 2, C.gold0);
  }
  drawTrainSteam();
}

function drawPlatform() {
  const offset = -Math.floor(cameraX * 0.95) % 768;
  if (!drawTiled(assets.platform, offset - 768, GROUND_Y, 768, 90, VIEW_W + 768)) {
    rect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, '#21170f');
    rect(0, GROUND_Y, VIEW_W, 5, C.gold1);
    rect(0, GROUND_Y + 48, VIEW_W, 4, C.gold0);
    rect(0, GROUND_Y + 68, VIEW_W, 4, C.gold0);
  }
}

function drawFallbackPoster(x, y) {
  rect(x, y, 56, 70, C.black);
  rect(x + 5, y + 5, 46, 60, C.paper);
  rect(x + 18, y + 12, 20, 22, '#6b3326');
  rect(x + 36, y + 53, 12, 10, C.red);
}
function drawFallbackList(x, y) {
  rect(x, y, 48, 82, C.black);
  rect(x + 5, y + 5, 38, 72, '#3a2515');
  rect(x + 12, y + 16, 24, 4, C.gold1);
  rect(x + 12, y + 28, 20, 3, C.gold0);
  rect(x + 12, y + 50, 22, 3, C.gold0);
}
function drawFallbackCargo(x, y) {
  rect(x, y + 8, 132, 60, C.black);
  rect(x + 7, y + 4, 116, 58, '#4c2a16');
  rect(x + 26, y + 23, 68, 4, C.gold0);
  rect(x + 37, y + 38, 54, 4, C.gold1);
}
function drawFallbackCheckpoint(x, y) {
  rect(x, y + 14, 146, 104, C.black);
  rect(x + 8, y + 22, 130, 88, '#463019');
  rect(x + 16, y + 38, 110, 6, C.gold1);
  line(x + 132, y + 18, x + 184, y + 68, C.gold1);
}
function drawForegroundObjects() {
  const visible = wx => screenX(wx) > -240 && screenX(wx) < VIEW_W + 240;
  if (visible(340)) {
    const x = screenX(290), y = 278;
    if (!drawImage(assets.poster, x, y, 56, 70)) drawFallbackPoster(x, y);
  }
  if (visible(780)) {
    const x = screenX(740), y = 270;
    if (!drawImage(assets.listBoard, x, y, 48, 82)) drawFallbackList(x, y);
  }
  if (visible(1780)) {
    const x = screenX(1680), y = 276;
    if (!drawImage(assets.cargo, x, y, 132, 72)) drawFallbackCargo(x, y);
  }
  if (visible(3020)) {
    const x = screenX(2980), y = 270;
    if (!drawImage(assets.listBoard, x, y, 48, 82)) drawFallbackList(x, y);
  }
  if (visible(4040)) {
    const x = screenX(4040), y = 244;
    if (!drawImage(assets.checkpoint, x, y, 184, 118)) drawFallbackCheckpoint(x, y);
  }
}

function drawNpc(entity) {
  const x = screenX(entity.x);
  if (x < -160 || x > VIEW_W + 160) return;
  const frame = Math.floor((currentTime + entity.x) / 720) % 2;
  const bob = frame ? 1 : 0;
  const y = GROUND_Y - 58 - bob;
  let image = frame ? assets.propB : assets.prop;
  let w = 42;
  let h = 58;
  if (entity.id === 'survivor') image = frame ? assets.survivorB : assets.survivor;
  if (entity.id === 'inspector') image = frame ? assets.inspectorB : assets.inspector;
  rect(x - 20, GROUND_Y - 3, 44, 5, 'rgba(0,0,0,.55)');
  drawImage(image, x - 21, y, w, h);
}
function drawHero() {
  const moving = input.left || input.right;
  let image;
  if (playerY > 2) {
    image = velocityY > 0 ? assets.heroJump : assets.heroFall;
  } else if (moving) {
    image = heroWalkFrames[Math.floor(currentTime / 92) % heroWalkFrames.length];
  } else {
    image = heroIdleFrames[Math.floor(currentTime / 580) % heroIdleFrames.length];
  }
  const w = 40;
  const h = 56;
  const x = screenX(playerX) - 20;
  const y = GROUND_Y - h - Math.round(playerY);
  rect(x - 4, GROUND_Y - 3, 46, 5, 'rgba(0,0,0,.72)');
  rect(x - 3, y - 3, 46, h + 6, 'rgba(240,210,129,.06)');
  if (!drawImage(image, x, y, w, h, facing < 0)) {
    rect(x + 11, y + 2, 18, 14, C.black);
    rect(x + 8, y + 18, 24, 28, '#12100d');
    rect(x + 17, y + 28, 7, 12, C.gold1);
    rect(x + 13, y + 46, 6, 9, C.black);
    rect(x + 25, y + 46, 6, 9, C.black);
  }
}
function drawGlyph(x, y, active) {
  rect(x - (active ? 34 : 20), y - 2, active ? 68 : 40, active ? 28 : 20, C.black);
  rect(x - (active ? 32 : 18), y, active ? 64 : 36, active ? 26 : 18, active ? C.gold1 : '#4a3520');
  rect(x - (active ? 28 : 14), y + 4, active ? 56 : 28, active ? 18 : 10, active ? '#171008' : '#120d08');
  text(active ? 'E' : '...', x - (active ? 6 : 10), y + (active ? 21 : 15), active ? C.gold2 : '#a78b4a', active ? 14 : 10);
}
function drawAtmosphere() {
  const phase = Math.floor(currentTime / 45);
  for (let i = 0; i < 44; i++) {
    const x = (i * 87 + phase * 3) % VIEW_W;
    const y = (i * 37 + phase * 7) % VIEW_H;
    rect(x, y, 1, 5, 'rgba(215,179,93,.07)');
  }
  for (let y = 0; y < VIEW_H; y += 3) rect(0, y, VIEW_W, 1, 'rgba(0,0,0,.04)');
}

function drawScene() {
  cameraX = Math.max(0, Math.min(WORLD_W - VIEW_W, playerX - 340));
  drawBackground();
  drawTrain();
  drawForegroundObjects();
  drawPlatform();
  entities.forEach(entity => { if (entity.kind === 'npc') drawNpc(entity); });
  drawHero();
  entities.forEach(entity => {
    const x = screenX(entity.x);
    if (x < -160 || x > VIEW_W + 160) return;
    drawGlyph(x, GROUND_Y - 115, near && near.id === entity.id);
  });
  drawAtmosphere();
}

function update(now) {
  const dt = Math.min((now - previousTime) / 1000, .033);
  previousTime = now;
  currentTime = now;
  const dir = Number(input.right) - Number(input.left);
  if (dir !== 0) facing = dir;
  playerX = Math.max(96, Math.min(WORLD_W - 140, playerX + dir * MOVE_SPEED * dt));
  if (input.jumpQueued && playerY === 0) velocityY = JUMP_SPEED;
  input.jumpQueued = false;
  if (playerY > 0 || velocityY !== 0) {
    playerY += velocityY * dt;
    velocityY -= GRAVITY * dt;
    if (playerY < 0) { playerY = 0; velocityY = 0; }
  }
  near = entities.find(entity => Math.abs(entity.x - playerX) < 95) || null;
  hint.textContent = near ? 'E / 터치: ' + near.title : 'A/D 이동 · Space 점프 · E 상호작용 · I 신분철';
  drawScene();
  requestAnimationFrame(update);
}

function show(title, body, extra = '') {
  panel.innerHTML = '<h1>' + title + '</h1><p>' + body + '</p>' + extra + '<button onclick="hide()">닫기</button>';
  modal.style.display = 'grid';
}
function hide() { modal.style.display = 'none'; }
function describeName(identity) {
  if (identity === '귀환병') return '공감, 낮은 위험. 민간인 대화에 적합.';
  if (identity === '라에르테스의 아들') return '이타카 왕가 혈통명. 귀향 자격에 적합.';
  if (identity === '도시를 함락한 자') return '강한 전공명. 생존자에게 반감을 산다.';
  return '분석적이고 우회적인 이름.';
}
function openNames() {
  const html = ['귀환병','라에르테스의 아들','도시를 함락한 자','지략이 많은 자'].map(identity => '<button class="choice" onclick="setName(\'' + identity + '\')"><b>[' + identity + ']</b><br>' + describeName(identity) + '</button>').join('') + '<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>';
  show('신분철', html, '');
}
function setName(identity) {
  equippedName = identity;
  nameNow.textContent = equippedName;
  openNames();
}
function openTicket() {
  show('귀향표', '<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">' + (inspected ? 'APPROVED' : 'VALID') + '</span></div>');
}
function talk(id) {
  if (id === 'prop') show('선전관', '장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.', '<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>[' + equippedName + ']</b> 나는 집으로 간다.</button>');
  if (id === 'survivor') show('트로이 생존자', '당신이 그 열차를 들여보낸 사람이군요.', '<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>[' + equippedName + ']</b> 전쟁은 끝났습니다.</button>');
  if (id === 'inspector') {
    inspected = true;
    show('검표 결과', '<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검문관: 기록은 사람보다 오래 기다립니다.');
  }
}
function interact() {
  if (!near) return;
  if (near.id === 'gate') {
    if (!inspected) { show('검표 필요', '검문 게이트를 지나려면 먼저 검문관에게 귀향표와 탑승명을 제시해야 한다.'); return; }
    cut.style.display = 'grid';
    cut.innerHTML = '<article><h1>1장. 트로이 폐허역</h1><p>갈색 객차들이 플랫폼을 가득 메운다. 전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>';
    return;
  }
  if (objectText[near.id]) show(objectText[near.id][0], objectText[near.id][1]);
  else talk(near.id);
}

window.hide = hide;
window.openNames = openNames;
window.setName = setName;
window.show = show;

window.onkeydown = event => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'a', 'd', 'e', 'i'].includes(key)) event.preventDefault();
  if (event.repeat) return;
  if (key === 'a' || key === 'arrowleft') input.left = true;
  if (key === 'd' || key === 'arrowright') input.right = true;
  if (key === ' ') input.jumpQueued = true;
  if (key === 'e') interact();
  if (key === 'i') openNames();
};
window.onkeyup = event => {
  const key = event.key.toLowerCase();
  if (key === 'a' || key === 'arrowleft') input.left = false;
  if (key === 'd' || key === 'arrowright') input.right = false;
};
function bindHold(button, property) {
  button.onpointerdown = event => { event.preventDefault(); input[property] = true; button.setPointerCapture?.(event.pointerId); };
  button.onpointerup = event => { event.preventDefault(); input[property] = false; };
  button.onpointercancel = () => { input[property] = false; };
  button.onpointerleave = () => { input[property] = false; };
}
bindHold(leftBtn, 'left');
bindHold(rightBtn, 'right');
jumpBtn.onclick = event => { event.preventDefault(); input.jumpQueued = true; };
actBtn.onclick = interact;
nameBtn.onclick = openNames;
ticketBtn.onclick = openTicket;

requestAnimationFrame(update);
