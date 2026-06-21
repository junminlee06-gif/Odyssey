(() => {
  const jobs = [
    ['heroIdle','./assets/characters/odysseus_sheet.png',0,40,56],
    ['heroIdleB','./assets/characters/odysseus_sheet.png',1,40,56],
    ['heroWalkA','./assets/characters/odysseus_sheet.png',2,40,56],
    ['heroWalkC','./assets/characters/odysseus_sheet.png',3,40,56],
    ['heroWalkB','./assets/characters/odysseus_sheet.png',4,40,56],
    ['heroWalkD','./assets/characters/odysseus_sheet.png',5,40,56],
    ['heroJump','./assets/characters/odysseus_sheet.png',6,40,56],
    ['heroFall','./assets/characters/odysseus_sheet.png',7,40,56],
    ['prop','./assets/characters/npcs_sheet.png',0,48,64],
    ['propB','./assets/characters/npcs_sheet.png',1,48,64],
    ['survivor','./assets/characters/npcs_sheet.png',2,48,64],
    ['survivorB','./assets/characters/npcs_sheet.png',3,48,64],
    ['inspector','./assets/characters/npcs_sheet.png',4,48,64],
    ['inspectorB','./assets/characters/npcs_sheet.png',5,48,64],
    ['poster','./assets/objects/objects_sheet.png',0,192,128],
    ['listBoard','./assets/objects/objects_sheet.png',1,192,128],
    ['cargo','./assets/objects/objects_sheet.png',2,192,128],
    ['checkpoint','./assets/objects/objects_sheet.png',3,192,128]
  ];
  const cache = new Map();
  function imageLoaded(image) {
    if (image.decode) return image.decode().catch(() => new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; }));
    return new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
  }
  async function loadSheet(path) {
    if (!cache.has(path)) {
      cache.set(path, fetch(path, { cache: 'no-cache' }).then(r => r.text()).then(text => {
        const image = new Image();
        const body = text.trim();
        image.src = body.startsWith('iVBOR') ? 'data:image/png;base64,' + body : path;
        return imageLoaded(image).then(() => image);
      }));
    }
    return cache.get(path);
  }
  async function crop(path, frame, fw, fh) {
    const sheet = await loadSheet(path);
    const canvas = document.createElement('canvas');
    canvas.width = fw;
    canvas.height = fh;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    const cols = Math.max(1, Math.floor(sheet.naturalWidth / fw));
    c.drawImage(sheet, (frame % cols) * fw, Math.floor(frame / cols) * fh, fw, fh, 0, 0, fw, fh);
    const out = new Image();
    out.src = canvas.toDataURL('image/png');
    await imageLoaded(out);
    return out;
  }
  async function applyPngSprites() {
    if (typeof assets === 'undefined') return;
    const replacements = await Promise.all(jobs.map(async job => [job[0], await crop(job[1], job[2], job[3], job[4])]));
    for (const [key, image] of replacements) assets[key] = image;
    if (typeof heroIdleFrames !== 'undefined') {
      heroIdleFrames[0] = assets.heroIdle;
      heroIdleFrames[1] = assets.heroIdleB;
    }
    if (typeof heroWalkFrames !== 'undefined') {
      heroWalkFrames[0] = assets.heroWalkA;
      heroWalkFrames[1] = assets.heroWalkC;
      heroWalkFrames[2] = assets.heroWalkB;
      heroWalkFrames[3] = assets.heroWalkD;
    }
  }
  applyPngSprites();
})();