let floorX = 0
let farX = 0
let trainX = 0
let lastTime = performance.now()

function runSceneMotion() {
  const now = performance.now()
  const delta = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now

  const root = document.querySelector<HTMLElement>('.gameRoot')
  const player = document.querySelector<HTMLElement>('.artPlayer')

  if (root && player) {
    const walking = player.classList.contains('walking')
    const running = player.classList.contains('running')
    const facingLeft = player.classList.contains('facing-left')

    if (walking) {
      const direction = facingLeft ? 1 : -1
      const speed = running ? 260 : 155
      floorX += direction * speed * delta
      farX += direction * speed * 0.16 * delta
      trainX += direction * speed * 0.34 * delta
    }

    root.style.setProperty('--scene-floor-x', `${Math.round(floorX)}px`)
    root.style.setProperty('--scene-far-x', `${Math.round(farX)}px`)
    root.style.setProperty('--scene-train-x', `${Math.round(trainX)}px`)
  }

  requestAnimationFrame(runSceneMotion)
}

requestAnimationFrame(runSceneMotion)
