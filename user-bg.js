(() => {
  const userBg = new Image();
  userBg.src = './assets/user/game/bg_00_composite.png?v=uploaded-bg-single-1';

  function drawUploadedComposite() {
    if (!userBg.complete || !userBg.naturalWidth) return false;

    const destW = VIEW_W;
    const destH = Math.round(userBg.naturalHeight * destW / userBg.naturalWidth);
    const y = Math.round(GROUND_Y - destH + 4);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(userBg, 0, y, destW, destH);
    ctx.restore();
    return true;
  }

  function drawUploadedScene() {
    rect(0, 0, VIEW_W, VIEW_H, '#050607');
    rect(0, 0, VIEW_W, 152, '#10151f');
    for (let y = 0; y < 152; y += 18) rect(0, y, VIEW_W, 1, 'rgba(230,183,90,.035)');

    if (!drawUploadedComposite()) {
      drawBackground();
      drawTrain();
      drawForegroundObjects();
      drawPlatform();
    } else {
      rect(0, GROUND_Y, VIEW_W, 2, 'rgba(230,183,90,.72)');
      rect(0, GROUND_Y + 58, VIEW_W, 3, 'rgba(64,45,23,.70)');
    }

    drawParticles();
    entities.forEach(e => {
      if (e.kind === 'npc') drawNpc(e);
    });
    drawHero();
    entities.forEach(e => {
      const x = sx(e.x);
      if (x < -160 || x > VIEW_W + 160) return;
      drawGlyph(x, e.glyphY || GROUND_Y - 112, near && near.id === e.id);
    });
    drawAtmosphere();
  }

  drawScene = drawUploadedScene;
})();
