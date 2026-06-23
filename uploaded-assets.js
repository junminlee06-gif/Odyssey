(() => {
  const gold = '#e6b75a';
  const gold2 = '#ffdb82';
  const red = '#8b1f1f';
  const steel = '#202838';
  const black = '#050504';

  function r(x, y, w, h, c) { rect(x, y, w, h, c); }
  function sx2(x, p = 1) { return Math.round(x - cameraX * p); }
  function glow(cx, cy, radius, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, color);
    g.addColorStop(.38, color.replace('1)', '.42)'));
    g.addColorStop(1, color.replace('1)', '0)'));
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  function softBeam(x, y, w, h, color, alpha = .18) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, color);
    g.addColorStop(.35, color.replace('1)', '.28)'));
    g.addColorStop(1, color.replace('1)', '0)'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h * .22);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h * .45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function lampPost(x, y, scale = 1) {
    r(x - 3 * scale, y, 6 * scale, 126 * scale, '#3e3f3b');
    r(x - 1 * scale, y, 2 * scale, 126 * scale, '#7a7468');
    r(x - 32 * scale, y - 8 * scale, 64 * scale, 7 * scale, steel);
    lantern(x - 45 * scale, y - 1 * scale, scale);
    lantern(x + 21 * scale, y - 1 * scale, scale);
    softBeam(x - 55 * scale, y + 14 * scale, 52 * scale, 130 * scale, 'rgba(230,183,90,1)', .13);
    softBeam(x + 3 * scale, y + 14 * scale, 52 * scale, 130 * scale, 'rgba(230,183,90,1)', .13);
  }
  function hangingLamp(x, y, scale = 1) {
    for (let i = 0; i < 15; i++) r(x - 1 * scale, y - i * 8 * scale, 2 * scale, 4 * scale, '#2e3540');
    lantern(x - 11 * scale, y, scale);
  }
  function lantern(x, y, scale = 1) {
    glow(x + 12 * scale, y + 20 * scale, 38 * scale, 'rgba(230,151,45,1)', .55);
    r(x + 2 * scale, y, 22 * scale, 5 * scale, steel);
    r(x + 4 * scale, y + 5 * scale, 18 * scale, 30 * scale, '#0a0c10');
    r(x + 7 * scale, y + 9 * scale, 12 * scale, 22 * scale, gold2);
    r(x + 10 * scale, y + 10 * scale, 5 * scale, 16 * scale, '#fff0b0');
    r(x + 2 * scale, y + 35 * scale, 22 * scale, 5 * scale, steel);
  }
  function rainOverlay() {
    const drift = Math.floor(currentTime / 28);
    ctx.save();
    ctx.globalAlpha = .32;
    for (let i = 0; i < 96; i++) {
      const x = (i * 71 + drift * 6) % (VIEW_W + 80) - 40;
      const y = (i * 53 + drift * 13) % (VIEW_H + 120) - 80;
      r(x, y, 2, 16 + (i % 5) * 3, 'rgba(210,199,162,.30)');
      r(x + 1, y + 2, 1, 14, 'rgba(255,235,180,.18)');
    }
    ctx.restore();
  }
  function steamFx(x, y, t) {
    const a = Math.max(0, 1 - t);
    glow(x - t * 80, y - t * 70, 44 + t * 36, 'rgba(160,150,124,1)', .20 * a);
    glow(x - t * 42, y - t * 48, 38 + t * 24, 'rgba(210,196,160,1)', .18 * a);
    glow(x + 18 - t * 58, y - t * 86, 30 + t * 22, 'rgba(170,160,132,1)', .14 * a);
  }

  function trainCar(x, y, w, h) {
    r(x, y + 18, w, h - 36, '#11151d');
    r(x + 8, y + 10, w - 16, 10, '#293140');
    r(x + 4, y + h - 28, w - 8, 12, '#070809');
    r(x + 8, y + h - 51, w - 16, 5, red);
    const count = 10;
    const gap = (w - 72) / count;
    for (let i = 0; i < count; i++) {
      const wx = x + 36 + i * gap;
      r(wx, y + 33, 24, 29, '#050607');
      glow(wx + 12, y + 47, 26, 'rgba(230,183,90,1)', .27);
      r(wx + 4, y + 38, 16, 20, gold);
      r(wx + 7, y + 39, 5, 5, '#fff0b0');
    }
    r(x + 2, y + 72, w - 4, 2, 'rgba(230,183,90,.25)');
    r(x + 2, y + 95, w - 4, 3, 'rgba(0,0,0,.45)');
    r(x + 34, y + h - 21, 52, 12, '#202838');
    r(x + w - 88, y + h - 21, 52, 12, '#202838');
  }
  function locomotive(x, y, scale = 1) {
    glow(x + 18 * scale, y + 54 * scale, 66 * scale, 'rgba(230,154,52,1)', .46);
    softBeam(x - 134 * scale, y + 42 * scale, 150 * scale, 46 * scale, 'rgba(230,154,52,1)', .30);
    r(x + 22 * scale, y + 36 * scale, 88 * scale, 46 * scale, steel);
    r(x + 110 * scale, y + 14 * scale, 42 * scale, 68 * scale, '#101722');
    r(x + 126 * scale, y + 30 * scale, 18 * scale, 24 * scale, gold);
    r(x + 40 * scale, y + 22 * scale, 20 * scale, 16 * scale, '#101722');
    r(x + 61 * scale, y + 68 * scale, 90 * scale, 5 * scale, red);
    r(x + 70 * scale, y + 78 * scale, 86 * scale, 8 * scale, '#11161e');
    for (let i = 0; i < 4; i++) r(x + (48 + i * 28) * scale, y + 95 * scale, 16 * scale, 16 * scale, '#121925');
    r(x + 70 * scale, y + 104 * scale, 80 * scale, 4 * scale, '#444b54');
  }

  function stationBoard(x, y, w, h) {
    r(x, y, w, h, '#050403');
    r(x + 5, y + 5, w - 10, h - 10, '#0a0905');
    r(x + 11, y + 35, w - 22, 2, '#4f3919');
    r(x + 74, y + 42, 2, h - 56, '#4f3919');
    r(x + 136, y + 42, 2, h - 56, '#4f3919');
    text('이타카 행', x + 15, y + 24, gold, 18);
    text('ITHACA', x + 90, y + 24, 'rgba(230,183,90,.58)', 15);
    text('11:20', x + 17, y + 72, gold, 18);
    text('IC-7', x + 91, y + 72, gold, 18);
    text('탑승준비', x + 150, y + 72, gold, 15);
  }
  function propagandaPoster(x, y, w, h) {
    r(x, y, w, h, '#202838');
    r(x + 3, y + 3, w - 6, h - 6, '#1a2231');
    r(x + 4, y + h - 37, w - 8, 34, black);
    text('포세이돈국을 위하여', x + 10, y + 20, gold, 11);
    r(x + w * .36, y + 44, w * .28, 32, '#070b10');
    r(x + w * .32, y + 75, w * .36, 50, '#070b10');
    text('승리와', x + 27, y + h - 24, gold, 19);
    text('귀환을!', x + 27, y + h - 7, '#d34c4c', 17);
  }
  function redBanner(x, y, w, h) {
    r(x, y, w, h, '#8b2424');
    r(x + 5, y + 8, w - 10, h - 16, '#7d1f1f');
    r(x + 10, y + 12, w - 20, h - 24, gold);
    r(x + 14, y + 16, w - 28, h - 32, '#7d1f1f');
    r(x + w / 2 - 4, y + 45, 8, h - 90, gold);
    for (let yy = y + 70; yy < y + h - 32; yy += 18) r(x + w / 2 - 14, yy, 28, 5, gold);
  }
  function ticketBooth(x, y, w, h) {
    r(x, y, w, h, '#14100c');
    r(x + 8, y + 10, w - 16, h - 20, '#1c1510');
    r(x + 17, y + 28, w - 34, 36, '#0a0807');
    r(x + 26, y + 35, w - 52, 22, gold);
    r(x + 10, y + 72, w - 20, 4, '#d7b35d');
    r(x + 10, y + 86, w - 20, 4, '#a57731');
    r(x + w - 16, y + 68, 5, 5, '#c33a31');
  }

  drawTrain = function drawTrain() {
    const y = 206;
    const off = -Math.floor(cameraX * .62) % 420;
    locomotive(sx2(-260, .62), y - 4, .85);
    for (let x = off - 420; x < VIEW_W + 460; x += 420) trainCar(x, y, 420, 132);
    drawTrainDepth(y + 18);
    const period = 4300;
    const local = currentTime % period;
    if (local < 1800) {
      const t = local / 1800;
      for (let x = off - 420; x < VIEW_W + 460; x += 420) steamFx(x + 42, y + 26, t);
    }
  };

  drawForegroundObjects = function drawForegroundObjects() {
    trainScratches();
    const visible = wx => sx(wx) > -360 && sx(wx) < VIEW_W + 360;
    if (visible(340)) propagandaPoster(sx(285), 244, 78, 108);
    if (visible(780)) stationBoard(sx(655), 214, 248, 134);
    if (visible(1180)) hangingLamp(sx(1180), 152, .9);
    if (visible(1780)) ticketBooth(sx(1660), 245, 82, 104);
    if (visible(2440)) redBanner(sx(2410), 178, 48, 150);
    if (visible(3020)) stationBoard(sx(2860), 214, 248, 134);
    if (visible(3480)) lampPost(sx(3540), 173, .78);
    if (visible(4040)) ticketBooth(sx(4024), 223, 96, 122);
  };

  drawAtmosphere = function drawAtmosphere() {
    rainOverlay();
    glow(96, 92, 72, 'rgba(230,183,90,1)', .08);
    glow(515, 186, 84, 'rgba(230,183,90,1)', .07);
    for (let y = 0; y < VIEW_H; y += 3) r(0, y, VIEW_W, 1, 'rgba(0,0,0,.035)');
  };
})();
