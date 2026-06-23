(() => {
  const userBg = new Image();
  userBg.src = './assets/user/game/bg_00_composite.png?v=uploaded-bg-1';

  function drawUploadedComposite() {
    if (!userBg.complete || !userBg.naturalWidth) return false;

    const destW = VIEW_W;
    const destH = Math.round(userBg.naturalHeight * destW / userBg.naturalWidth);
    const y = Math.round(GROUND_Y - destH + 4);
    const offset = -Math.floor(cameraX * 0.62) % destW;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let x = offset - destW; x < VIEW_W + destW; x += destW) {
      ctx.drawImage(userBg, Math.round(x), y, destW, destH);
    }
    ctx.restore();
    return true;
  }

  drawBackground = function drawBackground() {
    rect(0, 0, VIEW_W, VIEW_H, '#060708');
    rect(0, 0, VIEW_W, 150, '#10151f');
    for (let y = 0; y < 150; y += 18) rect(0, y, VIEW_W, 1, 'rgba(230,183,90,.035)');
    drawUploadedComposite();
  };

  drawTrain = function drawTrain() {
    // The uploaded composite already contains the train layer.
  };

  drawForegroundObjects = function drawForegroundObjects() {
    // Foreground objects will be reintroduced one PNG at a time after the composite is aligned.
  };

  drawPlatform = function drawPlatform() {
    rect(0, GROUND_Y, VIEW_W, 2, 'rgba(230,183,90,.65)');
    rect(0, GROUND_Y + 58, VIEW_W, 3, 'rgba(64,45,23,.65)');
  };
})();
