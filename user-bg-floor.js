(() => {
  const layerVersion = 'train-cars-1';
  const BG_SCALE = 2.0;
  const layers = [
    { name: 'sky', src: './assets/user/game/bg_01_sky.png', parallax: 0.03 },
    { name: 'far', src: './assets/user/game/bg_02_far_city.png', parallax: 0.13 },
    { name: 'mid', src: './assets/user/game/bg_03_mid_city.png', parallax: 0.28 },
    { name: 'roof', src: './assets/user/game/bg_06_roof.png', parallax: 0.42 }
  ].map(layer => {
    const image = new Image();
    image.src = `${layer.src}?v=${layerVersion}`;
    return { ...layer, image };
  });

  const floor = new Image();
  floor.src = './assets/user/game/fx_floor_wet.png?v=' + layerVersion;

  const trainCar = new Image();
  trainCar.src = './assets/user/game/obj_car.png?v=' + layerVersion;

  const loco = new Image();
  loco.src = './assets/user/game/obj_loco.png?v=' + layerVersion;

  function drawRepeatedImage(image, parallax, y, width, height) {
    const rawOffset = -Math.floor(cameraX * parallax);
    const offset = ((rawOffset % width) + width) % width;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let x = offset - width; x < VIEW_W + width; x += width) {
      ctx.drawImage(image, Math.round(x), y, width, height);
    }
    ctx.restore();
  }

  function drawLayer(layer) {
    const image = layer.image;
    if (!image.complete || !image.naturalWidth) return false;
    const width = Math.round(VIEW_W * BG_SCALE);
    const height = Math.round(image.naturalHeight * width / image.naturalWidth);
    drawRepeatedImage(image, layer.parallax, 0, width, height);
    return true;
  }

  function drawTrainCars() {
    if (!trainCar.complete || !trainCar.naturalWidth) return false;

    const parallax = 0.72;
    const carW = 420;
    const carH = Math.round(trainCar.naturalHeight * carW / trainCar.naturalWidth);
    const y = 242;
    const gap = -8;
    const step = carW + gap;
    const rawOffset = -Math.floor(cameraX * parallax);
    const offset = ((rawOffset % step) + step) % step;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (let x = offset - step * 2; x < VIEW_W + step * 2; x += step) {
      ctx.drawImage(trainCar, Math.round(x), y, carW, carH);
    }

    if (loco.complete && loco.naturalWidth) {
      const locoW = 420;
      const locoH = Math.round(loco.naturalHeight * locoW / loco.naturalWidth);
      const locoX = Math.round(-cameraX * parallax - 260);
      if (locoX > -locoW - 80 && locoX < VIEW_W + 80) {
        ctx.drawImage(loco, locoX, y - 8, locoW, locoH);
      }
    }

    ctx.restore();
    return true;
  }

  function drawFloor() {
    if (!floor.complete || !floor.naturalWidth) {
      rect(0, GROUND_Y + 2, VIEW_W, VIEW_H - GROUND_Y, '#12151b');
      return false;
    }
    const tileW = Math.round(floor.naturalWidth * 2);
    const tileH = Math.round(floor.naturalHeight * 2);
    drawRepeatedImage(floor, 1.0, GROUND_Y + 2, tileW, tileH);
    return true;
  }

  function drawLayeredBackground() {
    rect(0, 0, VIEW_W, VIEW_H, '#050607');
    let loaded = 0;
    for (const layer of layers) {
      if (drawLayer(layer)) loaded++;
    }
    drawTrainCars();
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
