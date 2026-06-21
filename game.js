const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('modal');
const panel = document.getElementById('panel');
const hint = document.getElementById('hint');
const cut = document.getElementById('cut');
const nameNow = document.getElementById('nameNow');

const W = 384;
const H = 216;
const GROUND = 174;
const WORLD = 2700;
let x = 92;
let y = 0;
let vy = 0;
let cam = 0;
let time = 0;
let facing = 1;
let name = '귀환병';
let inspected = false;
let near = null;
const keys = {};

const C = {
  black: '#020303',
  void: '#050607',
  sky: '#111a24',
  sky2: '#17252e',
  wall: '#11191b',
  wall2: '#243538',
  iron: '#3b4947',
  floor: '#26231d',
  floor2: '#514534',
  gold: '#d5b661',
  paper: '#d1bb7b',
  red: '#ff3b37',
  red2: '#8e1d1b',
  cyan: '#7dfff4',
  cyan2: '#1b8e8b',
  rust: '#8b5434',
  rust2: '#351914',
  skin: '#a77b55',
  coat: '#182528',
  coat2: '#526c67',
  smoke: '#40535a'
};

const entities = [
  ['poster', '영웅 포스터', 155, 'object'],
  ['list', '귀환병 명단', 350, 'object'],
  ['prop', '선전관', 600, 'npc'],
  ['wreck', '불탄 목마열차 잔해', 900, 'object'],
  ['survivor', '트로이 생존자', 1210, 'npc'],
  ['sign', '이타카행 전광판', 1580, 'object'],
  ['inspector', '검표관', 1870, 'npc'],
  ['train', '이타카행 열차', 2180, 'gate']
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

function screenX(worldX) {
  return Math.round(worldX - cam);
}

function noise(x, y, w, h, base, dot) {
  rect(x, y, w, h, base);
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = (yy % 4); xx < w; xx += 7) rect(x + xx, y + yy, 1, 1, dot);
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
  '....kkkk....',
  '...kkkkkk...',
  '...kssss...',
  '....sss....',
  '..ooooooo..',
  '.occcchco..',
  '.occhhhcco.',
  '.occbbcco..',
  '.occcccco..',
  '..occbo...',
  '..occcco...',
  '..cc..cc...',
  '..ll..ll...',
  '.lll..lll..',
  '.bb....bb..'
];

const heroWalk1 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kssss...',
  '....sss....',
  '..ooooooo..',
  '.occcchco..',
  '.occhhhcco.',
  '.occbbcco..',
  '.occcccco..',
  '..occbo...',
  '..occcco...',
  '.ccc..cc...',
  '.ll...lll..',
  'lll....ll..',
  'bb.....bbb.'
];

const heroWalk2 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kssss...',
  '....sss....',
  '..ooooooo..',
  '.occcchco..',
  '.occhhhcco.',
  '.occbbcco..',
  '.occcccco..',
  '..occbo...',
  '..occcco...',
  '..cc..ccc..',
  '.lll...ll..',
  '.ll....lll.',
  'bbb.....bb.'
];

const palHero = { k: C.black, s: C.skin, o: C.black, c: C.coat, h: C.coat2, b: C.cyan, l: C.black };

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#162334');
  grad.addColorStop(0.55, '#0d1216');
  grad.addColorStop(1, '#050505');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 38; i++) {
    const sx = (i * 43 - Math.floor(cam * 0.08)) % (W + 70) - 35;
    const sy = 20 + (i * 17) % 62;
    rect(sx, sy, 22 + (i % 5) * 8, 2, i % 2 ? '#233640' : '#1a2b35');
  }

  for (let bx = -80 - Math.floor(cam * 0.16) % 118; bx < W + 100; bx += 118) {
    noise(bx, 82, 66, 72, '#0d1719', '#1b3033');
    rect(bx + 8, 69, 49, 13, '#17282d');
    rect(bx + 18, 56, 23, 13, '#0f1d22');
    for (let wy = 96; wy < 143; wy += 12) {
      rect(bx + 10, wy, 8, 4, '#2e4c50');
      rect(bx + 31, wy + 2, 9, 3, '#263c40');
      rect(bx + 51, wy, 5, 4, '#35534c');
    }
  }
}

function drawStation() {
  const shift = Math.floor(cam * 0.32);
  for (let sx = -90 - shift % 80; sx < W + 100; sx += 80) {
    line(sx, 33, sx + 70, 118, '#3c6267');
    line(sx + 70, 33, sx, 118, '#172a2e');
    rect(sx + 20, 40, 34, 4, '#5d7775');
    rect(sx + 31, 52, 8, 5, '#1c363a');
  }

  rect(0, 107, W, 8, '#1c2a2b');
  rect(0, 113, W, 2, '#5c6b5f');
  for (let px = -20 - shift % 48; px < W + 20; px += 48) {
    rect(px, 102, 5, 75, C.black);
    rect(px + 2, 102, 1, 75, '#64756a');
  }

  rect(24 - cam * 0.05, 123, 124, 13, C.black);
  rect(28 - cam * 0.05, 125, 116, 9, '#101919');
  text('TROY CENTRAL', 43 - cam * 0.05, 132, C.red, 7);
}

function drawPlatform() {
  noise(0, GROUND, W, H - GROUND, '#26221c', '#4c3d2b');
  rect(0, GROUND, W, 3, C.cyan2);
  rect(0, GROUND + 2, W, 1, C.cyan);
  rect(0, GROUND + 18, W, 3, '#11100d');

  const off = Math.floor(cam * 0.9) % 32;
  for (let sx = -off; sx < W; sx += 32) {
    rect(sx, GROUND + 6, 24, 1, '#6a5940');
    rect(sx + 9, GROUND + 14, 18, 1, '#423426');
    rect(sx + 5, GROUND + 3, 3, 1, C.gold);
  }

  const rail = GROUND + 25;
  rect(0, rail, W, 2, C.gold);
  rect(0, rail + 10, W, 2, C.gold);
  for (let sx = -Math.floor(cam * 1.15) % 22; sx < W; sx += 22) {
    rect(sx, rail + 1, 4, 12, '#292117');
    rect(sx + 1, rail + 2, 1, 9, '#8b744d');
  }
}

function drawPoster(sx, sy) {
  rect(sx - 2, sy - 2, 36, 55, C.black);
  noise(sx, sy, 32, 50, C.paper, '#ead590');
  rect(sx + 8, sy + 9, 16, 15, '#6b3326');
  rect(sx + 11, sy + 6, 9, 6, '#2c1b14');
  rect(sx + 7, sy + 29, 19, 2, '#332217');
  rect(sx + 6, sy + 34, 21, 2, '#332217');
  rect(sx + 16, sy + 41, 11, 6, C.red);
}

function drawListBoard(sx, sy) {
  rect(sx - 3, sy - 3, 78, 70, C.black);
  noise(sx, sy, 72, 64, '#0f1d1e', '#1d3538');
  rect(sx, sy, 72, 3, C.cyan);
  text('RETURN LIST', sx + 6, sy + 14, C.cyan, 5);
  for (let i = 0; i < 7; i++) {
    const yy = sy + 21 + i * 6;
    rect(sx + 7, yy, 43 + (i % 3) * 7, 1, i === 2 ? C.red : C.gold);
    rect(sx + 58, yy - 1, 5, 3, '#3a2218');
  }
}

function drawWreck(sx, sy) {
  rect(sx + 2, sy + 28, 116, 32, C.black);
  noise(sx + 5, sy + 24, 106, 36, C.rust2, C.rust);
  rect(sx + 14, sy + 17, 55, 11, '#241712');
  rect(sx + 65, sy + 2, 14, 25, C.black);
  rect(sx + 80, sy + 9, 31, 9, C.rust2);
  rect(sx + 15, sy + 50, 17, 17, C.black);
  rect(sx + 76, sy + 50, 17, 17, C.black);
  for (let i = 0; i < 7; i++) rect(sx + 12 + i * 13, sy + 32 + (i % 2) * 5, 8, 2, C.rust);
  rect(sx + 53, sy, 8, 10, C.smoke);
  rect(sx + 58, sy - 7, 12, 4, '#61727a');
}

function drawTrain(sx, sy) {
  rect(sx - 3, sy + 31, 174, 58, C.black);
  noise(sx, sy + 34, 166, 50, '#1d2725', '#344640');
  rect(sx + 7, sy + 39, 153, 6, '#46554e');
  rect(sx + 9, sy + 55, 121, 3, C.cyan);
  rect(sx + 13, sy + 19, 62, 27, C.black);
  rect(sx + 18, sy + 23, 53, 18, '#172022');
  rect(sx + 26, sy + 28, 13, 8, '#4a7074');
  rect(sx + 46, sy + 28, 13, 8, '#4a7074');
  text('ITHACA', sx + 15, sy + 51, C.cyan, 6);
  for (let i = 0; i < 5; i++) {
    rect(sx + 18 + i * 31, sy + 80, 17, 17, C.black);
    rect(sx + 22 + i * 31, sy + 84, 9, 9, '#7b6845');
  }
}

function drawNpc(sx, sy, type) {
  const p = { ...palHero };
  p.c = type === 0 ? '#29493e' : type === 1 ? '#2a302c' : '#101819';
  p.h = type === 0 ? '#69a08f' : type === 1 ? '#59483b' : '#2d6665';
  p.b = type === 2 ? C.cyan : C.gold;
  sprite(heroIdle, p, sx - 18, sy, 3, false);
  if (type === 0) rect(sx + 16, sy + 16, 10, 22, C.paper);
  if (type === 1) rect(sx + 14, sy + 42, 15, 10, '#6b4d31');
  if (type === 2) rect(sx + 14, sy + 25, 22, 6, C.cyan);
}

function drawGlyph(sx, sy, active) {
  rect(sx - (active ? 18 : 11), sy - 1, active ? 36 : 22, active ? 17 : 12, C.black);
  rect(sx - (active ? 17 : 10), sy, active ? 34 : 20, active ? 15 : 10, active ? C.cyan : '#3a3528');
  rect(sx - (active ? 15 : 8), sy + 2, active ? 30 : 16, active ? 11 : 6, active ? '#051615' : '#111514');
  text(active ? 'E' : '...', sx - (active ? 3 : 5), sy + (active ? 11 : 8), active ? C.cyan : '#9a8c65', active ? 8 : 5);
}

function drawRain() {
  const phase = Math.floor(time / 48);
  for (let i = 0; i < 50; i++) {
    const rx = (i * 37 + phase * 3) % W;
    const ry = (i * 19 + phase * 7) % H;
    rect(rx, ry, 1, 5, 'rgba(125,255,244,.25)');
  }
  for (let yy = 0; yy < H; yy += 2) rect(0, yy, W, 1, 'rgba(0,0,0,.08)');
}

function draw() {
  cam = Math.max(0, Math.min(WORLD - W, x - 170));
  drawSky();
  drawStation();
  drawPlatform();

  const visible = (worldX) => screenX(worldX) > -140 && screenX(worldX) < W + 120;
  if (visible(155)) drawPoster(screenX(135), 105);
  if (visible(350)) drawListBoard(screenX(330), 94);
  if (visible(900)) drawWreck(screenX(835), 114);
  if (visible(1580)) drawListBoard(screenX(1535), 92);
  if (visible(1650)) text('ITHACA', screenX(1618), 66, C.cyan, 8);
  if (visible(2180)) drawTrain(screenX(2078), 88);

  entities.forEach(e => {
    const sx = screenX(e[2]);
    if (sx < -60 || sx > W + 60) return;
    if (e[3] === 'npc') drawNpc(sx, GROUND - 62, e[0] === 'survivor' ? 1 : e[0] === 'inspector' ? 2 : 0);
    drawGlyph(sx, GROUND - 72, near && near[0] === e[0]);
  });

  const walking = keys.a || keys.d || keys.ArrowLeft || keys.ArrowRight;
  const frame = walking ? (Math.floor(time / 140) % 2 ? heroWalk1 : heroWalk2) : heroIdle;
  const hx = screenX(x) - 20;
  const hy = GROUND - 58 - y;
  rect(hx - 4, hy - 4, 48, 64, 'rgba(125,255,244,.12)');
  sprite(frame, palHero, hx, hy, 3, facing < 0);
  rect(hx + (facing < 0 ? 4 : 33), hy + 31, 8, 3, C.red);

  drawRain();
}

function update(now) {
  time = now;
  const dir = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
  if (dir) facing = dir;
  x = Math.max(50, Math.min(WORLD - 80, x + dir * 3.4));
  if (keys.jump && y === 0) { vy = 9.5; keys.jump = false; }
  if (y > 0 || vy !== 0) {
    y += vy;
    vy -= 0.48;
    if (y < 0) { y = 0; vy = 0; }
  }
  near = entities.find(e => Math.abs(e[2] - x) < 60) || null;
  hint.textContent = near ? 'E / 터치: ' + near[1] : 'A/D 이동 · Space 점프 · E 상호작용 · I 신분철';
  draw();
  requestAnimationFrame(update);
}

function show(title, body, extra = '') {
  panel.innerHTML = '<h1>' + title + '</h1><p>' + body + '</p>' + extra + '<button onclick="hide()">닫기</button>';
  modal.style.display = 'grid';
}
function hide() { modal.style.display = 'none'; }

function openNames() {
  const html = ['귀환병', '라에르테스의 아들', '도시를 함락한 자', '지략이 많은 자'].map(n =>
    '<button class="choice" onclick="name=\'' + n + '\';nameNow.textContent=name;openNames()"><b>[' + n + ']</b><br>' + desc(n) + '</button>'
  ).join('') + '<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>';
  show('신분철', html, '');
}
function desc(n) {
  if (n === '귀환병') return '공감, 낮은 위험. 민간인 대화에 적합.';
  if (n === '라에르테스의 아들') return '이타카 왕가 혈통명. 귀향 자격에 적합.';
  if (n === '도시를 함락한 자') return '강한 전공명. 생존자에게 반감을 산다.';
  return '분석적이고 우회적인 이름.';
}
function openTicket() {
  show('귀향표', '<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">' + (inspected ? 'APPROVED' : 'VALID') + '</span></div>');
}
function talk(id) {
  if (id === 'prop') show('선전관', '장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.', '<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>[' + name + ']</b> 나는 집으로 간다.</button>');
  if (id === 'survivor') show('트로이 생존자', '당신이 그 열차를 들여보낸 사람이군요.', '<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>[' + name + ']</b> 전쟁은 끝났습니다.</button>');
  if (id === 'inspector') { inspected = true; show('검표 결과', '<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검표관: 기록은 사람보다 오래 기다립니다.'); }
}
function act() {
  if (!near) return;
  if (near[0] === 'train') {
    if (!inspected) { show('검표 필요', '먼저 검표관에게 귀향표와 탑승명을 제시해야 한다.'); return; }
    cut.style.display = 'grid';
    cut.innerHTML = '<article><h1>1장. 트로이 폐허역</h1><p>전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>';
    return;
  }
  if (objectText[near[0]]) show(objectText[near[0]][0], objectText[near[0]][1]);
  else talk(near[0]);
}

window.onkeydown = e => {
  if (e.key === ' ') keys.jump = true;
  keys[e.key] = true;
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') act();
  if (e.key.toLowerCase() === 'i') openNames();
};
window.onkeyup = e => {
  keys[e.key] = false;
  keys[e.key.toLowerCase()] = false;
};

leftBtn.onpointerdown = () => { keys.a = true; };
leftBtn.onpointerup = leftBtn.onpointercancel = () => { keys.a = false; };
rightBtn.onpointerdown = () => { keys.d = true; };
rightBtn.onpointerup = rightBtn.onpointercancel = () => { keys.d = false; };
jumpBtn.onclick = () => { keys.jump = true; };
actBtn.onclick = act;
nameBtn.onclick = openNames;
ticketBtn.onclick = openTicket;

requestAnimationFrame(update);
