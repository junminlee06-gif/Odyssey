(() => {
  const layerVersion = 'layered-bg-floor-1';
  const BG_SCALE = 2.0;
  const TOP_Y = 0;
  const layers = [
    { name: 'sky', src: './assets/user/game/bg_01_sky.png', parallax: 0.03, repeat: true, yOffset: 0 },
    { name: 'far', src: './assets/user/game/bg_02_far_city.png', parallax: 0.13, repeat: true, yOffset: 0 },
    { name: 'mid', src: './assets/user/game/bg_03_mid_city.png', parallax: 0.28, repeat: true, yOffset: 0 },
    { name: 'roof', src: './assets/user/game/bg_06_roof.png', parallax: 0.42, repeat: true, yOffset: 0 },
    { name: 'train', src: './assets/user/game/bg_04_train.png', parallax: 0.72, repeat: true, yOffset: 0 }
  ].map(layer => {
    const image = new Image();
    image.src = `${layer.src}?v=${layerVersion}`;
    return { ...layer, image };
  });

  const floor = new Image();
  floor.src = './assets/user/game/fx_floor_wet.png?v=' + layerVersion;

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
    for (let x = offset - destW; x < VIEW_W + destW; x += destW) {
      ctx.drawImage(image, Math.round(x), y, destW, destH);
    }
    ctx.restore();
    return true;
  }

  function drawFloor() {
    if (!floor.complete || !floor.naturalWidth) {
      rect(0, GROUND_Y + 2, VIEW_W, VIEW_H - GROUND_Y, '#12151b');
      return false;
    }
    const tileW = Math.round(floor.naturalWidth * 2.0);
    const tileH = Math.round(floor.naturalHeight * 2.0);
    const y = GROUND_Y + 2;
    const rawOffset = -Math.floor(cameraX * 1.0);
    const offset = ((rawOffset % tileW) + tileW) % tileW;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let x = offset - tileW; x < VIEW_W + tileW; x += tileW) {
      ctx.drawImage(floor, Math.round(x), y, tileW, tileH);
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
    drawFloor();
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
