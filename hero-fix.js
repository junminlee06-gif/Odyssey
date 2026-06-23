(() => {
  const FRAME_W = 48;
  const FRAME_H = 64;
  const WALK_FRAMES = 6;
  let idleImage = null;
  let walkSheet = null;
  let idleReady = false;
  let walkReady = false;

  function loadB64(path, onload) {
    fetch(path, { cache: 'reload' })
      .then(response => response.text())
      .then(text => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + text.trim();
        image.onload = () => onload(image);
      })
      .catch(() => {});
  }

  loadB64('./assets/characters/outis_real_idle.b64?v=outis-motion-3', image => {
    idleImage = image;
    idleReady = true;
  });

  loadB64('./assets/characters/outis_walk6_sheet.b64?v=walk6-real-1', image => {
    walkSheet = image;
    walkReady = true;
  });

  function px(x, y, w, h, color) {
    if (typeof rect === 'function') rect(x, y, w, h, color);
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

  function drawSprite(image, sourceX, sourceY, sourceW, sourceH, x, y, w, h, flip) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, -Math.round(x + w), Math.round(y), w, h);
    } else {
      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, Math.round(x), Math.round(y), w, h);
    }
    ctx.restore();
  }

  drawHero = function drawHero() {
    const w = 56;
    const h = 74;
    const x = sx(playerX) - Math.round(w / 2);
    const y = GROUND_Y - h - Math.round(playerY) + 5;
    const flip = facing < 0;
    const speed = Math.abs(playerVX || 0);

    px(x - 5, GROUND_Y - 3, w + 10, 5, 'rgba(0,0,0,.78)');

    if (playerY <= 2 && speed > 18 && walkReady && walkSheet) {
      const frameTime = Math.max(62, 132 - speed * 0.15);
      const frame = Math.floor(currentTime / frameTime) % WALK_FRAMES;
      drawSprite(walkSheet, frame * FRAME_W, 0, FRAME_W, FRAME_H, x, y, w, h, flip);
      return;
    }

    if (idleReady && idleImage) {
      const idleBob = Math.floor(currentTime / 560) % 2;
      drawSprite(idleImage, 0, 0, idleImage.naturalWidth, idleImage.naturalHeight, x, y + idleBob, w, h, flip);
      return;
    }

    drawEmergencySilhouette(x, y, flip);
  };
})();
