function installSpriteDefringeFilter() {
  if (document.getElementById('outis-alpha-defringe')) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  svg.style.overflow = 'hidden'

  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', 'outis-alpha-defringe')
  filter.setAttribute('color-interpolation-filters', 'sRGB')

  const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
  matrix.setAttribute('type', 'matrix')
  matrix.setAttribute('values', '1 0 0 1 -1  0 1 0 1 -1  0 0 1 1 -1  0 0 0 1 0')

  filter.appendChild(matrix)
  svg.appendChild(filter)
  document.body.prepend(svg)
}

installSpriteDefringeFilter()
