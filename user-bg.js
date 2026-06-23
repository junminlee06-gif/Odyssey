(() => {
  const layerVersion = 'layered-bg-zoom-1';
  const BG_SCALE = 1.72;
  const TOP_Y = -10;
  const layers = [
    { name: 'sky', src: './assets/user/game/bg_01_sky.png', parallax: 0.03, repeat: true, yOffset: 0 },
    { name: 'far', src: './assets/user/game/bg_02_far_city.png', parallax: 0.13, repeat: true, yOffset: 0 },
    { name: 'mid', src: './assets/user/game/bg_03_mid_city.png', parallax: 0.28, repeat: true, yOffset: 0 },
    { name: 'roof', src: './assets/user/game/bg_06_roof.png', parallax: 0.42, repeat: true, yOffset: -6 },
    { name: 'train', src: './assets/user/game/bg_04_train.png', parallax: 0.72, repeat: true, yOffset: 0 },
    { name: 'platform', src: './assets/user/game/bg_05_platform.png', parallax: 1.0, repeat: true, yOffset: 0 }
  ].map(layer => {
    const image = new Image();
    image.src = `${layer.src}?v=${layerVersion}`;
    return { ...layer, image };
  });

  function drawUploadedLayer(layer) {
    const image = layer.image;
    if (!image.complete || !image.naturalWidth) return false;

    const destW = Math.round(VIEW_W * BG_SCALE);
    const destH = Math.round(image.naturalHeight * destW / image.naturalWidth);
    const y = TOP_Y + (layer.yOffset || 0);
    const rawOffset = -Math.floor(cameraX * layer.parallax);
    const offset = ((rawOffset % destW) + destW) % destW;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (layer.repeat) {
      for (let x = offset - destW; x < VIEW_W + destW; x += destW) {
        ctx.drawImage(image, Math.round(x), y, destW, destH);
      }
    } else {
      ctx.drawImage(image, 0, y, destW, destH);
    }
    ctx.restore();
    return true;
  }

  function drawLayeredBackground() {
    rect(0, 0, VIEW_W, VIEW_H, '#050607');

    let loaded = 0;
    for (const layer of layers) {
      if (drawUploadedLayer(layer)) loaded++;
    }
    return loaded >= 3;
  }

  function drawUploadedScene() {
    if (!drawLayeredBackground()) {
      drawBackground();
      drawStationPixelPass();
      drawTrain();
      drawTrainPixelPass();
      drawForegroundObjects();
      drawPlatform();
      drawPlatformPixelPass();
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
