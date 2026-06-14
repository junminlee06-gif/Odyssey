import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'

const WORLD_WIDTH = 1881

type NameId = 'returningSoldier' | 'sonOfLaertes' | 'sackerOfCities' | 'manyMinded'
type Mode = 'play' | 'names' | 'ticket' | 'dialogue' | 'inspection' | 'cutscene'
type Entity = { id: string; title: string; x: number; kind: 'object' | 'npc' | 'gate' }

const names = [
  ['returningSoldier', '귀환병', '공감, 낮은 위험, 병사와 민간인 대화에 적합'],
  ['sonOfLaertes', '라에르테스의 아들', '이타카 왕가 혈통명. 권위와 귀향 자격'],
  ['sackerOfCities', '도시를 함락한 자', '군인과 선전관에게 강하지만 생존자에게 반감을 산다'],
  ['manyMinded', '지략이 많은 자', '분석, 의심, 우회적 대화에 적합'],
  ['outis', 'OUTIS / 아무도 아님', '폐쇄되지 않은 작전명. 4장 외눈역에서 해금 예정']
] as const

const entities: Entity[] = [
  { id: 'poster', title: '영웅 포스터', x: 150, kind: 'object' },
  { id: 'list', title: '귀환병 명단', x: 210, kind: 'object' },
  { id: 'propagandist', title: '선전관', x: 520, kind: 'npc' },
  { id: 'wreck', title: '불탄 열차 잔해', x: 760, kind: 'object' },
  { id: 'survivor', title: '트로이 생존자', x: 1060, kind: 'npc' },
  { id: 'board', title: '이타카행 전광판', x: 930, kind: 'object' },
  { id: 'inspector', title: '검표소', x: 1660, kind: 'gate' }
]

const objectLines: Record<string, string> = {
  poster: '트로이를 함락한 자, 귀환하다.\n\n오디세우스: 포스터 속 얼굴은 늘 나보다 먼저 고향에 도착한다.',
  wreck: '목마열차 작전의 잔해.\n\n오디세우스: 성문은 열리지 않았다. 그래서 우리는 열차를 들여보냈다.',
  list: '귀환병 명단에는 같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n오디세우스: 전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.',
  board: '이타카행 연결편 접수 중.\n\n오디세우스: 집이라는 단어가 아직 선명하다.'
}

function App() {
  const [x, setX] = useState(560)
  const [viewportWidth, setViewportWidth] = useState(1000)
  const [mode, setMode] = useState<Mode>('play')
  const [equipped, setEquipped] = useState<NameId>('returningSoldier')
  const [dialogue, setDialogue] = useState({ title: '', body: '' })
  const [walking, setWalking] = useState(false)
  const walkTimer = useRef<number | null>(null)
  const near = useMemo(() => entities.find(e => Math.abs(e.x - x) < 90), [x])
  const camera = Math.min(Math.max(x - viewportWidth * 0.5, 0), Math.max(WORLD_WIDTH - viewportWidth, 0))
  const nameLabel = names.find(n => n[0] === equipped)?.[1]

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth)
    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      if (walkTimer.current) window.clearTimeout(walkTimer.current)
    }
  }, [])

  function moveTo(nextX: number) {
    setWalking(true)
    if (walkTimer.current) window.clearTimeout(walkTimer.current)
    walkTimer.current = window.setTimeout(() => setWalking(false), 520)
    setX(Math.max(80, Math.min(WORLD_WIDTH - 80, Math.round(nextX))))
  }

  function tapMove(event: PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    const rect = event.currentTarget.getBoundingClientRect()
    const next = camera + ((event.clientX - rect.left) / rect.width) * viewportWidth
    moveTo(next)
  }

  function openText(title: string, body: string) {
    setDialogue({ title, body })
    setMode('dialogue')
  }

  function interact(entity: Entity) {
    moveTo(entity.x)
    if (entity.kind === 'object') openText(entity.title, objectLines[entity.id])
    if (entity.id === 'propagandist') {
      const line = equipped === 'sackerOfCities'
        ? '오디세우스: 대륙은 이미 내 얼굴을 충분히 팔아먹었지.'
        : equipped === 'manyMinded'
          ? '오디세우스: 수도행이라. 나를 전시물로 만들 생각인가?'
          : '오디세우스: 나는 집으로 간다.'
      openText('선전관', '장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.\n\n' + line)
    }
    if (entity.id === 'survivor') {
      const line = equipped === 'sackerOfCities'
        ? '오디세우스: 그 열차가 전쟁을 끝냈다.\n\n트로이 생존자: 그럼 우리도 당신을 그렇게 기억하겠습니다.'
        : '오디세우스: 전쟁은 끝났습니다.\n\n트로이 생존자: 당신들에게는 끝났겠죠.'
      openText('트로이 생존자', '당신이 그 열차를 들여보낸 사람이군요.\n\n' + line)
    }
    if (entity.id === 'inspector') openText('검표관', '이타카행 연결편입니다. 탑승명과 귀향표를 제시하십시오.')
  }

  return <main className="game">
    <header><b>OUTIS</b><span>트로이 폐허역</span><em>장착 이름: {nameLabel}</em></header>
    <section className="viewport" onPointerDown={tapMove}>
      <div className="world" style={{ transform: `translateX(${-camera}px)` }}>
        <img className="sceneBackground" src="/art/bg_station_scroll.webp" alt="" />
        {entities.map(e => <button className={`marker ${e.kind} ${e.id}`} style={{ left: e.x }} key={e.id} onClick={() => interact(e)}>{e.title}</button>)}
        <div className={`player ${walking ? 'walking' : ''}`} style={{ left: x }} />
      </div>
    </section>
    <button className="ticketBtn" onClick={() => setMode('ticket')}>귀향표</button>
    <button className="nameBtn" onClick={() => setMode('names')}>신분철</button>
    <footer>{near ? `탭 가능: ${near.title}` : '빈 플랫폼 탭: 이동 · 표식 탭: 상호작용'}</footer>

    {mode === 'dialogue' && <Panel title={dialogue.title} onClose={() => setMode('play')}><p>{dialogue.body}</p>{near?.id === 'inspector' && <button onClick={() => setMode('inspection')}>귀향표와 이름을 제시한다</button>}</Panel>}
    {mode === 'names' && <Panel title="신분철" onClose={() => setMode('play')}><div className="cards">{names.map(n => <button key={n[0]} disabled={n[0] === 'outis'} onClick={() => { if (n[0] !== 'outis') setEquipped(n[0] as NameId) }}><b>{n[1]}</b><span>{n[2]}</span></button>)}</div></Panel>}
    {mode === 'ticket' && <Panel title="귀향표" onClose={() => setMode('play')}><div className="ticket"><h2>ITHACA RAIL OFFICE</h2><p>목적지: 이타카</p><p>승객명: 부분 번짐</p><p>검표 도장 칸: 미사용</p><p>경고: OUTIS 작전명 미폐쇄</p></div></Panel>}
    {mode === 'inspection' && <Panel title="검표 결과" onClose={() => setMode('play')}><div className="printout"><p>이타카행 연결편: 임시 승인</p><p>승객명: 부분 일치</p><p>출신: 이타카</p><p>군적: 대조 필요</p><p>작전명: OUTIS — 미폐쇄</p><p>주의: 포세이돈국 관할선 진입 전 기록 정리 권고</p></div><p>검표관: 기록은 사람보다 오래 기다립니다.</p><button onClick={() => setMode('cutscene')}>17번 승강장으로 이동</button></Panel>}
    {mode === 'cutscene' && <div className="cutscene"><h1>1장. 집으로 가는 열차</h1><p>기차 기적. 비에 젖은 영웅 포스터가 찢어진다.</p><p>귀향표 클로즈업. 목적지 이타카는 아직 선명하다.</p></div>}
  </main>
}

function Panel(props: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="overlay"><section className="panel"><button className="close" onClick={props.onClose}>닫기</button><h1>{props.title}</h1>{props.children}</section></div>
}

export default App
