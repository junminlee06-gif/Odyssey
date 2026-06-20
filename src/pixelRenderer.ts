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
const GROUND_Y = 171

const palette = {
  ink: '#07090b',
  night: '#101821',
  cloud: '#1d2730',
  smoke: '#293238',
  steelDark: '#202725',
  steel: '#3c4440',
  rail: '#6e684f',
  rust: '#75462d',
  rustDark: '#3b2119',
  brass: '#b69a57',
  paper: '#c8b57c',
  paperDark: '#6b5631',
  olive: '#3a422f',
  coat: '#272f31',
  coatHi: '#4f5a55',
  skin: '#8d6b4d',
  red: '#8d2d25',
  white: '#d8cfaa',
  black: '#050505'
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
  clear(ctx)
  drawBackground(ctx, state)
  drawFarStation(ctx, state)
  drawWorld(ctx, entities, state)
  drawPlayer(ctx, state)
  drawForeground(ctx, state)
}

function clear(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = palette.ink
  ctx.fillRect(0, 0, VW, VH)
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

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = palette.white, size = 5) {
  ctx.fillStyle = color
  ctx.font = `${size}px monospace`
  ctx.fillText(value, Math.round(x), Math.round(y))
}

function sx(worldX: number, state: PixelRenderState) {
  return Math.round(worldX - state.camera)
}

function drawBackground(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VH)
  gradient.addColorStop(0, '#111b26')
  gradient.addColorStop(0.55, '#101316')
  gradient.addColorStop(1, '#090909')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, VW, VH)

  for (let i = 0; i < 70; i += 1) {
    const x = (i * 53 - Math.round(state.camera * 0.08)) % (VW + 60) - 30
    const y = 20 + ((i * 37) % 70)
    const w = 20 + ((i * 11) % 35)
    px(ctx, x, y, w, 2, i % 3 === 0 ? '#1b252b' : '#151e24')
  }

  for (let x = -80 - (state.camera * 0.1) % 140; x < VW + 80; x += 140) {
    px(ctx, x, 79, 70, 76, '#12191a')
    px(ctx, x + 12, 64, 46, 15, '#182326')
    for (let wy = 91; wy < 148; wy += 13) {
      px(ctx, x + 10, wy, 8, 5, '#273235')
      px(ctx, x + 30, wy + 2, 10, 4, '#222c2f')
      px(ctx, x + 52, wy, 7, 5, '#303531')
    }
  }
}

function drawFarStation(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const roofOffset = Math.round(state.camera * 0.32)
  for (let x = -160 - (roofOffset % 96); x < VW + 160; x += 96) {
    line(ctx, x, 28, x + 80, 112, '#334044')
    line(ctx, x + 80, 28, x, 112, '#202a2e')
    px(ctx, x + 22, 35, 36, 4, '#3e4c4e')
    px(ctx, x + 35, 49, 7, 4, '#1b2326')
    px(ctx, x + 10, 74, 18, 3, '#2d3a3d')
  }

  px(ctx, 0, 103, VW, 9, '#1e2526')
  for (let x = -20 - (roofOffset % 52); x < VW + 20; x += 52) {
    px(ctx, x, 101, 3, 64, '#303532')
    px(ctx, x + 2, 101, 1, 64, '#111615')
  }
}

function drawWorld(ctx: CanvasRenderingContext2D, entities: PixelEntity[], state: PixelRenderState) {
  drawPlatform(ctx, state)
  drawPoster(ctx, sx(630, state), 103)
  drawRefugeeGroup(ctx, sx(820, state), 139, 0)
  drawBurntHorseTrain(ctx, sx(1160, state), 116)
  drawNameBoard(ctx, sx(1850, state), 92)
  drawPropagandaDesk(ctx, sx(2160, state), 133)
  drawRefugeeGroup(ctx, sx(2460, state), 139, 1)
  drawIthacaSign(ctx, sx(2700, state), 52)
  drawDieselTrain(ctx, sx(2920, state), 88, state)

  entities.forEach((entity) => {
    const x = sx(entity.x, state)
    if (x < -80 || x > VW + 80) return
    if (entity.kind === 'npc') {
      const variant = entity.id === 'survivor' ? 1 : entity.id === 'inspector' ? 2 : 0
      drawNpc(ctx, x, GROUND_Y - 31, variant)
    }
    if (entity.kind === 'gate') drawGate(ctx, x, GROUND_Y - 42)
    drawInteractionGlyph(ctx, x, GROUND_Y - 58, state.nearId === entity.id, entity.kind)
  })
}

function drawPlatform(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  px(ctx, 0, GROUND_Y, VW, VH - GROUND_Y, '#24231d')
  px(ctx, 0, GROUND_Y, VW, 3, '#6e6147')
  px(ctx, 0, GROUND_Y + 7, VW, 4, '#353027')
  px(ctx, 0, GROUND_Y + 20, VW, 6, '#141310')
  for (let x = -((state.camera * 0.9) % 24); x < VW; x += 24) {
    px(ctx, x, GROUND_Y + 4, 18, 1, '#4b4334')
    px(ctx, x + 7, GROUND_Y + 15, 19, 1, '#393226')
  }
  const railY = GROUND_Y + 24
  px(ctx, 0, railY, VW, 2, palette.rail)
  px(ctx, 0, railY + 10, VW, 2, palette.rail)
  for (let x = -((state.camera * 1.2) % 20); x < VW; x += 20) {
    px(ctx, x, railY + 1, 3, 11, '#302b22')
  }
}

function drawPoster(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y, 28, 45, palette.paperDark)
  px(ctx, x + 2, y + 2, 24, 40, palette.paper)
  px(ctx, x + 6, y + 7, 14, 13, '#6a3325')
  px(ctx, x + 9, y + 4, 8, 5, '#33221b')
  px(ctx, x + 4, y + 25, 20, 2, '#382616')
  px(ctx, x + 5, y + 30, 17, 2, '#382616')
  px(ctx, x + 18, y + 37, 7, 5, '#8b2d25')
  for (let i = 0; i < 4; i += 1) px(ctx, x + 3 + i * 5, y + 42 - i, 3, 1, '#2a1c14')
}

function drawBurntHorseTrain(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y + 22, 92, 29, '#231815')
  px(ctx, x + 4, y + 19, 85, 4, palette.rust)
  px(ctx, x + 16, y + 11, 43, 12, '#2b1c16')
  px(ctx, x + 58, y + 3, 13, 21, '#1d1613')
  px(ctx, x + 70, y + 10, 24, 7, '#352017')
  px(ctx, x + 76, y + 4, 8, 6, '#241714')
  px(ctx, x + 10, y + 47, 13, 13, '#0d0d0d')
  px(ctx, x + 64, y + 47, 13, 13, '#0d0d0d')
  px(ctx, x + 14, y + 50, 5, 5, '#554431')
  px(ctx, x + 68, y + 50, 5, 5, '#554431')
  for (let i = 0; i < 6; i += 1) px(ctx, x + 5 + i * 13, y + 26 + (i % 2) * 4, 8, 2, '#6d3e29')
  px(ctx, x + 40, y + 7, 5, 38, '#0f0f0d')
  px(ctx, x + 43, y - 5, 7, 12, '#283137')
}

function drawNameBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y, 68, 61, '#0d1415')
  px(ctx, x + 2, y + 2, 64, 57, '#151e1f')
  px(ctx, x, y, 68, 3, palette.brass)
  text(ctx, 'RETURN LIST', x + 6, y + 12, palette.brass, 5)
  for (let i = 0; i < 6; i += 1) {
    px(ctx, x + 7, y + 18 + i * 6, 43 + (i % 2) * 9, 1, i === 1 ? palette.red : '#827555')
    px(ctx, x + 56, y + 17 + i * 6, 4, 3, '#33231a')
  }
  px(ctx, x + 51, y + 41, 11, 10, '#050505')
}

function drawPropagandaDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y + 18, 54, 15, '#2d241b')
  px(ctx, x + 3, y + 10, 16, 9, palette.paper)
  px(ctx, x + 23, y + 5, 18, 13, '#c1a766')
  px(ctx, x + 27, y + 8, 10, 4, '#3b2119')
  px(ctx, x + 45, y + 8, 12, 24, '#2f3432')
}

function drawIthacaSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y, 104, 27, '#0d1517')
  px(ctx, x + 2, y + 2, 100, 23, '#121b1d')
  for (let i = 0; i < 7; i += 1) px(ctx, x + 12 + i * 12, y + 7, 8, 1, palette.brass)
  text(ctx, 'ITHACA', x + 34, y + 18, '#d0bd75', 7)
  px(ctx, x + 10, y + 31, 5, 24, '#262b28')
  px(ctx, x + 89, y + 31, 5, 24, '#262b28')
}

function drawDieselTrain(ctx: CanvasRenderingContext2D, x: number, y: number, state: PixelRenderState) {
  px(ctx, x, y + 34, 154, 48, '#1c2321')
  px(ctx, x + 5, y + 39, 144, 37, '#26302d')
  px(ctx, x + 12, y + 20, 54, 25, '#161d1d')
  px(ctx, x + 24, y + 26, 14, 9, '#33434a')
  px(ctx, x + 43, y + 26, 14, 9, '#33434a')
  px(ctx, x + 72, y + 24, 45, 10, '#0e1414')
  px(ctx, x + 83, y + 10, 18, 15, '#111616')
  px(ctx, x + 118, y + 47, 25, 18, '#121615')
  px(ctx, x + 7, y + 55, 108, 3, palette.brass)
  text(ctx, 'ITHACA', x + 14, y + 50, palette.brass, 6)
  for (let i = 0; i < 4; i += 1) {
    px(ctx, x + 18 + i * 32, y + 77, 16, 16, '#070707')
    px(ctx, x + 22 + i * 32, y + 81, 8, 8, '#5c5240')
  }
  const smoke = Math.floor(state.time / 240) % 4
  for (let i = 0; i < 4; i += 1) {
    px(ctx, x + 84 + i * 7 - smoke * 2, y + 3 - i * 6, 10 + i * 2, 4, '#303b3f')
  }
}

function drawRefugeeGroup(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  for (let i = 0; i < 4; i += 1) {
    const ox = x + i * 12
    const h = 22 + ((i + variant) % 2) * 5
    px(ctx, ox + 4, y - h - 6, 7, 7, '#3a2b22')
    px(ctx, ox + 2, y - h, 11, h, i % 2 ? '#34392f' : '#2b302f')
    px(ctx, ox, y - 10, 15, 8, '#5b452e')
    px(ctx, ox + 2, y, 4, 9, '#191919')
    px(ctx, ox + 9, y, 4, 9, '#191919')
  }
}

function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  const coat = variant === 0 ? '#3d463e' : variant === 1 ? '#2d302d' : '#111819'
  const trim = variant === 2 ? palette.brass : variant === 0 ? '#8a6d45' : '#6a5038'
  px(ctx, x - 5, y - 9, 10, 9, palette.skin)
  px(ctx, x - 6, y - 12, 12, 5, variant === 2 ? '#0a0a0a' : '#211713')
  px(ctx, x - 8, y, 16, 25, coat)
  px(ctx, x - 6, y + 5, 12, 2, trim)
  px(ctx, x - 12, y + 6, 5, 16, coat)
  px(ctx, x + 7, y + 6, 5, 16, coat)
  if (variant === 0) {
    px(ctx, x + 11, y - 3, 7, 15, palette.paper)
    px(ctx, x + 13, y, 3, 1, palette.red)
  }
  if (variant === 1) {
    px(ctx, x + 7, y + 15, 10, 10, '#5b452e')
  }
  if (variant === 2) {
    px(ctx, x + 9, y + 7, 12, 5, '#151515')
    px(ctx, x + 19, y + 4, 3, 10, palette.brass)
    px(ctx, x - 1, y - 6, 4, 2, '#bfc2a0')
  }
  px(ctx, x - 6, y + 25, 4, 8, '#0d0d0d')
  px(ctx, x + 2, y + 25, 4, 8, '#0d0d0d')
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x - 28, y + 23, 58, 9, '#1c1914')
  px(ctx, x - 22, y + 6, 44, 17, '#181e1d')
  px(ctx, x - 17, y + 9, 34, 3, palette.brass)
  px(ctx, x - 13, y + 15, 26, 2, '#6e1f1b')
}

function drawInteractionGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean, kind: PixelEntityKind) {
  const w = active ? 26 : 18
  const h = active ? 12 : 8
  const color = active ? palette.paper : kind === 'npc' ? '#6f3a2c' : '#514936'
  px(ctx, x - w / 2, y, w, h, color)
  px(ctx, x - w / 2 + 1, y + 1, w - 2, h - 2, active ? '#241b13' : '#111514')
  text(ctx, active ? 'E' : '...', x - 3, y + h - 3, active ? palette.paper : '#8d8060', active ? 7 : 5)
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  const x = sx(state.playerX, state)
  const y = GROUND_Y - 43 - Math.round(state.playerY)
  const flip = state.facing === 'left' ? -1 : 1
  const step = state.walking ? Math.floor(state.time / 120) % 2 : 0
  function rx(dx: number) { return x + dx * flip }

  px(ctx, x - 7, y - 10, 14, 12, palette.skin)
  px(ctx, x - 8, y - 13, 16, 5, '#2a1b15')
  px(ctx, x + 2 * flip, y - 4, 3, 2, '#0d0d0d')
  px(ctx, x - 10, y + 1, 20, 33, palette.coat)
  px(ctx, x - 8, y + 3, 16, 4, palette.coatHi)
  px(ctx, x + 6 * flip, y + 5, 4, 29, '#1c2223')
  px(ctx, x - 13 * flip, y + 6, 5, 20, palette.coat)
  px(ctx, x + 10 * flip, y + 8, 7, 15, '#31312b')
  px(ctx, rx(-2), y + 10, 4, 3, palette.brass)
  px(ctx, rx(4), y + 14, 5, 3, palette.brass)
  px(ctx, rx(-6), y + 18, 6, 4, '#7f2922')
  px(ctx, rx(9), y + 19, 8, 10, '#211a14')
  px(ctx, x - 8 - step * 2, y + 34, 5, 10, '#111111')
  px(ctx, x + 3 + step * 2, y + 34, 5, 10, '#111111')
  px(ctx, x - 10 - step * 2, y + 43, 7, 3, '#060606')
  px(ctx, x + 3 + step * 2, y + 43, 8, 3, '#060606')
}

function drawForeground(ctx: CanvasRenderingContext2D, state: PixelRenderState) {
  for (let x = -40 - (state.camera % 160); x < VW + 40; x += 160) {
    px(ctx, x, 34, 5, 150, '#0b0d0d')
    px(ctx, x + 2, 34, 1, 150, '#303632')
  }
  px(ctx, 0, 0, VW, 1, '#000000')
  px(ctx, 0, VH - 1, VW, 1, '#000000')
  for (let y = 0; y < VH; y += 2) px(ctx, 0, y, VW, 1, 'rgba(0,0,0,0.08)')
}
