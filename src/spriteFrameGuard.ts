const CLEAN_WALK_FRAMES = [
  '/assets/outis_walk/walk_right_01_contact.png',
  '/assets/outis_walk/walk_right_02_down.png',
  '/assets/outis_walk/walk_right_03_passing.png',
  '/assets/outis_walk/walk_right_04_contact_opposite.png',
  '/assets/outis_walk/walk_right_05_down_opposite.png',
  '/assets/outis_walk/walk_right_06_passing_opposite.png'
]

function guardCleanWalkSprites() {
  const tick = () => {
    const player = document.querySelector<HTMLElement>('.artPlayer')
    const sprite = document.querySelector<HTMLImageElement>('.artSprite')

    if (player && sprite) {
      sprite.style.filter = 'none'
      sprite.style.boxShadow = 'none'
      sprite.style.outline = '0'
      sprite.style.background = 'transparent'

      if (player.classList.contains('running')) {
        const frameIndex = Math.floor(performance.now() / 78) % CLEAN_WALK_FRAMES.length
        const cleanSrc = CLEAN_WALK_FRAMES[frameIndex]
        if (!sprite.src.endsWith(cleanSrc)) sprite.src = cleanSrc
      }
    }

    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

guardCleanWalkSprites()
