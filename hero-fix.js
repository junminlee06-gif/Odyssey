(() => {
  let outisImage = null;
  let outisReady = false;
  let outisFrames = null;
  const SRC_W = 48;
  const SRC_H = 64;

  fetch('./assets/characters/outis_real_idle.b64?v=outis-motion-1', { cache: 'reload' })
    .then(response => response.text())
    .then(text => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + text.trim();
      image.onload = () => {
        outisImage = image;
        outisFrames = buildFrames(image);
        outisReady = true;
      };
    })
    .catch(() => {});

  function px(x, y, w, h, color) {
    if (typeof rect === 'function') rect(x, y, w, h, color);
  }

  function makeFrame(source, cfg) {
    const frame = document.createElement('canvas');
    frame.width = SRC_W;
    frame.height = SRC_H;
    const c = frame.getContext('2d');
    c.imageSmoothingEnabled = false;

    for (let y = 0; y < SRC_H; y++) {
      let dx = 0;
      if (y < 18) dx += cfg.head || 0;
      else if (y < 36) dx += cfg.body || 0;
      else dx += cfg.coat || 0;

      const dy = y + (cfg.y || 0);
      if (dy < 0 || dy >= SRC_H) continue;

      if (y >= 42) {
        c.drawImage(source, 0, y, 24, 1, dx + (cfg.leftLeg || 0), dy, 24, 1);
        c.drawImage(source, 24, y, 24, 1, dx + 24 + (cfg.rightLeg || 0), dy, 24, 1);
      } else {
        c.drawImage(source, 0, y, SRC_W, 1, dx, dy, SRC_W, 1);
      }
    }
    return frame;
  }

  function buildFrames(source) {
    return {
      idle: [
        makeFrame(source, { y: 0 }),
        makeFrame(source, { y: 1, coat: 1 })
      ],
      walk: [
        makeFrame(source, { y: 0, coat: -1, leftLeg: -2, rightLeg: 1 }),
        makeFrame(source, { y: -1, head: 1, body: 1, leftLeg: -1, rightLeg: 2 }),
        makeFrame(source, { y: 0, coat: 1, leftLeg: 2, rightLeg: -2 }),
        makeFrame(source, { y: 1, head: -1, body: -1, leftLeg: 1, rightLeg: -1 })
      ],
      jump: makeFrame(source, { y: -2, coat: -1, leftLeg: -1, rightLeg: 1 }),
      fall: makeFrame(source, { y: 2, coat: 1, leftLeg: 1, rightLeg: -1 })
    };
  }

  function drawEmergencySilhouette(x, y, flip) {
    const X = n => x + (flip ? 56 - n : n);
    px(x - 4, GROUND_Y - 3, 64, 5, 'rgba(0,0,0,.80)');
    px(X(18), y + 3, 20, 8, '#050403');
    px(X(15), y + 11, 24, 8, '#0b0705');
    px(X(22), y + 13, 10, 8, '#b77b4b');
    px(X(14), y + 24, 34, 31, '#d8cda9');
    px(X(22), y + 25, 13, 28, '#15100d');
    px(X(16), y + 34, 25, 4, '#c08a40');
    px(X(7), y + 45, 16, 14, '#b9874e');
    px(X(23), y + 55, 12, 10, '#050403');
    px(X(36), y + 55, 13, 10, '#050403');
    px(X(9), y + 55, 16, 3, '#08c8a7');
  }

  function chooseFrame() {
    if (!outisFrames) return null;
    if (playerY > 2) return velocityY > 0 ? outisFrames.jump : outisFrames.fall;
    const speed = Math.abs(playerVX || 0);
    if (speed > 18) {
      const frameTime = Math.max(70, 130 - speed * 0.14);
      return outisFrames.walk[Math.floor(currentTime / frameTime) % outisFrames.walk.length];
    }
    return outisFrames.idle[Math.floor(currentTime / 560) % outisFrames.idle.length];
  }

  drawHero = function drawHero() {
    const w = 56;
    const h = 74;
    const x = sx(playerX) - Math.round(w / 2);
    const y = GROUND_Y - h - Math.round(playerY) + 5;
    const flip = facing < 0;
    const frame = chooseFrame();

    if (outisReady && frame) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      px(x - 5, GROUND_Y - 3, w + 10, 5, 'rgba(0,0,0,.78)');
      if (flip) {
        ctx.scale(-1, 1);
        ctx.drawImage(frame, -Math.round(x + w), Math.round(y), w, h);
      } else {
        ctx.drawImage(frame, Math.round(x), Math.round(y), w, h);
      }
      ctx.restore();
      return;
    }

    drawEmergencySilhouette(x, y, flip);
  };
})();
