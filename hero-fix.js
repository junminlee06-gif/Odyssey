(() => {
  function px(x, y, w, h, color) {
    if (typeof rect === 'function') rect(x, y, w, h, color);
  }
  function pickHeroFrame() {
    try {
      if (playerY > 2) return velocityY > 0 ? assets.heroJump : assets.heroFall;
      if (Math.abs(playerVX) > 18 && typeof heroWalkFrames !== 'undefined') {
        return heroWalkFrames[Math.floor(currentTime / 92) % heroWalkFrames.length];
      }
      if (typeof heroIdleFrames !== 'undefined') return heroIdleFrames[Math.floor(currentTime / 580) % heroIdleFrames.length];
    } catch (_) {}
    return null;
  }
  function safeDrawImage(image, x, y, w, h, flip) {
    try {
      if (!image || !image.complete || image.naturalWidth === 0) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (flip) {
        ctx.scale(-1, 1);
        ctx.drawImage(image, -Math.round(x + w), Math.round(y), Math.round(w), Math.round(h));
      } else {
        ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      }
      ctx.restore();
      return true;
    } catch (_) {
      try { ctx.restore(); } catch (e) {}
      return false;
    }
  }
  function visibleOverlay(x, y, flip) {
    const X = (n) => x + (flip ? 48 - n : n);
    px(x - 5, GROUND_Y - 3, 58, 5, 'rgba(0,0,0,.80)');
    px(X(12), y + 3, 18, 5, '#030201');
    px(X(9), y + 8, 26, 7, '#090605');
    px(X(16), y + 12, 11, 8, '#b77b4b');
    px(X(13), y + 20, 24, 19, 'rgba(230,214,170,.72)');
    px(X(16), y + 23, 10, 23, '#15100d');
    px(X(11), y + 32, 25, 3, '#c08a40');
    px(X(7), y + 28, 9, 24, 'rgba(232,220,180,.58)');
    px(X(32), y + 28, 8, 24, 'rgba(232,220,180,.48)');
    px(X(5), y + 43, 12, 12, '#8a5630');
    px(X(20), y + 39, 8, 18, '#17110d');
    px(X(31), y + 39, 8, 18, '#1d140f');
    px(X(17), y + 53, 12, 4, '#050403');
    px(X(29), y + 53, 13, 4, '#050403');
    px(X(3), y + 50, 14, 3, '#09c4a4');
    px(X(20), y + 35, 5, 5, '#09c4a4');
    px(X(24), y + 41, 6, 7, '#d7b35d');
    px(X(32), y + 40, 5, 7, '#8b1e1e');
  }
  try {
    drawHero = function drawHero() {
      const w = 48;
      const h = 64;
      const x = sx(playerX) - 24;
      const y = GROUND_Y - h - Math.round(playerY) + 4;
      const flip = facing < 0;
      const image = pickHeroFrame();
      safeDrawImage(image, x, y, w, h, flip);
      visibleOverlay(x, y, flip);
    };
  } catch (_) {
    window.drawHero = function drawHero() {
      const w = 48;
      const h = 64;
      const x = sx(playerX) - 24;
      const y = GROUND_Y - h - Math.round(playerY) + 4;
      const flip = facing < 0;
      visibleOverlay(x, y, flip);
    };
  }
})();
