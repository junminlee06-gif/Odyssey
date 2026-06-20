export type PixelEntityKind = 'object' | 'npc' | 'gate'

export type PixelEntity = {
  id: string
  title: string
  x: number
  kind: PixelEntityKind
}

export type PixelRenderState = {
  playerX: number
  playerY: number
  camera: number
  worldWidth: number
  facing: 'left' | 'right'
  walking: boolean
  time: number
  nearId?: string
  inspected: boolean
  cutscene?: boolean
}

const VW = 384
const VH = 216
const GROUND_Y = 172

const c = {
  ink: '#050607',
  outline: '#070808',
  sky0: '#111923',
  sky1: '#101316',
  fog: '#202b31',
  fog2: '#2d3536',
  steel0: '#151c1d',
  steel1: '#25302e',
  steel2: '#3d4841',
  iron: '#5e6358',
  rail: '#7a6d50',
  rust0: '#2b1713',
  rust1: '#5a3526',
  rust2: '#8c5434',
  brass0: '#6f5b31',
  brass1: '#b69a57',
  brass2: '#d2bd75',
  paper0: '#5f4729',
  paper1: '#b59d65',
  paper2: '#d4c085',
  olive0: '#20261d',
  olive1: '#3b4431',
  olive2: '#566145',
  coat0: '#151a1b',
  coat1: '#273032',
  coat2: '#46534f',
  skin0: '#4a3022',
  skin1: '#8a694d',
  red: '#8d2c25',
  white: '#d8ceaa',
  black: '#000000',
  glass: '#44565e'
}

const playerIdle = [
  '.....kkkk.....',
  '....kkkkkk....',
  '....kssss.....',
  '....ksssk.....',
  '.....kkk......',
  '...ooooooo....',
  '..occccccob...',
  '.oocccchcoob..',
  '.occcchhcco...',
  '.occcbbccco...',
  '.occcbbccco...',
  '..occbbcob....',
  '..occbbco.....',
  '..occbbco.....',
  '..occcccco....',
  '...cccccc.....',
  '...cc..cc.....',
  '...cc..cc.....',
  '...ll..ll.....',
  '..lll..lll....',
  '..ll....ll....',
  '.bbb....bbb...',
  '.bb......bb...',
  '..............'
]

const playerWalkA = [
  '.....kkkk.....',
  '....kkkkkk....',
  '....kssss.....',
  '....ksssk.....',
  '.....kkk......',
  '...ooooooo....',
  '..occccccob...',
  '.oocccchcoob..',
  '.occcchhcco...',
  '.occcbbccco...',
  '.occcbbccco...',
  '..occbbcob....',
  '..occbbco.....',
  '..occbbco.....',
  '..occcccco....',
  '...cccccc.....',
  '..ccc..cc.....',
  '..cc...ccc....',
  '..ll....ll....',
  '.lll....lll...',
  '.ll......ll...',
  'bbb......bbb..',
  'bb........bb..',
  '..............'
]

const playerWalkB = [
  '.....kkkk.....',
  '....kkkkkk....',
  '....kssss.....',
  '....ksssk.....',
  '.....kkk......',
  '...ooooooo....',
  '..occccccob...',
  '.oocccchcoob..',
  '.occcchhcco...',
  '.occcbbccco...',
  '.occcbbccco...',
  '..occbbcob....',
  '..occbbco.....',
  '..occbbco.....',
  '..occcccco....',
  '...cccccc.....',
  '...cc..ccc....',
  '..ccc...cc....',
  '..ll....ll....',
  '.lll....lll...',
  '.ll......ll...',
  'bbb......bbb..',
  'bb........bb..',
  '..............'
]

const npcBase = [
  '...kkkk...',
  '..kkkkkk..',
  '..kssss...',
  '...sss....',
  '..ooooo...',
  '.occccob..',
  '.occhcco..',
  '.occhcco..',
  '.occcccco.',
  '.occbbco..',
  '..ccbbco..',
  '..ccccco..',
  '..cc..cc..',
  '..ll..ll..',
  '.lll..lll.',
  '.bb....bb.'
]

const palettePlayer: Record<string, string> = {
  k: c.outline,
  s: c.skin1,
  o: c.outline,
  c: c.coat1,
  h: c.coat2,
  b: c.brass1,
  l: c.black
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5)
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5)
  ctx.stroke()
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = c.white, size = 5) {
  ctx.fillStyle = color
  ctx.font = `${size}px monospace`
  ctx.fillText(value, Math.round(x), Math.round(y))
}

function sx(worldX: number, state: PixelRenderState) {
  return Math.round(worldX - state.camera)
}

function sprite(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  palette: Record<string, string>,
  x: number,
  y: number,
  scale = 1,
  flip = false
) {
  matrix.forEach((row, rowIndex) => {
    const chars = [...row]
    chars.forEach((key, colIndex) => {
      if (key === '.' || key === ' ') return
      const color = palette[key]
      if (!color) return
      const drawCol = flip ? chars.length - 1 - colIndex : colIndex
      px(ctx, x + drawCol * scale, y + rowIndex * scale, scale, scale, color)
    })
  })
}

function noiseTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colorA: string, colorB: string, seed = 0) {
  px(ctx, x, y, w, h, colorA)
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = (yy + seed) % 4; xx < w; xx += 7) {
      px(ctx, x + xx, y + yy, 1, 1, colorB)
    }
  }
}

export function renderPixelScene(
  canvas: HTMLCanvasElement,
  entities: PixelEntity[],
  state: PixelRenderState
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (canvas.width !== VW || canvas.height !== VH) {
    canvas.width = VW
    canvas.height = VH
  }
  ctx.imageSmoothingEnabled = false
  px(ctx, 0, 0, VW, VH, c.ink)
  drawSky(ctx, state)
  drawStationShell(ctx, state)
  drawWorldDetails(ctx, state)
  drawEntities(ctx, entities, state)
  drawPlayer(ctx, state)
  drawRainAndForeground(ctx, state)
}

function drawSky(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VH)
  gradient.addColorStop(0, c.sky0)
  gradient.addColorStop(0.54, c.sky1)
  gradient.addColorStop(1, '#080908')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, VW, VH)

  const cloudShift = Math.round(state.camera * 0.06)
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 47 - cloudShift) % (VW + 80) - 40
    const y = 18 + ((i * 19) % 62)
    px(ctx, x, y, 18 + (i % 5) * 7, 2, i % 2 ? '#172129' : '#202a30')
    if (i % 3 === 0) px(ctx, x + 8, y + 3, 26, 1, '#121a20')
  }

  for (let x = -70 - Math.round(state.camera * 0.12) % 120; x < VW + 80; x += 120) {
    noiseTile(ctx, x, 94, 64, 56, '#11191a', '#1b2525', 1)
    px(ctx, x + 9, 82, 44, 12, '#172326')
    px(ctx, x + 18, 68, 19, 14, '#121c1f')
    for (let y = 104; y < 144; y += 11) {
      px(ctx, x + 10, y, 6, 4, '#293337')
      px(ctx, x + 29, y + 2, 8, 3, '#222d31')
      px(ctx, x + 48, y, 5, 4, '#32352e')
    }
  }
}

function drawStationShell(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const shift = Math.round(state.camera * 0.28)
  for (let x = -120 - shift % 96; x < VW + 120; x += 96) {
    line(ctx, x, 24, x + 86, 118, '#344449')
    line(ctx, x + 86, 25, x, 118, '#182327')
    line(ctx, x + 4, 41, x + 72, 116, '#263338')
    px(ctx, x + 23, 33, 38, 4, '#405158')
    px(ctx, x + 30, 45, 7, 5, '#182226')
    px(ctx, x + 42, 58, 5, 4, '#2f4148')
  }
  px(ctx, 0, 105, VW, 9, '#1d2525')
  px(ctx, 0, 111, VW, 2, '#3b4038')
  for (let x = -20 - shift % 50; x < VW + 30; x += 50) {
    px(ctx, x, 102, 4, 68, c.outline)
    px(ctx, x + 2, 102, 1, 68, '#3a413b')
    px(ctx, x - 7, 110, 17, 3, '#252c2a')
  }
}

function drawWorldDetails(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  drawPlatform(ctx, state)
  drawPoster(ctx, sx(630, state), 105)
  drawRefugees(ctx, sx(810, state), 143, 0)
  drawBurntHorseTrain(ctx, sx(1152, state), 114)
  drawBrokenSteps(ctx, sx(1690, state), 146)
  drawNameBoard(ctx, sx(1840, state), 91)
  drawPropagandaDesk(ctx, sx(2148, state), 134)
  drawRefugees(ctx, sx(2460, state), 143, 1)
  drawIthacaSign(ctx, sx(2674, state), 51)
  drawDieselTrain(ctx, sx(2890, state), 88, state)
}

function drawPlatform(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  noiseTile(ctx, 0, GROUND_Y, VW, VH - GROUND_Y, '#22211c', '#312b20', 2)
  px(ctx, 0, GROUND_Y, VW, 3, '#72644a')
  px(ctx, 0, GROUND_Y + 4, VW, 2, '#393327')
  px(ctx, 0, GROUND_Y + 18, VW, 3, '#0f0f0c')

  const tileOffset = Math.round(state.camera * 0.85) % 32
  for (let x = -tileOffset; x < VW; x += 32) {
    px(ctx, x, GROUND_Y + 6, 24, 1, '#4c4434')
    px(ctx, x + 26, GROUND_Y + 8, 4, 1, '#151410')
    px(ctx, x + 9, GROUND_Y + 14, 18, 1, '#393226')
    px(ctx, x + 5, GROUND_Y + 3, 3, 1, '#8a7650')
  }

  const railY = GROUND_Y + 25
  px(ctx, 0, railY, VW, 2, c.rail)
  px(ctx, 0, railY + 10, VW, 2, c.rail)
  px(ctx, 0, railY + 3, VW, 1, '#332d22')
  for (let x = -Math.round(state.camera * 1.15) % 22; x < VW; x += 22) {
    px(ctx, x, railY + 1, 4, 12, '#2b261d')
    px(ctx, x + 1, railY + 2, 1, 9, '#5a4d36')
  }

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 59 - Math.round(state.camera * 1.1)) % (VW + 80) - 40
    const y = GROUND_Y + 7 + (i % 5) * 3
    px(ctx, x, y, 11 + (i % 4), 1, i % 2 ? '#5c5746' : '#151411')
  }
}

function drawPoster(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -50 || x > VW + 50) return
  px(ctx, x - 2, y - 2, 34, 53, c.outline)
  noiseTile(ctx, x, y, 30, 48, c.paper1, c.paper2, 3)
  px(ctx, x + 3, y + 4, 24, 1, c.paper0)
  px(ctx, x + 7, y + 9, 16, 15, '#6b3326')
  px(ctx, x + 10, y + 6, 9, 6, '#2c1b14')
  px(ctx, x + 9, y + 15, 10, 2, c.skin1)
  px(ctx, x + 12, y + 14, 2, 1, c.outline)
  px(ctx, x + 6, y + 28, 19, 2, '#332217')
  px(ctx, x + 5, y + 33, 21, 2, '#332217')
  px(ctx, x + 16, y + 40, 10, 6, c.red)
  px(ctx, x + 23, y + 36, 5, 12, '#352015')
  px(ctx, x + 2, y + 46, 8, 3, c.outline)
  px(ctx, x + 11, y + 45, 5, 2, c.outline)
}

function drawBurntHorseTrain(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -150 || x > VW + 100) return
  px(ctx, x + 2, y + 28, 114, 31, c.outline)
  noiseTile(ctx, x + 5, y + 24, 104, 35, c.rust0, c.rust1, 1)
  px(ctx, x + 14, y + 17, 55, 11, '#241712')
  px(ctx, x + 18, y + 13, 43, 5, c.rust1)
  px(ctx, x + 65, y + 2, 14, 25, c.outline)
  px(ctx, x + 68, y + 4, 8, 20, '#1b1614')
  px(ctx, x + 80, y + 9, 29, 9, c.rust0)
  px(ctx, x + 91, y + 3, 8, 7, '#1b1411')
  px(ctx, x + 15, y + 49, 16, 16, c.black)
  px(ctx, x + 74, y + 49, 16, 16, c.black)
  px(ctx, x + 19, y + 53, 8, 8, '#554632')
  px(ctx, x + 78, y + 53, 8, 8, '#554632')
  for (let i = 0; i < 7; i += 1) {
    px(ctx, x + 12 + i * 13, y + 31 + (i % 2) * 5, 8, 2, c.rust2)
    px(ctx, x + 13 + i * 13, y + 34 + (i % 3), 5, 1, '#17100d')
  }
  px(ctx, x + 49, y + 8, 4, 41, c.outline)
  px(ctx, x + 53, y + 0, 8, 10, '#2e383c')
  px(ctx, x + 58, y - 7, 12, 4, '#394449')
  px(ctx, x + 66, y - 13, 14, 3, '#263137')
}

function drawBrokenSteps(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -80 || x > VW + 50) return
  for (let i = 0; i < 5; i += 1) {
    px(ctx, x + i * 16, y + i * 4, 40 - i * 4, 5, '#3a3428')
    px(ctx, x + i * 16, y + i * 4, 40 - i * 4, 1, '#75664b')
  }
  px(ctx, x + 65, y + 10, 17, 2, c.rust2)
  px(ctx, x + 78, y + 6, 3, 16, c.outline)
}

function drawNameBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -90 || x > VW + 40) return
  px(ctx, x - 3, y - 3, 76, 69, c.outline)
  noiseTile(ctx, x, y, 70, 63, '#111a1b', '#1d2829', 0)
  px(ctx, x, y, 70, 3, c.brass1)
  text(ctx, 'RETURN LIST', x + 6, y + 13, c.brass2, 5)
  for (let i = 0; i < 7; i += 1) {
    const yy = y + 20 + i * 6
    px(ctx, x + 7, yy, 42 + (i % 3) * 7, 1, i === 2 ? c.red : '#827555')
    px(ctx, x + 56, yy - 1, 5, 3, '#322118')
  }
  px(ctx, x + 51, y + 43, 12, 12, c.black)
  px(ctx, x + 53, y + 45, 8, 8, '#121212')
}

function drawPropagandaDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -80 || x > VW + 40) return
  px(ctx, x - 2, y + 17, 62, 19, c.outline)
  noiseTile(ctx, x, y + 18, 58, 17, '#2f251b', '#51412b', 2)
  px(ctx, x + 5, y + 9, 17, 10, c.paper2)
  px(ctx, x + 7, y + 12, 13, 1, c.red)
  px(ctx, x + 25, y + 5, 19, 14, c.paper1)
  px(ctx, x + 29, y + 8, 11, 4, '#3a2218')
  px(ctx, x + 47, y + 7, 13, 28, '#252b2b')
  px(ctx, x + 50, y + 10, 7, 1, c.brass1)
}

function drawIthacaSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (x < -120 || x > VW + 50) return
  px(ctx, x - 3, y - 3, 112, 33, c.outline)
  noiseTile(ctx, x, y, 106, 27, '#0d1517', '#162326', 2)
  px(ctx, x + 3, y + 3, 100, 1, c.brass0)
  for (let i = 0; i < 7; i += 1) px(ctx, x + 12 + i * 12, y + 8, 8, 1, c.brass1)
  text(ctx, 'ITHACA', x + 34, y + 19, c.brass2, 7)
  px(ctx, x + 10, y + 31, 5, 28, c.outline)
  px(ctx, x + 91, y + 31, 5, 28, c.outline)
  px(ctx, x + 12, y + 31, 1, 28, '#3e443e')
  px(ctx, x + 93, y + 31, 1, 28, '#3e443e')
}

function drawDieselTrain(ctx: CanvasRenderingContext2D, x: number, y: number, state: PixelRenderState) {
  if (x < -180 || x > VW + 80) return
  px(ctx, x - 3, y + 31, 172, 58, c.outline)
  noiseTile(ctx, x, y + 34, 164, 50, '#202a27', '#313b35', 3)
  px(ctx, x + 6, y + 39, 152, 6, '#39423c')
  px(ctx, x + 9, y + 55, 119, 3, c.brass1)
  px(ctx, x + 13, y + 19, 61, 27, c.outline)
  px(ctx, x + 17, y + 23, 53, 18, '#171f20')
  px(ctx, x + 26, y + 28, 13, 8, c.glass)
  px(ctx, x + 45, y + 28, 13, 8, c.glass)
  px(ctx, x + 83, y + 23, 49, 12, c.outline)
  px(ctx, x + 87, y + 26, 41, 6, '#121818')
  px(ctx, x + 96, y + 9, 22, 15, c.outline)
  px(ctx, x + 101, y + 12, 12, 10, '#121819')
  text(ctx, 'ITHACA', x + 15, y + 51, c.brass2, 6)
  px(ctx, x + 133, y + 49, 23, 20, '#111514')
  px(ctx, x + 138, y + 52, 12, 1, c.brass0)
  for (let i = 0; i < 5; i += 1) {
    px(ctx, x + 18 + i * 31, y + 80, 17, 17, c.black)
    px(ctx, x + 22 + i * 31, y + 84, 9, 9, '#5f553e')
    px(ctx, x + 25 + i * 31, y + 87, 3, 3, '#1c1c1a')
  }
  const smoke = Math.floor(state.time / 210) % 5
  for (let i = 0; i < 5; i += 1) {
    px(ctx, x + 101 + i * 8 - smoke * 2, y + 4 - i * 6, 10 + i * 2, 3, '#2d393d')
    if (i % 2 === 0) px(ctx, x + 107 + i * 8 - smoke * 2, y + 1 - i * 6, 7 + i, 2, '#3b4649')
  }
}

function drawRefugees(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  if (x < -90 || x > VW + 40) return
  for (let i = 0; i < 5; i += 1) {
    const ox = x + i * 11
    const h = 19 + ((i + variant) % 3) * 3
    px(ctx, ox + 3, y - h - 8, 8, 8, c.outline)
    px(ctx, ox + 4, y - h - 7, 6, 6, i % 2 ? '#6f5140' : '#493126')
    px(ctx, ox + 2, y - h, 12, h, i % 2 ? '#30372d' : '#262f31')
    px(ctx, ox + 1, y - 10, 14, 7, '#5b452f')
    px(ctx, ox + 3, y, 4, 8, c.black)
    px(ctx, ox + 9, y, 4, 8, c.black)
    if (i === 2) px(ctx, ox + 13, y - h + 4, 7, 8, c.paper0)
  }
}

function drawEntities(ctx: CanvasRenderingContext2D, entities: PixelEntity[], state: PixelRenderState) {
  entities.forEach((entity) => {
    const x = sx(entity.x, state)
    if (x < -80 || x > VW + 80) return
    if (entity.kind === 'npc') {
      const variant = entity.id === 'survivor' ? 1 : entity.id === 'inspector' ? 2 : 0
      drawNpc(ctx, x, GROUND_Y - 37, variant)
    }
    if (entity.kind === 'gate') drawGate(ctx, x, GROUND_Y - 45)
    drawInteractionGlyph(ctx, x, GROUND_Y - 63, state.nearId === entity.id, entity.kind)
  })
}

function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  const npcPalette = {
    ...palettePlayer,
    c: variant === 0 ? '#39473e' : variant === 1 ? '#2b302d' : '#12191a',
    h: variant === 0 ? '#63705a' : variant === 1 ? '#474038' : '#3c4848',
    b: variant === 2 ? c.brass2 : variant === 0 ? '#a57d45' : '#6b4e34',
    s: variant === 1 ? '#6f5140' : c.skin1
  }
  sprite(ctx, npcBase, npcPalette, x - 10, y, 2, false)
  if (variant === 0) {
    px(ctx, x + 11, y + 10, 8, 16, c.paper2)
    px(ctx, x + 13, y + 14, 4, 1, c.red)
  }
  if (variant === 1) {
    px(ctx, x + 9, y + 28, 12, 10, '#5b452f')
    px(ctx, x + 12, y + 31, 6, 1, '#9f7a4d')
  }
  if (variant === 2) {
    px(ctx, x + 10, y + 17, 16, 5, c.outline)
    px(ctx, x + 22, y + 14, 3, 12, c.brass1)
    px(ctx, x - 1, y + 5, 4, 2, c.white)
  }
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x - 32, y + 30, 64, 9, c.outline)
  noiseTile(ctx, x - 27, y + 12, 54, 19, c.steel0, c.steel1, 1)
  px(ctx, x - 21, y + 16, 41, 2, c.brass1)
  px(ctx, x - 15, y + 22, 30, 2, c.red)
  px(ctx, x - 30, y + 38, 60, 3, '#3b3326')
}

function drawInteractionGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean, kind: PixelEntityKind) {
  const width = active ? 28 : 18
  const height = active ? 13 : 9
  px(ctx, x - width / 2 - 1, y - 1, width + 2, height + 2, c.outline)
  px(ctx, x - width / 2, y, width, height, active ? c.paper2 : kind === 'npc' ? '#5d3026' : '#353327')
  px(ctx, x - width / 2 + 2, y + 2, width - 4, height - 4, active ? '#241b13' : '#111514')
  text(ctx, active ? 'E' : '...', x - (active ? 3 : 5), y + height - 3, active ? c.paper2 : '#978763', active ? 7 : 5)
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const x = sx(state.playerX, state) - 14
  const y = GROUND_Y - 48 - Math.round(state.playerY)
  const frame = state.walking ? (Math.floor(state.time / 130) % 2 === 0 ? playerWalkA : playerWalkB) : playerIdle
  sprite(ctx, frame, palettePlayer, x, y, 2, state.facing === 'left')
  px(ctx, x + (state.facing === 'left' ? 7 : 22), y + 32, 4, 8, '#1a1410')
  px(ctx, x + (state.facing === 'left' ? 4 : 26), y + 35, 5, 5, '#765333')
}

function drawRainAndForeground(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const rainShift = Math.floor(state.time / 48) % 24
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 37 + rainShift * 3) % VW
    const y = (i * 19 + rainShift * 7) % VH
    px(ctx, x, y, 1, 4, 'rgba(154,173,176,0.24)')
  }
  for (let x = -50 - Math.round(state.camera) % 170; x < VW + 60; x += 170) {
    px(ctx, x, 33, 5, 151, c.outline)
    px(ctx, x + 2, 33, 1, 151, '#38403a')
    px(ctx, x - 8, 109, 20, 3, '#202725')
  }
  px(ctx, 0, 0, VW, 1, c.black)
  px(ctx, 0, VH - 1, VW, 1, c.black)
  px(ctx, 0, 0, 1, VH, c.black)
  px(ctx, VW - 1, 0, 1, VH, c.black)
  for (let y = 0; y < VH; y += 2) px(ctx, 0, y, VW, 1, 'rgba(0,0,0,0.08)')
}
