import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

type Facing = 'left' | 'right'

type RigPartName = 'cape' | 'coatBack' | 'legBack' | 'armBack' | 'torso' | 'coatFront' | 'legFront' | 'armFront' | 'head'

type RigPartConfig = {
  label: string
  file: string
  className: string
  z: number
  x: number
  y: number
  w: number
  r: number
  ox: number
  oy: number
  dim?: number
}

type RigConfig = Record<RigPartName, RigPartConfig>

type OutisRigProps = {
  left: string
  transform: string
  facing: Facing
  walking: boolean
  jumping: boolean
}

const STORAGE_KEY = 'outis-rig-config-v1'
const PART_ORDER: RigPartName[] = ['cape', 'coatBack', 'legBack', 'armBack', 'torso', 'coatFront', 'legFront', 'armFront', 'head']

const DEFAULT_RIG: RigConfig = {
  cape: { label: '망토', file: 'cape.png', className: 'rigCape', z: 1, x: 14, y: 37, w: 28, r: 0, ox: 88, oy: 18, dim: 0.96 },
  coatBack: { label: '뒤 코트', file: 'coat_back.png', className: 'rigCoatBack', z: 2, x: 24, y: 49, w: 48, r: 0, ox: 52, oy: 16, dim: 0.96 },
  legBack: { label: '뒷다리', file: 'leg_back.png', className: 'rigLegBack', z: 3, x: 50, y: 60, w: 29, r: 0, ox: 48, oy: 16, dim: 0.93 },
  armBack: { label: '뒷팔', file: 'arm_back.png', className: 'rigArmBack', z: 4, x: 62, y: 37, w: 21, r: 0, ox: 52, oy: 12, dim: 0.93 },
  torso: { label: '몸통', file: 'torso.png', className: 'rigTorso', z: 5, x: 18, y: 22, w: 64, r: 0, ox: 50, oy: 70 },
  coatFront: { label: '앞 코트', file: 'coat_front.png', className: 'rigCoatFront', z: 6, x: 27, y: 50, w: 51, r: 0, ox: 54, oy: 14 },
  legFront: { label: '앞다리', file: 'leg_front.png', className: 'rigLegFront', z: 7, x: 38, y: 60, w: 29, r: 0, ox: 49, oy: 16 },
  armFront: { label: '앞팔', file: 'arm_front.png', className: 'rigArmFront', z: 8, x: 32, y: 37, w: 21, r: 0, ox: 48, oy: 12 },
  head: { label: '머리', file: 'head.png', className: 'rigHead', z: 9, x: 41, y: 19, w: 30, r: 0, ox: 50, oy: 84 }
}

function cloneDefaultRig(): RigConfig {
  return JSON.parse(JSON.stringify(DEFAULT_RIG)) as RigConfig
}

function readRigFromStorage(): RigConfig {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return cloneDefaultRig()
    const parsed = JSON.parse(saved) as Partial<RigConfig>
    return PART_ORDER.reduce((next, key) => {
      next[key] = { ...DEFAULT_RIG[key], ...(parsed[key] ?? {}) }
      return next
    }, {} as RigConfig)
  } catch {
    return cloneDefaultRig()
  }
}

function isRigDebugMode() {
  return new URLSearchParams(window.location.search).has('rig')
}

export function OutisRig({ left, transform, facing, walking, jumping }: OutisRigProps) {
  const debug = useMemo(() => isRigDebugMode(), [])
  const [rig, setRig] = useState<RigConfig>(() => debug ? readRigFromStorage() : cloneDefaultRig())
  const [selected, setSelected] = useState<RigPartName>('head')
  const [previewWalk, setPreviewWalk] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!debug) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rig))
  }, [debug, rig])

  const selectedPart = rig[selected]
  const effectiveWalking = debug ? previewWalk : walking

  function updatePart(field: keyof Pick<RigPartConfig, 'x' | 'y' | 'w' | 'r' | 'ox' | 'oy'>, value: number) {
    setRig(current => ({
      ...current,
      [selected]: { ...current[selected], [field]: value }
    }))
  }

  function resetRig() {
    const next = cloneDefaultRig()
    setRig(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function copyRig() {
    const text = JSON.stringify(rig, null, 2)
    try {
      await window.navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return <>
    <div
      aria-hidden="true"
      className={`artPlayer facing-${facing} ${effectiveWalking ? 'walking' : 'idle'} ${jumping ? 'jumping' : ''} ${debug ? 'rigDebugActive' : ''}`}
      style={{ left, transform }}
    >
      <div className="artRig">
        {PART_ORDER.map(partName => {
          const part = rig[partName]
          const style = {
            left: `${part.x}%`,
            top: `${part.y}%`,
            width: `${part.w}%`,
            zIndex: part.z,
            transform: `rotate(${part.r}deg)`,
            transformOrigin: `${part.ox}% ${part.oy}%`,
            filter: part.dim ? `brightness(${part.dim}) saturate(${Math.max(0.75, part.dim)})` : undefined
          } satisfies CSSProperties
          return <img
            key={partName}
            className={`rigPart ${part.className} ${debug && selected === partName ? 'selectedRigPart' : ''}`}
            src={`/assets/outis_parts/${part.file}`}
            alt=""
            style={style}
          />
        })}
      </div>
    </div>

    {debug && <aside className="rigEditor">
      <header>
        <b>OUTIS Rig Editor</b>
        <span>?rig=1</span>
      </header>

      <div className="rigPartTabs">
        {PART_ORDER.map(partName => <button
          key={partName}
          className={selected === partName ? 'active' : ''}
          onClick={() => setSelected(partName)}
        >{rig[partName].label}</button>)}
      </div>

      <section className="rigControls">
        <RigSlider label="x" value={selectedPart.x} min={-20} max={90} step={0.5} onChange={value => updatePart('x', value)} />
        <RigSlider label="y" value={selectedPart.y} min={-10} max={95} step={0.5} onChange={value => updatePart('y', value)} />
        <RigSlider label="size" value={selectedPart.w} min={8} max={90} step={0.5} onChange={value => updatePart('w', value)} />
        <RigSlider label="rot" value={selectedPart.r} min={-35} max={35} step={0.5} onChange={value => updatePart('r', value)} />
        <RigSlider label="origin x" value={selectedPart.ox} min={0} max={100} step={1} onChange={value => updatePart('ox', value)} />
        <RigSlider label="origin y" value={selectedPart.oy} min={0} max={100} step={1} onChange={value => updatePart('oy', value)} />
      </section>

      <div className="rigEditorActions">
        <button onClick={() => setPreviewWalk(value => !value)}>{previewWalk ? '정지 보기' : '걷기 보기'}</button>
        <button onClick={resetRig}>초기화</button>
        <button onClick={copyRig}>{copied ? '복사됨' : 'JSON 복사'}</button>
      </div>

      <textarea readOnly value={JSON.stringify(rig, null, 2)} />
    </aside>}
  </>
}

function RigSlider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className="rigSlider">
    <span>{props.label}</span>
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={event => props.onChange(Number(event.currentTarget.value))}
    />
    <input
      type="number"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={event => props.onChange(Number(event.currentTarget.value))}
    />
  </label>
}
