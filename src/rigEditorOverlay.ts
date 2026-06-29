type RigPartKey = 'rigCape' | 'rigCoatBack' | 'rigLegBack' | 'rigArmBack' | 'rigTorso' | 'rigCoatFront' | 'rigLegFront' | 'rigArmFront' | 'rigHead'

type RigPart = {
  label: string
  x: number
  y: number
  w: number
  r: number
  ox: number
  oy: number
}

type RigConfig = Record<RigPartKey, RigPart>

const STORAGE_KEY = 'outis-rig-editor-v1'

const PART_ORDER: RigPartKey[] = [
  'rigCape',
  'rigCoatBack',
  'rigLegBack',
  'rigArmBack',
  'rigTorso',
  'rigCoatFront',
  'rigLegFront',
  'rigArmFront',
  'rigHead'
]

const DEFAULT_RIG: RigConfig = {
  rigCape: { label: '망토', x: 14, y: 37, w: 28, r: 0, ox: 88, oy: 18 },
  rigCoatBack: { label: '뒤 코트', x: 24, y: 49, w: 48, r: 0, ox: 52, oy: 16 },
  rigLegBack: { label: '뒷다리', x: 50, y: 60, w: 29, r: 0, ox: 48, oy: 16 },
  rigArmBack: { label: '뒷팔', x: 62, y: 37, w: 21, r: 0, ox: 52, oy: 12 },
  rigTorso: { label: '몸통', x: 18, y: 22, w: 64, r: 0, ox: 50, oy: 70 },
  rigCoatFront: { label: '앞 코트', x: 27, y: 50, w: 51, r: 0, ox: 54, oy: 14 },
  rigLegFront: { label: '앞다리', x: 38, y: 60, w: 29, r: 0, ox: 49, oy: 16 },
  rigArmFront: { label: '앞팔', x: 32, y: 37, w: 21, r: 0, ox: 48, oy: 12 },
  rigHead: { label: '머리', x: 41, y: 19, w: 30, r: 0, ox: 50, oy: 84 }
}

function copyDefault(): RigConfig {
  return JSON.parse(JSON.stringify(DEFAULT_RIG)) as RigConfig
}

function readConfig(): RigConfig {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return copyDefault()
    const parsed = JSON.parse(saved) as Partial<RigConfig>
    return PART_ORDER.reduce((next, key) => {
      next[key] = { ...DEFAULT_RIG[key], ...(parsed[key] ?? {}) }
      return next
    }, {} as RigConfig)
  } catch {
    return copyDefault()
  }
}

function saveConfig(config: RigConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

function applyPart(key: RigPartKey, part: RigPart) {
  const element = document.querySelector<HTMLImageElement>(`.${key}`)
  if (!element) return
  element.style.left = `${part.x}%`
  element.style.top = `${part.y}%`
  element.style.width = `${part.w}%`
  element.style.transform = `rotate(${part.r}deg)`
  element.style.transformOrigin = `${part.ox}% ${part.oy}%`
}

function applyConfig(config: RigConfig) {
  for (const key of PART_ORDER) applyPart(key, config[key])
}

function setSelectedMarker(selected: RigPartKey) {
  for (const key of PART_ORDER) {
    document.querySelector(`.${key}`)?.classList.toggle('selectedRigPart', key === selected)
  }
}

function slider(label: string, value: number, min: number, max: number, step: number, onInput: (value: number) => void) {
  const row = document.createElement('label')
  row.className = 'rigSlider'
  const caption = document.createElement('span')
  caption.textContent = label
  const range = document.createElement('input')
  range.type = 'range'
  range.min = String(min)
  range.max = String(max)
  range.step = String(step)
  range.value = String(value)
  const number = document.createElement('input')
  number.type = 'number'
  number.min = String(min)
  number.max = String(max)
  number.step = String(step)
  number.value = String(value)
  const update = (next: number) => {
    range.value = String(next)
    number.value = String(next)
    onInput(next)
  }
  range.addEventListener('input', () => update(Number(range.value)))
  number.addEventListener('input', () => update(Number(number.value)))
  row.append(caption, range, number)
  return row
}

function bootRigEditor() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('rig')) return

  let config = readConfig()
  let selected: RigPartKey = 'rigHead'

  const panel = document.createElement('aside')
  panel.className = 'rigEditor'
  document.body.appendChild(panel)

  const renderPanel = () => {
    panel.replaceChildren()

    const header = document.createElement('header')
    const title = document.createElement('b')
    title.textContent = 'OUTIS Rig Editor'
    const hint = document.createElement('span')
    hint.textContent = '?rig=1'
    header.append(title, hint)

    const tabs = document.createElement('div')
    tabs.className = 'rigPartTabs'
    for (const key of PART_ORDER) {
      const button = document.createElement('button')
      button.textContent = config[key].label
      button.className = key === selected ? 'active' : ''
      button.addEventListener('click', () => {
        selected = key
        setSelectedMarker(selected)
        renderPanel()
      })
      tabs.appendChild(button)
    }

    const controls = document.createElement('section')
    controls.className = 'rigControls'
    const part = config[selected]
    const update = (field: keyof RigPart, value: number) => {
      if (field === 'label') return
      config = { ...config, [selected]: { ...config[selected], [field]: value } }
      applyPart(selected, config[selected])
      saveConfig(config)
    }

    controls.append(
      slider('x', part.x, -20, 90, 0.5, value => update('x', value)),
      slider('y', part.y, -10, 95, 0.5, value => update('y', value)),
      slider('size', part.w, 8, 90, 0.5, value => update('w', value)),
      slider('rot', part.r, -35, 35, 0.5, value => update('r', value)),
      slider('origin x', part.ox, 0, 100, 1, value => update('ox', value)),
      slider('origin y', part.oy, 0, 100, 1, value => update('oy', value))
    )

    const actions = document.createElement('div')
    actions.className = 'rigEditorActions'

    const walkButton = document.createElement('button')
    walkButton.textContent = '걷기 보기'
    walkButton.addEventListener('click', () => {
      const player = document.querySelector('.artPlayer')
      if (!player) return
      const walking = player.classList.toggle('walking')
      player.classList.toggle('idle', !walking)
      walkButton.textContent = walking ? '정지 보기' : '걷기 보기'
    })

    const resetButton = document.createElement('button')
    resetButton.textContent = '초기화'
    resetButton.addEventListener('click', () => {
      config = copyDefault()
      saveConfig(config)
      applyConfig(config)
      renderPanel()
    })

    const copyButton = document.createElement('button')
    copyButton.textContent = 'JSON 복사'
    copyButton.addEventListener('click', async () => {
      await window.navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      copyButton.textContent = '복사됨'
      window.setTimeout(() => { copyButton.textContent = 'JSON 복사' }, 1200)
    })

    actions.append(walkButton, resetButton, copyButton)

    const json = document.createElement('textarea')
    json.readOnly = true
    json.value = JSON.stringify(config, null, 2)

    panel.append(header, tabs, controls, actions, json)
  }

  const start = () => {
    applyConfig(config)
    setSelectedMarker(selected)
    renderPanel()
  }

  const waitForRig = () => {
    if (document.querySelector('.rigHead')) start()
    else window.requestAnimationFrame(waitForRig)
  }
  waitForRig()
}

bootRigEditor()
