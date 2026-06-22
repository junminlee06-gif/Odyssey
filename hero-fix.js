(() => {
  let outisImage = null;
  let outisReady = false;

  fetch('./assets/characters/outis_real_idle.b64', { cache: 'no-cache' })
    .then(response => response.text())
    .then(text => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + text.trim();
      image.onload = () => {
        outisImage = image;
        outisReady = true;
      };
    })
    .catch(() => {});

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

  drawHero = function drawHero() {
    const w = 56;
    const h = 74;
    const x = sx(playerX) - Math.round(w / 2);
    const y = GROUND_Y - h - Math.round(playerY) + 5;
    const flip = facing < 0;

    if (outisReady && outisImage && outisImage.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      px(x - 5, GROUND_Y - 3, w + 10, 5, 'rgba(0,0,0,.78)');
      if (flip) {
        ctx.scale(-1, 1);
        ctx.drawImage(outisImage, -Math.round(x + w), Math.round(y), w, h);
      } else {
        ctx.drawImage(outisImage, Math.round(x), Math.round(y), w, h);
      }
      ctx.restore();
      return;
    }

    drawEmergencySilhouette(x, y, flip);
  };
})();
