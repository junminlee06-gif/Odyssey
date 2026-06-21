const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('modal');
const panel = document.getElementById('panel');
const hint = document.getElementById('hint');
const cut = document.getElementById('cut');
const nameNow = document.getElementById('nameNow');

const VIEW_W = 384;
const VIEW_H = 216;
const GROUND_Y = 174;
const WORLD_W = 2380;
const MOVE_SPEED = 178;
const JUMP_SPEED = 405;
const GRAVITY = 1120;

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

const input = {
  left: false,
  right: false,
  jumpQueued: false
};

const C = {
  black: '#020303',
  void: '#050607',
  skyTop: '#17283a',
  skyMid: '#0d1418',
  skyBottom: '#050505',
  cloudA: '#263d48',
  cloudB: '#1b2e38',
  backWall: '#0c1719',
  backWallDot: '#1a3034',
  steelDark: '#111d1f',
  steel: '#2b4242',
  steelHi: '#62817a',
  floor: '#25211b',
  floorDot: '#4e3f2b',
  railDark: '#201913',
  brass: '#d4b45f',
  brassDark: '#826d3c',
  cyan: '#78fff3',
  cyanDark: '#1d8c89',
  red: '#ff3b37',
  redDark: '#8b1d1b',
  paper: '#d4bd7e',
  paperLight: '#ead993',
  rust: '#8b5434',
  rustDark: '#351914',
  skin: '#a87b55',
  coat: '#172629',
  coatMid: '#2e4444',
  coatHi: '#5f7b73',
  smoke: '#43545a',
  glass: '#4c7277'
};

const entities = [
  { id: 'poster', title: '영웅 포스터', x: 160, kind: 'object' },
  { id: 'list', title: '귀환병 명단', x: 360, kind: 'object' },
  { id: 'prop', title: '선전관', x: 610, kind: 'npc' },
  { id: 'wreck', title: '불탄 목마열차 잔해', x: 900, kind: 'object' },
  { id: 'survivor', title: '트로이 생존자', x: 1180, kind: 'npc' },
  { id: 'sign', title: '이타카행 전광판', x: 1460, kind: 'object' },
  { id: 'inspector', title: '검표관', x: 1700, kind: 'npc' },
  { id: 'gate', title: '17번 승강장 게이트', x: 1960, kind: 'gate' }
];

const objectText = {
  poster: ['영웅 포스터', '“트로이를 함락한 자, 귀환하다.”\n\n포스터 속 얼굴은 늘 나보다 먼저 고향에 도착한다.'],
  list: ['귀환병 명단', '같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.'],
  wreck: ['불탄 목마열차 잔해', '“목마열차 작전의 잔해.”\n\n성문은 열리지 않았다. 그래서 우리는 열차를 들여보냈다.'],
  sign: ['이타카행 전광판', '이타카행 연결편 접수 중.\n\n집이라는 단어가 아직 선명하다.']
};

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function text(value, x, y, color = C.paper, size = 5) {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.fillText(value, Math.round(x), Math.round(y));
}

function line(x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function screenX(worldX, parallax = 1) {
  return Math.round(worldX - cameraX * parallax);
}

function noise(x, y, w, h, base, dot, step = 7) {
  rect(x, y, w, h, base);
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = (yy % 4); xx < w; xx += step) rect(x + xx, y + yy, 1, 1, dot);
  }
}

function sprite(matrix, palette, x, y, scale, flip) {
  matrix.forEach((row, yy) => {
    [...row].forEach((ch, xx) => {
      if (ch === '.' || !palette[ch]) return;
      const dx = flip ? row.length - 1 - xx : xx;
      rect(x + dx * scale, y + yy * scale, scale, scale, palette[ch]);
    });
  });
}

const heroIdle = [
  '.....kkkkk.....',
  '....kkkkkkk....',
  '....kkssssk....',
  '.....ksssk.....',
  '......sss......',
  '....ooooooo....',
  '...occccccco...',
  '..occcchhcco...',
  '..occhhhhcco...',
  '..occcbbccco...',
  '..occcbbccco...',
  '...occbbcco....',
  '...occcccco....',
  '...occccco.....',
  '....cc..cc.....',
  '....cc..cc.....',
  '....ll..ll.....',
  '...lll..lll....',
  '...bb....bb....'
];

const heroRunA = [
  '.....kkkkk.....',
  '....kkkkkkk....',
  '....kkssssk....',
  '.....ksssk.....',
  '......sss......',
  '....ooooooo....',
  '...occccccco...',
  '..occcchhcco...',
  '..occhhhhcco...',
  '..occcbbccco...',
  '..occcbbccco...',
  '...occbbcco....',
  '...occcccco....',
  '..occccco......',
  '..ccc...cc.....',
  '..cc....ccc....',
  '.lll.....ll....',
  'lll......lll...',
  'bb........bbb..'
];

const heroRunB = [
  '.....kkkkk.....',
  '....kkkkkkk....',
  '....kkssssk....',
  '.....ksssk.....',
  '......sss......',
  '....ooooooo....',
  '...occccccco...',
  '..occcchhcco...',
  '..occhhhhcco...',
  '..occcbbccco...',
  '..occcbbccco...',
  '...occbbcco....',
  '...occcccco....',
  '....occccco....',
  '....cc...ccc...',
  '...ccc....cc...',
  '...ll.....lll..',
  '..lll......lll.',
  '.bbb........bb.'
];

const npcSprite = [
  '...kkkk...',
  '..kkkkkk..',
  '..kksssk..',
  '...kssk...',
  '..ooooo...',
  '.occccoco.',
  '.occhhcco.',
  '.occhhcco.',
  '.occcbbco.',
  '..occbbco.',
  '..occcco..',
  '..cc..cc..',
  '..ll..ll..',
  '.lll..lll.',
  '.bb....bb.'
];

const heroPalette = {
  k: C.black,
  s: C.skin,
  o: C.black,
  c: C.coat,
  h: C.coatHi,
  b: C.cyan,
  l: C.black
};

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, C.skyTop);
  gradient.addColorStop(0.52, C.skyMid);
  gradient.addColorStop(1, C.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (let i = 0; i < 44; i++) {
    const x = (i * 39 - Math.floor(cameraX * 0.07)) % (VIEW_W + 80) - 40;
    const y = 18 + (i * 17) % 62;
    rect(x, y, 20 + (i % 5) * 7, 2, i % 2 ? C.cloudA : C.cloudB);
  }

  for (let x = -80 - Math.floor(cameraX * 0.16) % 112; x < VIEW_W + 100; x += 112) {
    noise(x, 80, 64, 75, C.backWall, C.backWallDot, 6);
    rect(x + 8, 67, 47, 13, '#17282d');
    rect(x + 17, 54, 23, 13, '#0e1c21');
    for (let wy = 95; wy < 143; wy += 12) {
      rect(x + 10, wy, 8, 4, '#2f5155');
      rect(x + 31, wy + 2, 9, 3, '#284347');
      rect(x + 51, wy, 5, 4, '#335a51');
    }
  }
}

function drawBackgroundTrain() {
  const x = screenX(1220, 0.42);
  const y = 92;
  rect(x - 12, y + 26, 290, 58, 'rgba(0,0,0,0.55)');
  noise(x, y + 30, 270, 48, '#182321', '#283933', 8);
  rect(x + 4, y + 35, 260, 5, '#3b4e48');
  rect(x + 12, y + 48, 210, 3, C.cyanDark);
  rect(x + 20, y + 18, 82, 24, C.black);
  rect(x + 26, y + 23, 24, 9, C.glass || '#4c7277');
  rect(x + 58, y + 23, 24, 9, C.glass || '#4c7277');
  text('ITHACA LINE', x + 112, y + 56, C.cyanDark, 6);
  for (let i = 0; i < 8; i++) {
    rect(x + 22 + i * 30, y + 76, 15, 15, C.black);
    rect(x + 26 + i * 30, y + 80, 7, 7, C.brassDark);
  }
  const smoke = Math.floor(currentTime / 180) % 6;
  for (let i = 0; i < 5; i++) rect(x + 86 + i * 10 - smoke * 2, y + 7 - i * 6, 12 + i * 2, 3, C.smoke);
}

function drawStationRoof() {
  const shift = Math.floor(cameraX * 0.3);
  for (let x = -90 - shift % 80; x < VIEW_W + 100; x += 80) {
    line(x, 34, x + 70, 118, '#3c666a');
    line(x + 70, 34, x, 118, '#14272b');
    rect(x + 20, 40, 34, 4, '#5d7775');
    rect(x + 31, 52, 8, 5, '#1c363a');
  }

  rect(0, 107, VIEW_W, 8, '#1b292b');
  rect(0, 113, VIEW_W, 2, '#617267');
  for (let x = -20 - shift % 48; x < VIEW_W + 20; x += 48) {
    rect(x, 102, 5, 75, C.black);
    rect(x + 2, 102, 1, 75, '#64756a');
    rect(x - 8, 118, 21, 3, '#223131');
  }

  const signX = screenX(52, 0.15);
  rect(signX, 123, 124, 14, C.black);
  rect(signX + 4, 125, 116, 10, '#101919');
  text('TROY CENTRAL', signX + 20, 133, C.red, 7);
}

function drawPlatform() {
  noise(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, C.floor, C.floorDot, 6);
  rect(0, GROUND_Y, VIEW_W, 3, C.cyanDark);
  rect(0, GROUND_Y + 2, VIEW_W, 1, C.cyan);
  rect(0, GROUND_Y + 18, VIEW_W, 3, '#11100d');

  const off = Math.floor(cameraX * 0.95) % 32;
  for (let x = -off; x < VIEW_W; x += 32) {
    rect(x, GROUND_Y + 6, 24, 1, '#6a5940');
    rect(x + 9, GROUND_Y + 14, 18, 1, '#423426');
    rect(x + 5, GROUND_Y + 3, 3, 1, C.brass);
  }

  const railY = GROUND_Y + 25;
  rect(0, railY, VIEW_W, 2, C.brass);
  rect(0, railY + 10, VIEW_W, 2, C.brass);
  for (let x = -Math.floor(cameraX * 1.15) % 22; x < VIEW_W; x += 22) {
    rect(x, railY + 1, 4, 12, C.railDark);
    rect(x + 1, railY + 2, 1, 9, C.brassDark);
  }
}

function drawPoster(x, y) {
  rect(x - 2, y - 2, 36, 56, C.black);
  noise(x, y, 32, 51, C.paper, C.paperLight, 5);
  rect(x + 8, y + 9, 16, 15, '#6b3326');
  rect(x + 11, y + 6, 9, 6, '#2c1b14');
  rect(x + 7, y + 29, 19, 2, '#332217');
  rect(x + 6, y + 34, 21, 2, '#332217');
  rect(x + 16, y + 41, 11, 7, C.red);
  rect(x + 22, y + 38, 8, 12, C.redDark);
}

function drawListBoard(x, y) {
  rect(x - 3, y - 3, 78, 70, C.black);
  noise(x, y, 72, 64, '#0f1d1e', '#1d3538', 6);
  rect(x, y, 72, 3, C.cyan);
  text('RETURN LIST', x + 6, y + 14, C.cyan, 5);
  for (let i = 0; i < 7; i++) {
    const yy = y + 21 + i * 6;
    rect(x + 7, yy, 43 + (i % 3) * 7, 1, i === 2 ? C.red : C.brass);
    rect(x + 58, yy - 1, 5, 3, '#3a2218');
  }
}

function drawWreck(x, y) {
  rect(x + 2, y + 28, 116, 32, C.black);
  noise(x + 5, y + 24, 106, 36, C.rustDark, C.rust, 5);
  rect(x + 14, y + 17, 55, 11, '#241712');
  rect(x + 65, y + 2, 14, 25, C.black);
  rect(x + 80, y + 9, 31, 9, C.rustDark);
  rect(x + 15, y + 50, 17, 17, C.black);
  rect(x + 76, y + 50, 17, 17, C.black);
  for (let i = 0; i < 7; i++) rect(x + 12 + i * 13, y + 32 + (i % 2) * 5, 8, 2, C.rust);
  rect(x + 53, y, 8, 10, C.smoke);
  rect(x + 58, y - 7, 12, 4, '#61727a');
}

function drawGate(x, y) {
  rect(x - 40, y + 24, 85, 42, C.black);
  noise(x - 36, y + 28, 77, 34, '#101819', '#1f3434', 5);
  rect(x - 32, y + 34, 68, 3, C.cyan);
  text('PLATFORM 17', x - 24, y + 48, C.cyan, 6);
  rect(x - 25, y + 55, 50, 2, C.red);
}

function drawNpc(x, y, type) {
  const palette = { ...heroPalette };
  palette.c = type === 0 ? '#29493e' : type === 1 ? '#2a302c' : '#101819';
  palette.h = type === 0 ? '#69a08f' : type === 1 ? '#59483b' : '#2d6665';
  palette.b = type === 2 ? C.cyan : C.brass;
  sprite(npcSprite, palette, x - 16, y, 3, false);
  if (type === 0) rect(x + 16, y + 16, 10, 22, C.paper);
  if (type === 1) rect(x + 14, y + 42, 15, 10, '#6b4d31');
  if (type === 2) rect(x + 14, y + 25, 22, 6, C.cyan);
}

function drawGlyph(x, y, active) {
  rect(x - (active ? 18 : 11), y - 1, active ? 36 : 22, active ? 17 : 12, C.black);
  rect(x - (active ? 17 : 10), y, active ? 34 : 20, active ? 15 : 10, active ? C.cyan : '#3a3528');
  rect(x - (active ? 15 : 8), y + 2, active ? 30 : 16, active ? 11 : 6, active ? '#051615' : '#111514');
  text(active ? 'E' : '...', x - (active ? 3 : 5), y + (active ? 11 : 8), active ? C.cyan : '#9a8c65', active ? 8 : 5);
}

function drawHero() {
  const isMoving = input.left || input.right;
  const frame = isMoving ? (Math.floor(currentTime / 110) % 2 ? heroRunA : heroRunB) : heroIdle;
  const x = screenX(playerX) - 22;
  const y = GROUND_Y - 64 - Math.round(playerY);
  rect(x - 5, y - 5, 58, 72, 'rgba(120,255,243,.14)');
  sprite(frame, heroPalette, x, y, 3, facing < 0);
  rect(x + (facing < 0 ? 5 : 38), y + 38, 9, 3, C.red);
}

function drawRainAndScanlines() {
  const phase = Math.floor(currentTime / 45);
  for (let i = 0; i < 54; i++) {
    const x = (i * 37 + phase * 3) % VIEW_W;
    const y = (i * 19 + phase * 7) % VIEW_H;
    rect(x, y, 1, 5, 'rgba(120,255,243,.22)');
  }
  for (let y = 0; y < VIEW_H; y += 2) rect(0, y, VIEW_W, 1, 'rgba(0,0,0,.08)');
}

function drawScene() {
  cameraX = Math.max(0, Math.min(WORLD_W - VIEW_W, playerX - 170));
  drawSky();
  drawBackgroundTrain();
  drawStationRoof();
  drawPlatform();

  const visible = worldX => screenX(worldX) > -150 && screenX(worldX) < VIEW_W + 120;
  if (visible(160)) drawPoster(screenX(140), 105);
  if (visible(360)) drawListBoard(screenX(335), 94);
  if (visible(900)) drawWreck(screenX(835), 114);
  if (visible(1460)) drawListBoard(screenX(1420), 92);
  if (visible(1515)) text('ITHACA', screenX(1515), 67, C.cyan, 8);
  if (visible(1960)) drawGate(screenX(1960), 109);

  entities.forEach(entity => {
    const x = screenX(entity.x);
    if (x < -80 || x > VIEW_W + 80) return;
    if (entity.kind === 'npc') {
      const type = entity.id === 'survivor' ? 1 : entity.id === 'inspector' ? 2 : 0;
      drawNpc(x, GROUND_Y - 64, type);
    }
    drawGlyph(x, GROUND_Y - 76, near && near.id === entity.id);
  });

  drawHero();
  drawRainAndScanlines();
}

function update(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.033);
  previousTime = now;
  currentTime = now;

  const dir = Number(input.right) - Number(input.left);
  if (dir !== 0) facing = dir;
  playerX = Math.max(48, Math.min(WORLD_W - 70, playerX + dir * MOVE_SPEED * dt));

  if (input.jumpQueued && playerY === 0) {
    velocityY = JUMP_SPEED;
  }
  input.jumpQueued = false;

  if (playerY > 0 || velocityY !== 0) {
    playerY += velocityY * dt;
    velocityY -= GRAVITY * dt;
    if (playerY < 0) {
      playerY = 0;
      velocityY = 0;
    }
  }

  near = entities.find(entity => Math.abs(entity.x - playerX) < 58) || null;
  hint.textContent = near ? 'E / 터치: ' + near.title : 'A/D 이동 · Space 점프 · E 상호작용 · I 신분철';
  drawScene();
  requestAnimationFrame(update);
}

function show(title, body, extra = '') {
  panel.innerHTML = '<h1>' + title + '</h1><p>' + body + '</p>' + extra + '<button onclick="hide()">닫기</button>';
  modal.style.display = 'grid';
}

function hide() {
  modal.style.display = 'none';
}

function openNames() {
  const html = ['귀환병', '라에르테스의 아들', '도시를 함락한 자', '지략이 많은 자'].map(identity =>
    '<button class="choice" onclick="equippedName=\'' + identity + '\';nameNow.textContent=equippedName;openNames()"><b>[' + identity + ']</b><br>' + describeName(identity) + '</button>'
  ).join('') + '<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>';
  show('신분철', html, '');
}

function describeName(identity) {
  if (identity === '귀환병') return '공감, 낮은 위험. 민간인 대화에 적합.';
  if (identity === '라에르테스의 아들') return '이타카 왕가 혈통명. 귀향 자격에 적합.';
  if (identity === '도시를 함락한 자') return '강한 전공명. 생존자에게 반감을 산다.';
  return '분석적이고 우회적인 이름.';
}

function openTicket() {
  show('귀향표', '<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">' + (inspected ? 'APPROVED' : 'VALID') + '</span></div>');
}

function talk(id) {
  if (id === 'prop') {
    show('선전관', '장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.', '<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>[' + equippedName + ']</b> 나는 집으로 간다.</button>');
  }
  if (id === 'survivor') {
    show('트로이 생존자', '당신이 그 열차를 들여보낸 사람이군요.', '<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>[' + equippedName + ']</b> 전쟁은 끝났습니다.</button>');
  }
  if (id === 'inspector') {
    inspected = true;
    show('검표 결과', '<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검표관: 기록은 사람보다 오래 기다립니다.');
  }
}

function interact() {
  if (!near) return;
  if (near.id === 'gate') {
    if (!inspected) {
      show('검표 필요', '17번 승강장으로 나가려면 먼저 검표관에게 귀향표와 탑승명을 제시해야 한다.');
      return;
    }
    cut.style.display = 'grid';
    cut.innerHTML = '<article><h1>1장. 트로이 폐허역</h1><p>열차는 배경 너머에서 출발한다. 전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>';
    return;
  }
  if (objectText[near.id]) show(objectText[near.id][0], objectText[near.id][1]);
  else talk(near.id);
}

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
  button.onpointerdown = event => {
    event.preventDefault();
    input[property] = true;
    button.setPointerCapture?.(event.pointerId);
  };
  button.onpointerup = event => {
    event.preventDefault();
    input[property] = false;
  };
  button.onpointercancel = () => { input[property] = false; };
  button.onpointerleave = () => { input[property] = false; };
}

bindHold(leftBtn, 'left');
bindHold(rightBtn, 'right');
jumpBtn.onclick = event => {
  event.preventDefault();
  input.jumpQueued = true;
};
actBtn.onclick = interact;
nameBtn.onclick = openNames;
ticketBtn.onclick = openTicket;

requestAnimationFrame(update);
