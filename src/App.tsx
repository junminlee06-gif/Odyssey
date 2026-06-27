import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { renderPixelScene } from './pixelRenderer'
import type { PixelEntity } from './pixelRenderer'

const WORLD_WIDTH = 3240
const MOVE_SPEED = 145
const GRAVITY = 980
const JUMP_SPEED = 330

type NameId = 'returningSoldier' | 'sonOfLaertes' | 'sackerOfCities' | 'manyMinded' | 'outis'
type Mode = 'play' | 'names' | 'ticket' | 'dialogue' | 'inspection' | 'cutscene'
type Facing = 'left' | 'right'
type DialogueOption = { text: string; requiredNameId?: NameId; response: string }

type GameFrame = {
  x: number
  y: number
  vy: number
  facing: Facing
  walking: boolean
  time: number
}

const names: Array<{
  id: NameId
  displayName: string
  epithet: string
  description: string
  effectText: string
  locked?: boolean
}> = [
  {
    id: 'returningSoldier',
    displayName: '귀환병',
    epithet: '전후 수송 대상자',
    description: '전장을 빠져나와 고향으로 돌아가려는 병사의 이름.',
    effectText: '공감, 낮은 위험, 병사와 민간인 대화에 적합.'
  },
  {
    id: 'sonOfLaertes',
    displayName: '라에르테스의 아들',
    epithet: '이타카 왕가 혈통명',
    description: '왕가 기록과 귀향 자격을 증명할 때 쓰는 이름.',
    effectText: '고향, 왕가, 귀향 자격 관련 대화에 적합.'
  },
  {
    id: 'sackerOfCities',
    displayName: '도시를 함락한 자',
    epithet: '전공명',
    description: '트로이 폐허역 전체에 붙은 포스터 속 이름.',
    effectText: '군인과 선전관에게 강하지만 트로이 생존자에게 반감을 산다.'
  },
  {
    id: 'manyMinded',
    displayName: '지략이 많은 자',
    epithet: '작전 관련 신분',
    description: '직접 말하지 않고 우회로를 찾는 책략가의 이름.',
    effectText: '분석적이고 우회적인 대화에 적합.'
  },
  {
    id: 'outis',
    displayName: 'OUTIS / 아무도 아님',
    epithet: '검은 무기명 카드',
    description: '폐쇄되지 않은 작전명. 사용 시 본명 안정도에 영향을 줄 수 있음.',
    effectText: '이번 장면에서는 장착 불가. 훗날 외눈역에서 해금된다.',
    locked: true
  }
]

const entities: PixelEntity[] = [
  { id: 'poster', title: '영웅 포스터', x: 660, kind: 'object' },
  { id: 'wreck', title: '불탄 목마열차 잔해', x: 1440, kind: 'object' },
  { id: 'list', title: '귀환병 명단', x: 2030, kind: 'object' },
  { id: 'propagandist', title: '선전관', x: 2300, kind: 'npc' },
  { id: 'survivor', title: '트로이 생존자', x: 2520, kind: 'npc' },
  { id: 'sign', title: '이타카행 전광판', x: 2700, kind: 'object' },
  { id: 'inspector', title: '검표관', x: 2860, kind: 'gate' }
]

const objectLines: Record<string, { title: string; body: string }> = {
  poster: {
    title: '영웅 포스터',
    body: '“트로이를 함락한 자, 귀환하다.”\n\n오디세우스: 포스터 속 얼굴은 늘 나보다 먼저 고향에 도착한다.'
  },
  wreck: {
    title: '불탄 열차 잔해',
    body: '“목마열차 작전의 잔해.”\n\n오디세우스: 성문은 열리지 않았다. 그래서 우리는 열차를 들여보냈다.'
  },
  list: {
    title: '귀환병 명단',
    body: '“귀환병 명단에는 같은 사람처럼 보이는 이름이 여럿 적혀 있다.”\n\n오디세우스: 전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.'
  },
  sign: {
    title: '이타카행 전광판',
    body: '“이타카행 연결편 접수 중.”\n\n오디세우스: 집이라는 단어가 아직 선명하다.'
  }
}

const dialogueData: Record<string, { title: string; line: string; options: DialogueOption[] }> = {
  propagandist: {
    title: '선전관',
    line: '장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.',
    options: [
      { requiredNameId: 'returningSoldier', text: '나는 집으로 간다.', response: '영웅도 결국 귀환병이라는 말씀이군요.' },
      { requiredNameId: 'sackerOfCities', text: '대륙은 이미 내 얼굴을 충분히 팔아먹었지.', response: '그 말투까지 포스터에 담을 수 있다면 좋겠군요.' },
      { requiredNameId: 'manyMinded', text: '수도행이라. 나를 전시물로 만들 생각인가?', response: '기록에는 그렇게 쓰지 않겠습니다.' }
    ]
  },
  survivor: {
    title: '트로이 생존자',
    line: '당신이 그 열차를 들여보낸 사람이군요.',
    options: [
      { requiredNameId: 'returningSoldier', text: '전쟁은 끝났습니다.', response: '당신들에게는 끝났겠죠.' },
      { requiredNameId: 'sackerOfCities', text: '그 열차가 전쟁을 끝냈다.', response: '그럼 우리도 당신을 그렇게 기억하겠습니다.' },
      { text: '……', response: '말할 수 없다는 건 기억한다는 뜻이겠죠.' }
    ]
  },
  inspector: {
    title: '검표관',
    line: '이타카행 연결편입니다. 탑승명과 귀향표를 제시하십시오.',
    options: [
      { requiredNameId: 'returningSoldier', text: '귀환병 신분으로 제시한다.', response: '귀환병 신분. 전후 수송 대상자로 분류됩니다.' },
      { requiredNameId: 'sonOfLaertes', text: '라에르테스의 아들로 제시한다.', response: '이타카 왕가 기록과 부분 일치합니다.' },
      { requiredNameId: 'sackerOfCities', text: '도시를 함락한 자로 제시한다.', response: '전공 기록 확인. 관련 재판 기록은 아직 폐쇄되지 않았습니다.' },
      { requiredNameId: 'manyMinded', text: '지략이 많은 자로 제시한다.', response: '작전 관련 신분입니다. 대조가 필요합니다.' }
    ]
  }
}

const cutsceneLines = [
  '주인공이 열차 계단 앞에 선다.',
  '검표관이 호루라기를 분다.',
  '디젤 기관차가 천천히 움직인다.',
  '주인공이 창밖으로 트로이 폐허역을 바라본다.',
  '비에 젖은 영웅 포스터가 찢어진다.',
  '트로이 생존자가 플랫폼에서 주인공을 바라본다.',
  '귀향표 클로즈업. 목적지 “이타카”는 아직 선명하다.'
]

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keys = useRef({ left: false, right: false })
  const frameRef = useRef<GameFrame>({ x: 120, y: 0, vy: 0, facing: 'right', walking: false, time: 0 })
  const modeRef = useRef<Mode>('play')
  const [frame, setFrame] = useState<GameFrame>(frameRef.current)
  const [mode, setMode] = useState<Mode>('play')
  const [equipped, setEquipped] = useState<NameId>('returningSoldier')
  const [dialogue, setDialogue] = useState<{ title: string; line: string; options?: DialogueOption[]; response?: string } | null>(null)
  const [inspectionComplete, setInspectionComplete] = useState(false)
  const [cutsceneStep, setCutsceneStep] = useState(0)

  const camera = Math.min(Math.max(frame.x - 192, 0), Math.max(WORLD_WIDTH - 384, 0))
  const near = useMemo(() => {
    if (frame.x > 3015) return { id: 'train', title: '이타카행 열차', x: 3060, kind: 'gate' as const }
    return entities.find(entity => Math.abs(entity.x - frame.x) < 56)
  }, [frame.x])
  const equippedName = names.find(name => name.id === equipped)?.displayName ?? '귀환병'

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.045)
      last = now
      const current = frameRef.current
      const direction = Number(keys.current.right) - Number(keys.current.left)
      let nextX = current.x
      let nextY = current.y
      let nextVy = current.vy
      let nextFacing = current.facing
      const canMove = modeRef.current === 'play'

      if (canMove && direction !== 0) {
        nextX = Math.max(70, Math.min(WORLD_WIDTH - 80, current.x + direction * MOVE_SPEED * delta))
        nextFacing = direction > 0 ? 'right' : 'left'
      }

      if (current.y > 0 || current.vy !== 0) {
        nextY = Math.max(0, current.y + current.vy * delta)
        nextVy = current.vy - GRAVITY * delta
        if (nextY === 0 && nextVy < 0) nextVy = 0
      }

      const next: GameFrame = {
        x: nextX,
        y: nextY,
        vy: nextVy,
        facing: nextFacing,
        walking: canMove && direction !== 0,
        time: now
      }
      frameRef.current = next
      setFrame(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'a' || key === 'arrowleft') keys.current.left = true
      if (key === 'd' || key === 'arrowright') keys.current.right = true
      if ((key === ' ' || key === 'spacebar') && modeRef.current === 'play') {
        event.preventDefault()
        jump()
      }
      if (key === 'e' && modeRef.current === 'play') interact()
      if ((key === 'i' || key === 'tab') && modeRef.current === 'play') {
        event.preventDefault()
        setMode('names')
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'a' || key === 'arrowleft') keys.current.left = false
      if (key === 'd' || key === 'arrowright') keys.current.right = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  useEffect(() => {
    if (!canvasRef.current) return
    renderPixelScene(canvasRef.current, entities, {
      playerX: frame.x,
      playerY: frame.y,
      camera,
      worldWidth: WORLD_WIDTH,
      facing: frame.facing,
      walking: frame.walking,
      time: frame.time,
      nearId: near?.id,
      inspected: inspectionComplete,
      cutscene: mode === 'cutscene'
    })
  }, [frame, camera, near?.id, inspectionComplete, mode])

  useEffect(() => {
    if (mode !== 'cutscene') return
    setCutsceneStep(0)
    const timer = window.setInterval(() => {
      setCutsceneStep(step => Math.min(step + 1, cutsceneLines.length))
    }, 1450)
    return () => window.clearInterval(timer)
  }, [mode])

  function jump() {
    const current = frameRef.current
    if (current.y > 0) return
    frameRef.current = { ...current, vy: JUMP_SPEED }
  }

  function moveTouch(direction: 'left' | 'right', pressed: boolean) {
    keys.current[direction] = pressed
  }

  function focusEntity(x: number) {
    const current = frameRef.current
    frameRef.current = { ...current, x: Math.max(70, Math.min(WORLD_WIDTH - 80, x)) }
  }

  function interact(target = near) {
    if (!target) return
    if (target.id === 'train') {
      if (!inspectionComplete) {
        setDialogue({ title: '검표 필요', line: '이타카행 열차에 오르려면 먼저 검표관에게 귀향표와 탑승명을 제시해야 한다.' })
        setMode('dialogue')
        return
      }
      setMode('cutscene')
      return
    }

    focusEntity(target.x)
    if (target.kind === 'object') {
      const object = objectLines[target.id]
      setDialogue({ title: object.title, line: object.body })
      setMode('dialogue')
      return
    }

    const data = dialogueData[target.id]
    setDialogue({ title: data.title, line: data.line, options: data.options })
    setMode('dialogue')
  }

  function chooseOption(option: DialogueOption) {
    if (option.requiredNameId) setEquipped(option.requiredNameId)
    if (dialogue?.title === '검표관') {
      setInspectionComplete(true)
      setDialogue({ title: '검표 결과 출력', line: option.response })
      setMode('inspection')
      return
    }
    setDialogue({ title: '응답', line: option.response })
  }

  function optionLabel(option: DialogueOption) {
    if (!option.requiredNameId) return '[침묵]'
    return `[${names.find(name => name.id === option.requiredNameId)?.displayName}]`
  }

  const artPlayerLeft = `${((frame.x - camera) / 384) * 100}%`
  const artPlayerTransform = `translateX(-50%) translateY(-${Math.round(frame.y * 0.85)}px)`

  return <main className="gameRoot">
    <canvas ref={canvasRef} className="pixelCanvas" aria-label="트로이 폐허역 도트 게임 화면" />

    <div
      aria-hidden="true"
      className={`artPlayer facing-${frame.facing} ${frame.walking ? 'walking' : 'idle'} ${frame.y > 0 ? 'jumping' : ''}`}
      style={{ left: artPlayerLeft, transform: artPlayerTransform }}
    >
      <div className="artRig">
        <img className="rigPart rigCape" src="/assets/outis_parts/cape.png" alt="" />
        <img className="rigPart rigCoatBack" src="/assets/outis_parts/coat_back.png" alt="" />
        <img className="rigPart rigLegBack" src="/assets/outis_parts/leg_back.png" alt="" />
        <img className="rigPart rigArmBack" src="/assets/outis_parts/arm_back.png" alt="" />
        <img className="rigPart rigTorso" src="/assets/outis_parts/torso.png" alt="" />
        <img className="rigPart rigCoatFront" src="/assets/outis_parts/coat_front.png" alt="" />
        <img className="rigPart rigLegFront" src="/assets/outis_parts/leg_front.png" alt="" />
        <img className="rigPart rigArmFront" src="/assets/outis_parts/arm_front.png" alt="" />
        <img className="rigPart rigHead" src="/assets/outis_parts/head.png" alt="" />
      </div>
    </div>

    <header className="topHud">
      <b>OUTIS</b>
      <span>트로이 폐허역 · 17번 승강장</span>
      <em>장착 이름: {equippedName}</em>
    </header>

    <div className="hintBar">
      {near ? `E / 터치: ${near.title}` : 'A/D 이동 · Space 점프 · E 상호작용 · I 신분철'}
    </div>

    <button className="paperButton ticketButton" onClick={() => setMode('ticket')}>귀향표</button>
    <button className="paperButton nameButton" onClick={() => setMode('names')}>신분철</button>

    <div className="touchControls">
      <div className="touchCluster">
        <button onPointerDown={() => moveTouch('left', true)} onPointerUp={() => moveTouch('left', false)} onPointerCancel={() => moveTouch('left', false)}>◀</button>
        <button onPointerDown={() => moveTouch('right', true)} onPointerUp={() => moveTouch('right', false)} onPointerCancel={() => moveTouch('right', false)}>▶</button>
      </div>
      <div className="touchCluster">
        <button onClick={jump}>점프</button>
        <button onClick={() => interact()}>상호작용</button>
      </div>
    </div>

    <div className="quickJump">
      {entities.map(entity => <button key={entity.id} onClick={() => interact(entity)}>{entity.title}</button>)}
      <button onClick={() => { focusEntity(3060); interact({ id: 'train', title: '이타카행 열차', x: 3060, kind: 'gate' }) }}>열차</button>
    </div>

    {mode === 'dialogue' && dialogue && <Panel title={dialogue.title} onClose={() => setMode('play')}>
      <p>{dialogue.line}</p>
      {dialogue.options?.map((option, index) => <button className="dialogueChoice" key={`${option.text}-${index}`} onClick={() => chooseOption(option)}>
        <b>{optionLabel(option)}</b> {option.text}
      </button>)}
    </Panel>}

    {mode === 'names' && <Panel title="신분철" onClose={() => setMode('play')}>
      <div className="idCase">
        {names.map(identity => <button
          key={identity.id}
          className={`nameCard ${identity.id === equipped ? 'equipped' : ''} ${identity.locked ? 'locked' : ''}`}
          disabled={identity.locked}
          onClick={() => setEquipped(identity.id)}
        >
          <b>{identity.displayName}</b>
          <small>{identity.epithet}</small>
          <span>{identity.description}</span>
          <em>{identity.effectText}</em>
        </button>)}
      </div>
    </Panel>}

    {mode === 'ticket' && <Panel title="귀향표" onClose={() => setMode('play')}>
      <div className="ticket">
        <h2>ITHACA RAIL OFFICE</h2>
        <p>목적지: 이타카</p>
        <p>승객명: 부분 번짐</p>
        <p>현재 상태: 유효</p>
        <p>검표 도장 칸: {inspectionComplete ? '임시 승인' : '미사용'}</p>
        <p>경고: OUTIS 작전명 미폐쇄</p>
        <strong>{inspectionComplete ? 'APPROVED' : 'VALID'}</strong>
      </div>
    </Panel>}

    {mode === 'inspection' && dialogue && <Panel title="검표 결과" onClose={() => setMode('play')}>
      <div className="inspectionPaper">
        <p>이타카행 연결편: 임시 승인</p>
        <p>승객명: 부분 일치</p>
        <p>출신: 이타카</p>
        <p>군적: 대조 필요</p>
        <p>작전명: OUTIS — 미폐쇄</p>
        <p>주의: 포세이돈국 관할선 진입 전 기록 정리 권고</p>
      </div>
      <p>검표관: {dialogue.line}</p>
      <p>검표관: 승인은 났습니다. 다만 OUTIS 작전명이 아직 닫히지 않았습니다.</p>
      <p>주인공: 집에 도착할 때쯤엔 닫혀 있겠지.</p>
      <p>검표관: 기록은 사람보다 오래 기다립니다.</p>
    </Panel>}

    {mode === 'cutscene' && <div className="cutscene">
      {cutsceneStep < cutsceneLines.length ? <section>
        <p>{cutsceneLines[cutsceneStep]}</p>
      </section> : <section>
        <h1>1장. 트로이 폐허역</h1>
        <p>전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p>
        <button onClick={() => setMode('play')}>다시 플랫폼 보기</button>
      </section>}
    </div>}
  </main>
}

function Panel(props: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="overlay">
    <section className="panel">
      <button className="close" onClick={props.onClose}>닫기</button>
      <h1>{props.title}</h1>
      {props.children}
    </section>
  </div>
}

export default App
