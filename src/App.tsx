import { useMemo, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'

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
  { id: 'poster', title: '영웅 포스터', x: 230, kind: 'object' },
  { id: 'wreck', title: '불탄 열차 잔해', x: 520, kind: 'object' },
  { id: 'propagandist', title: '선전관', x: 820, kind: 'npc' },
  { id: 'list', title: '귀환병 명단', x: 1120, kind: 'object' },
  { id: 'survivor', title: '트로이 생존자', x: 1430, kind: 'npc' },
  { id: 'board', title: '이타카행 전광판', x: 1730, kind: 'object' },
  { id: 'inspector', title: '검표소', x: 2100, kind: 'gate' }
]

const objectLines: Record<string, string> = {
  poster: '트로이를 함락한 자, 귀환하다.\n\n오디세우스: 포스터 속 얼굴은 늘 나보다 먼저 고향에 도착한다.',
  wreck: '목마열차 작전의 잔해.\n\n오디세우스: 성문은 열리지 않았다. 그래서 우리는 열차를 들여보냈다.',
  list: '귀환병 명단에는 같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n오디세우스: 전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.',
  board: '이타카행 연결편 접수 중.\n\n오디세우스: 집이라는 단어가 아직 선명하다.'
}

function App() {
  const [x, setX] = useState(120)
  const [mode, setMode] = useState<Mode>('play')
  const [equipped, setEquipped] = useState<NameId>('returningSoldier')
  const [dialogue, setDialogue] = useState({ title: '', body: '' })
  const near = useMemo(() => entities.find(e => Math.abs(e.x - x) < 105), [x])
  const camera = Math.min(Math.max(x - 520, 0), 1240)
  const nameLabel = names.find(n => n[0] === equipped)?.[1]

  function tapMove(event: PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    const rect = event.currentTarget.getBoundingClientRect()
    const next = camera + ((event.clientX - rect.left) / rect.width) * 1000
    setX(Math.max(70, Math.min(2140, Math.round(next))))
  }

  function openText(title: string, body: string) {
    setDialogue({ title, body })
    setMode('dialogue')
  }

  function interact(entity: Entity) {
    setX(entity.x)
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
        <ArtLayer />
        {entities.map(e => <button className={`marker ${e.kind} ${e.id}`} style={{ left: e.x }} key={e.id} onClick={() => interact(e)}>{e.title}</button>)}
        <div className="player" style={{ left: x }} />
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

function ArtLayer() {
  const figures = [
    [760, 470, 1.0], [910, 455, .88], [1015, 472, .75], [1220, 465, .9], [1340, 455, .8],
    [1510, 462, .92], [1605, 470, .72], [1815, 462, .85], [1900, 470, .66], [2060, 455, .92]
  ] as const

  return <svg className="artLayer" viewBox="0 0 2600 760" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="paperSky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#d7d0b8" stopOpacity="0.46" />
        <stop offset="0.42" stopColor="#66706a" stopOpacity="0.38" />
        <stop offset="1" stopColor="#242522" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="wetFloor" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#676a5d" stopOpacity="0.64" />
        <stop offset="0.42" stopColor="#34372f" stopOpacity="0.78" />
        <stop offset="1" stopColor="#111210" stopOpacity="0.96" />
      </linearGradient>
      <pattern id="hatch" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
        <path d="M0 10 H20" stroke="#0d1111" strokeOpacity="0.12" strokeWidth="1" />
      </pattern>
      <filter id="roughInk">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.3" />
      </filter>
    </defs>

    <rect width="2600" height="760" fill="url(#paperSky)" />
    <rect width="2600" height="760" fill="url(#hatch)" opacity="0.55" />
    <rect x="0" y="455" width="2600" height="305" fill="url(#wetFloor)" />

    <g className="roofArt" filter="url(#roughInk)">
      <path d="M-60,18 C540,160 1180,178 2660,18" fill="none" stroke="#151918" strokeWidth="12" opacity=".75" />
      <path d="M-30,50 C590,205 1280,210 2630,52" fill="none" stroke="#202625" strokeWidth="6" opacity=".62" />
      <path d="M50,105 C730,260 1340,254 2540,105" fill="none" stroke="#1a1f1e" strokeWidth="4" opacity=".64" />
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 60 + i * 145
        return <path key={i} d={`M${x},4 L${760 + i * 38},452`} stroke="#111615" strokeWidth={i % 3 === 0 ? 5 : 2} opacity=".55" />
      })}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 250 + i * 165
        return <path key={`b${i}`} d={`M${x},40 L${x - 120},450`} stroke="#111615" strokeWidth="2" opacity=".38" />
      })}
      <path d="M660,75 L770,125 L850,108 L925,168 L1038,128 L1150,188 L1308,142 L1465,205 L1600,155" fill="none" stroke="#0d1212" strokeWidth="5" opacity=".5" />
      <path d="M1680,88 L1815,120 L1940,104 L2030,158 L2165,110" fill="none" stroke="#0d1212" strokeWidth="5" opacity=".45" />
    </g>

    <g className="stationDepth" opacity=".86">
      <path d="M0,445 L2600,445" stroke="#0a0d0d" strokeWidth="6" />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = i * 180 + 20
        return <g key={i}>
          <rect x={x} y="120" width="16" height="365" fill="#151a1a" opacity=".55" />
          <path d={`M${x - 26},142 H${x + 54}`} stroke="#101414" strokeWidth="5" opacity=".6" />
        </g>
      })}
      <path d="M0,612 C560,555 1110,557 2600,612" fill="none" stroke="#0d1010" strokeWidth="5" opacity=".65" />
      <path d="M0,648 C590,590 1230,592 2600,648" fill="none" stroke="#0b0d0d" strokeWidth="4" opacity=".6" />
      {Array.from({ length: 38 }).map((_, i) => <path key={i} d={`M${i * 74},520 L${i * 74 + 180},760`} stroke="#0b0d0d" strokeWidth="2" opacity=".22" />)}
    </g>

    <g className="trainArt" filter="url(#roughInk)">
      <path d="M1380,345 C1410,250 1480,220 1605,218 H2245 C2360,220 2438,292 2485,405 L2505,545 H1340 L1360,430 Z" fill="#243033" stroke="#0b0f0f" strokeWidth="8" />
      <path d="M1430,360 H2445" stroke="#c0a259" strokeWidth="3" opacity=".42" />
      <rect x="1600" y="260" width="118" height="78" fill="#101718" stroke="#0a0c0c" strokeWidth="4" />
      <rect x="1748" y="260" width="118" height="78" fill="#101718" stroke="#0a0c0c" strokeWidth="4" />
      <rect x="1896" y="260" width="118" height="78" fill="#101718" stroke="#0a0c0c" strokeWidth="4" />
      <rect x="2044" y="260" width="118" height="78" fill="#101718" stroke="#0a0c0c" strokeWidth="4" />
      <circle cx="1510" cy="530" r="64" fill="#101313" stroke="#000" strokeWidth="8" />
      <circle cx="1740" cy="536" r="48" fill="#101313" stroke="#000" strokeWidth="7" />
      <circle cx="2175" cy="536" r="50" fill="#101313" stroke="#000" strokeWidth="7" />
      <path d="M1408,250 H1515 L1530,190 H1585 L1605,248" fill="#182023" stroke="#0a0c0c" strokeWidth="6" />
      <path d="M1440,178 C1455,120 1510,116 1530,176" fill="none" stroke="#0d1010" strokeWidth="18" opacity=".45" />
      <text x="1825" y="418" fill="#c7b37c" fontSize="38" letterSpacing="8">ITHACA</text>
      <text x="1828" y="456" fill="#8a7d5d" fontSize="22" letterSpacing="4">PLATFORM 17</text>
    </g>

    <g className="posterArt" filter="url(#roughInk)">
      <path d="M150,170 L350,150 L365,365 L132,385 Z" fill="#c9b98f" stroke="#15100d" strokeWidth="5" />
      <path d="M180,210 C215,174 270,178 300,212 C272,232 222,238 180,210 Z" fill="#1b2223" opacity=".78" />
      <path d="M190,270 H322 M188,300 H330 M185,330 H292" stroke="#261d16" strokeWidth="5" opacity=".72" />
      <text x="176" y="255" fill="#251d16" fontSize="23" fontWeight="bold">도시를 함락한 자</text>
      <path d="M330,340 L365,365 L330,357" fill="#6f2621" opacity=".65" />
    </g>

    <g className="wreckArt" filter="url(#roughInk)">
      <path d="M420,505 L708,470 L770,522 L724,575 L420,586 Z" fill="#242522" stroke="#090b0b" strokeWidth="6" />
      <path d="M455,490 L555,435 L610,480" fill="none" stroke="#0b0d0d" strokeWidth="10" />
      <circle cx="500" cy="584" r="30" fill="#111" />
      <circle cx="670" cy="575" r="28" fill="#111" />
      <path d="M475,522 L680,498 M510,552 L730,535" stroke="#b08a45" strokeWidth="3" opacity=".35" />
      <path d="M430,440 C500,390 620,410 708,360" fill="none" stroke="#111" strokeWidth="10" opacity=".22" />
    </g>

    <g className="signArt" filter="url(#roughInk)">
      <rect x="1668" y="125" width="320" height="80" fill="#151b1d" stroke="#0b0d0d" strokeWidth="5" />
      <text x="1710" y="176" fill="#d6c48d" fontSize="36" letterSpacing="5">ITHACA</text>
      <text x="1846" y="199" fill="#9b8b5e" fontSize="18">접수 중</text>
      <rect x="2188" y="94" width="245" height="205" fill="#162025" stroke="#0b0d0d" strokeWidth="5" />
      <circle cx="2310" cy="170" r="58" fill="none" stroke="#9aa09a" strokeWidth="5" opacity=".6" />
      <circle cx="2310" cy="170" r="18" fill="#0a0d0e" />
      <text x="2224" y="258" fill="#d6c48d" fontSize="24">POSEIDON STATE</text>
    </g>

    <g className="peopleArt" filter="url(#roughInk)">
      {figures.map(([fx, fy, s], i) => <g key={i} transform={`translate(${fx} ${fy}) scale(${s})`} opacity={i % 3 === 0 ? .86 : .68}>
        <circle cx="0" cy="-46" r="14" fill="#111515" />
        <path d="M-12,-28 L14,-28 L25,58 L-25,58 Z" fill="#1a2020" stroke="#080a0a" strokeWidth="3" />
        <path d="M-22,-8 L-42,36 M20,-8 L44,34" stroke="#0b0d0d" strokeWidth="5" />
        <path d="M-12,58 L-20,94 M12,58 L24,94" stroke="#0b0d0d" strokeWidth="6" />
      </g>)}
      <g transform="translate(2075 430)" opacity=".9">
        <rect x="-46" y="-44" width="92" height="126" fill="#171918" stroke="#0a0d0d" strokeWidth="5" />
        <circle cx="0" cy="-72" r="16" fill="#111" />
        <path d="M-34,-94 H34" stroke="#111" strokeWidth="8" />
      </g>
    </g>

    <g className="rainArt" opacity=".42">
      {Array.from({ length: 65 }).map((_, i) => <path key={i} d={`M${(i * 97) % 2600},${30 + (i * 53) % 520} l-34,82`} stroke="#d8d1b7" strokeWidth="2" opacity={i % 4 === 0 ? .28 : .16} />)}
      {Array.from({ length: 38 }).map((_, i) => <path key={`r${i}`} d={`M${40 + i * 66},${630 + (i % 4) * 18} q70,18 160,0`} fill="none" stroke="#d8d1b7" strokeWidth="2" opacity=".18" />)}
    </g>
  </svg>
}

function Panel(props: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="overlay"><section className="panel"><button className="close" onClick={props.onClose}>닫기</button><h1>{props.title}</h1>{props.children}</section></div>
}

export default App
