import { Color } from 'three'
import type { BoxTransform, Vec3 } from '../../types'
import { mulberry32 } from '../../lib/random'

export interface WindowTier {
  id: string
  x: number
  z: number
  y0: number
  y1: number
  width: number
  depth: number
  columns: number
  seed: number
  litRatio: number
}

export interface WindowDatum {
  position: Vec3
  rotationY: number
  scale: [number, number]
  color: Vec3
}

export interface TowerData {
  glassVolumes: BoxTransform[]
  structure: BoxTransform[]
  mullions: BoxTransform[]
  braces: BoxTransform[]
  greebles: BoxTransform[]
  windows: WindowDatum[]
  neonCyan: BoxTransform[]
  neonMagenta: BoxTransform[]
}

export const TOWER_HEIGHT = 88
export const TOWER_WINDOW_TIERS: WindowTier[] = [
  {
    id: 'lower-shaft',
    x: 0.15,
    z: 0,
    y0: 8.4,
    y1: 28.8,
    width: 18,
    depth: 18,
    columns: 18,
    seed: 117,
    litRatio: 0.58,
  },
  {
    id: 'mid-shaft',
    x: -1.35,
    z: 0.9,
    y0: 29.1,
    y1: 43.8,
    width: 14.2,
    depth: 14,
    columns: 14,
    seed: 231,
    litRatio: 0.5,
  },
  {
    id: 'upper-shaft',
    x: 1.4,
    z: -0.9,
    y0: 44.1,
    y1: 55.6,
    width: 10.2,
    depth: 10,
    columns: 9,
    seed: 379,
    litRatio: 0.54,
  },
]

const CROWN_WINDOWS = {
  x: 0,
  z: 0,
  y0: 56.4,
  y1: 61.6,
  width: 7.3,
  depth: 7.3,
  columns: 4,
  rows: 3,
  seed: 913,
  litRatio: 0.42,
}

const POD_WINDOWS = 12

function tierRows(y0: number, y1: number) {
  return Math.max(4, Math.floor((y1 - y0 - 2.2) / 1.32))
}

export const TOWER_WINDOW_COUNT =
  TOWER_WINDOW_TIERS.reduce((total, tier) => total + tierRows(tier.y0, tier.y1) * tier.columns * 4, 0) +
  CROWN_WINDOWS.rows * CROWN_WINDOWS.columns * 4 +
  POD_WINDOWS

function box(
  position: Vec3,
  scale: Vec3,
  rotation?: Vec3,
): BoxTransform {
  return rotation ? { position, scale, rotation } : { position, scale }
}

interface Face {
  rotationY: number
  axis: 'x' | 'z'
  sign: 1 | -1
}

const FACES: Face[] = [
  { rotationY: 0, axis: 'z', sign: 1 },
  { rotationY: Math.PI, axis: 'z', sign: -1 },
  { rotationY: Math.PI / 2, axis: 'x', sign: 1 },
  { rotationY: -Math.PI / 2, axis: 'x', sign: -1 },
]

function facePoint(
  face: Face,
  x: number,
  z: number,
  width: number,
  depth: number,
  along: number,
  outward: number,
): [number, number] {
  if (face.axis === 'z') {
    return [x + along, z + face.sign * (depth / 2 + outward)]
  }
  return [x + face.sign * (width / 2 + outward), z + along]
}

function pushWindow(
  target: WindowDatum[],
  face: Face,
  x: number,
  z: number,
  width: number,
  depth: number,
  along: number,
  y: number,
  paneWidth: number,
  paneHeight: number,
  color: Color,
) {
  const [px, pz] = facePoint(face, x, z, width, depth, along, 0.055)
  target.push({
    position: [px, y, pz],
    rotationY: face.rotationY,
    scale: [paneWidth, paneHeight],
    color: [color.r, color.g, color.b],
  })
}

function windowColour(
  random: () => number,
  litRatio: number,
  column: number,
  row: number,
  cyan: Color,
  magenta: Color,
  amber: Color,
  ice: Color,
) {
  const litBias = row % 5 === 0 ? 0.1 : 0
  const lit = random() < litRatio + litBias
  if (!lit) return new Color(0.014, 0.032, 0.05)

  const family = random()
  const source = family < 0.47 ? cyan : family < 0.69 ? ice : family < 0.87 ? amber : magenta
  const colour = source.clone()
  const power = 0.55 + random() * 1.75 + (column % 7 === 0 ? 0.55 : 0) + (row % 4 === 0 ? 0.2 : 0)
  return colour.multiplyScalar(power)
}

export function createTowerData(neonCyan: string, neonMagenta: string): TowerData {
  const cyan = new Color(neonCyan)
  const magenta = new Color(neonMagenta)
  const amber = new Color('#ffad67')
  const ice = new Color('#d6f8ff')
  const glassVolumes: BoxTransform[] = []
  const structure: BoxTransform[] = []
  const mullions: BoxTransform[] = []
  const braces: BoxTransform[] = []
  const greebles: BoxTransform[] = []
  const windows: WindowDatum[] = []
  const neonCyanBoxes: BoxTransform[] = []
  const neonMagentaBoxes: BoxTransform[] = []

  // ---- Podium, plinth and entrance -------------------------------------------------
  structure.push(box([0, 0.35, 0], [38, 0.7, 38]))
  structure.push(box([0, 0.9, 0], [33, 0.5, 33]))
  structure.push(box([0, 1.55, 0], [28, 0.9, 27]))
  structure.push(box([0, 2.25, 0], [24, 0.7, 23]))
  structure.push(box([0, 5.1, 0], [22.5, 5.1, 21]))
  structure.push(box([0, 7.9, 0], [24.5, 1.1, 22.5]))
  structure.push(box([0, 8.15, 0], [19.1, 0.5, 19.1]))

  // The entry is an exaggerated A-frame silhouette.
  structure.push(box([-7.6, 4.2, 12.7], [0.65, 7.4, 0.65], [0, 0, -0.23]))
  structure.push(box([7.6, 4.2, 12.7], [0.65, 7.4, 0.65], [0, 0, 0.23]))
  structure.push(box([0, 7.1, 12.55], [16.4, 0.55, 1.6]))
  structure.push(box([0, 8.4, 12.5], [17.4, 0.35, 2.4]))
  structure.push(box([-9.5, 2.2, 14.2], [0.5, 4.2, 0.5], [0, 0, -0.36]))
  structure.push(box([9.5, 2.2, 14.2], [0.5, 4.2, 0.5], [0, 0, 0.36]))
  structure.push(box([0, 0.35, 20.6], [15, 0.7, 3.4]))
  structure.push(box([0, 0.2, 24.5], [11, 0.4, 4.8]))

  // Warm entry portal, deliberately smaller than the mechanical canopy.
  glassVolumes.push(box([0, 5.25, 10.86], [12.8, 4.1, 0.32]))
  neonCyanBoxes.push(box([-6.35, 5.15, 11.05], [0.09, 4.3, 0.09]))
  neonCyanBoxes.push(box([6.35, 5.15, 11.05], [0.09, 4.3, 0.09]))
  neonCyanBoxes.push(box([0, 7.25, 11.05], [12.75, 0.09, 0.09]))
  neonMagentaBoxes.push(box([0, 2.95, 20.65], [15.4, 0.07, 0.12]))

  // ---- Shafts ----------------------------------------------------------------------
  TOWER_WINDOW_TIERS.forEach((tier, tierIndex) => {
    const height = tier.y1 - tier.y0
    const midY = (tier.y0 + tier.y1) / 2
    glassVolumes.push(box([tier.x, midY, tier.z], [tier.width, height - 0.9, tier.depth]))
    structure.push(box([tier.x, midY - 0.12, tier.z], [tier.width - 1.55, height - 1.2, tier.depth - 1.55]))

    // Roof collar and the recessed structural belt between volumes.
    structure.push(box([tier.x, tier.y1 + 0.15, tier.z], [tier.width + 1.8, 0.55, tier.depth + 1.8]))
    structure.push(box([tier.x, tier.y0 - 0.05, tier.z], [tier.width + 0.8, 0.65, tier.depth + 0.8]))
    structure.push(box([tier.x, tier.y1 - 0.95, tier.z], [tier.width + 0.45, 0.3, tier.depth + 0.45]))

    // Corner mega-columns.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        structure.push(
          box(
            [tier.x + sx * (tier.width / 2 - 0.16), midY, tier.z + sz * (tier.depth / 2 - 0.16)],
            [0.72, height - 0.6, 0.72],
          ),
        )
      }
    }

    // Broad exterior fins make the silhouette feel engineered instead of boxy.
    structure.push(box([tier.x + tier.width / 2 + 0.22, midY, tier.z], [0.45, height - 1.4, 1.1]))
    structure.push(box([tier.x - tier.width / 2 - 0.22, midY, tier.z], [0.45, height - 1.4, 1.1]))
    structure.push(box([tier.x, midY, tier.z + tier.depth / 2 + 0.22], [1.1, height - 1.4, 0.45]))
    structure.push(box([tier.x, midY, tier.z - tier.depth / 2 - 0.22], [1.1, height - 1.4, 0.45]))

    const random = mulberry32(tier.seed)
    const rows = tierRows(tier.y0, tier.y1)
    const usableHeight = height - 2.2
    const rowStep = usableHeight / rows
    const margin = 0.78
    const glowRow = Math.floor(random() * rows)

    FACES.forEach((face, faceIndex) => {
      const span = face.axis === 'z' ? tier.width : tier.depth
      const marginForFace = margin
      const colStep = (span - marginForFace * 2) / tier.columns
      const paneWidth = colStep * 0.56
      const paneHeight = rowStep * 0.51

      for (let row = 0; row < rows; row += 1) {
        const y = tier.y0 + 1.1 + rowStep * (row + 0.5)
        for (let column = 0; column < tier.columns; column += 1) {
          const along = -span / 2 + marginForFace + colStep * (column + 0.5)
          const boost = row === glowRow && faceIndex < 2 ? 0.24 : 0
          const color = windowColour(
            random,
            tier.litRatio + boost + (tierIndex === 0 ? 0.03 : 0),
            column,
            row,
            cyan,
            magenta,
            amber,
            ice,
          )
          pushWindow(windows, face, tier.x, tier.z, tier.width, tier.depth, along, y, paneWidth, paneHeight, color)
        }
      }

      // Vertical mullions and railings are instanced as one dark-metal mesh.
      for (let column = 0; column <= tier.columns; column += 1) {
        const along = -span / 2 + marginForFace + colStep * column
        const [px, pz] = facePoint(face, tier.x, tier.z, tier.width, tier.depth, along, 0.1)
        mullions.push(
          box(
            [px, midY, pz],
            face.axis === 'z' ? [0.045, height - 1.2, 0.11] : [0.11, height - 1.2, 0.045],
          ),
        )
      }
      for (let row = 0; row <= rows; row += 1) {
        const y = tier.y0 + 1.1 + rowStep * row
        const [px, pz] = facePoint(face, tier.x, tier.z, tier.width, tier.depth, 0, 0.1)
        mullions.push(
          box(
            [px, y, pz],
            face.axis === 'z' ? [span - margin * 2 + 0.1, 0.045, 0.12] : [0.12, 0.045, span - margin * 2 + 0.1],
          ),
        )
      }
    })

    // The offset X-braces feel like exposed load-bearing machinery.
    const braceHeight = height - 2.2
    const braceWidth = tier.width - 2.6
    const braceDepth = tier.depth - 2.6
    const frontLength = Math.hypot(braceWidth, braceHeight)
    const sideLength = Math.hypot(braceDepth, braceHeight)
    const frontAngle = Math.atan2(braceWidth, braceHeight)
    const sideAngle = Math.atan2(braceDepth, braceHeight)
    braces.push(
      box(
        [tier.x, midY, tier.z + tier.depth / 2 + 0.32],
        [0.17, frontLength, 0.19],
        [0, 0, -frontAngle],
      ),
    )
    braces.push(
      box(
        [tier.x, midY, tier.z - tier.depth / 2 - 0.32],
        [0.17, frontLength, 0.19],
        [0, 0, frontAngle],
      ),
    )
    braces.push(
      box(
        [tier.x + tier.width / 2 + 0.32, midY, tier.z],
        [0.19, sideLength, 0.17],
        [sideAngle, 0, 0],
      ),
    )
    braces.push(
      box(
        [tier.x - tier.width / 2 - 0.32, midY, tier.z],
        [0.19, sideLength, 0.17],
        [-sideAngle, 0, 0],
      ),
    )

    // Pipes, vents and service pods. Small enough to read as greebles from afar.
    for (let i = 0; i < 18; i += 1) {
      const face = FACES[Math.floor(random() * FACES.length)]
      const along = (random() - 0.5) * (tier.width - 2.5)
      const [px, pz] = facePoint(face, tier.x, tier.z, tier.width, tier.depth, along, 0.28)
      const y = tier.y0 + 1.4 + random() * (height - 2.8)
      greebles.push(
        box(
          [px, y, pz],
          [0.32 + random() * 0.8, 0.16 + random() * 0.65, 0.3 + random() * 0.6],
          [0, face.rotationY, 0],
        ),
      )
    }

    const paletteForTier = tierIndex % 2 === 0 ? neonCyanBoxes : neonMagentaBoxes
    const secondaryForTier = tierIndex % 2 === 0 ? neonMagentaBoxes : neonCyanBoxes

    // Light bands wrap all four faces at the bottom and top of every shaft.
    const bandY = [tier.y0 + 0.3, tier.y1 - 0.25]
    bandY.forEach((y, bandIndex) => {
      FACES.forEach((face, faceIndex) => {
        const target = (faceIndex + bandIndex + tierIndex) % 3 === 0 ? secondaryForTier : paletteForTier
        if (face.axis === 'z') {
          const pz = tier.z + face.sign * (tier.depth / 2 + 0.055)
          target.push(box([tier.x, y, pz], [tier.width - 0.4, 0.055, 0.045]))
        } else {
          const px = tier.x + face.sign * (tier.width / 2 + 0.055)
          target.push(box([px, y, tier.z], [0.045, 0.055, tier.depth - 0.4]))
        }
      })
    })

    // Two bright corner rails instead of lighting every edge keeps the geometry legible.
    for (const sz of [-1, 1]) {
      const pz = tier.z + sz * (tier.depth / 2 + 0.1)
      const px = tier.x + (sz > 0 ? 1 : -1) * (tier.width / 2 - 0.65)
      targetForNeon(tierIndex, sz > 0).push(box([px, midY, pz], [0.07, height - 1.3, 0.07]))
    }
  })

  function targetForNeon(tierIndex: number, positive: boolean) {
    return (tierIndex + (positive ? 0 : 1)) % 2 === 0 ? neonCyanBoxes : neonMagentaBoxes
  }

  // ---- Crown and machinery ---------------------------------------------------------
  structure.push(box([0, 56.15, 0], [9.4, 1.15, 9.4]))
  structure.push(box([0, 58.7, 0], [7.2, 4.6, 7.2]))
  structure.push(box([0, 61.7, 0], [8.2, 0.75, 8.2]))
  structure.push(box([0, 62.4, 0], [5.2, 0.7, 5.2]))
  structure.push(box([0, 65.8, 0], [2.8, 6.5, 2.8]))
  structure.push(box([0, 69.5, 0], [4.6, 1.2, 4.6]))
  structure.push(box([4.6, 62.8, 0.3], [0.32, 8.8, 4.8], [0, 0, 0.2]))
  structure.push(box([-4.35, 62.3, -0.35], [0.3, 7.8, 4.1], [0, 0, -0.25]))
  structure.push(box([0.3, 63.8, 4.35], [5.4, 6.9, 0.3], [0.18, 0, 0]))
  structure.push(box([0, 64.55, 0], [1.05, 8.5, 1.05]))
  structure.push(box([0, 70.9, 0], [2.2, 2.2, 2.2], [0, 0.6, 0]))
  structure.push(box([-3.4, 57.9, 0], [0.22, 4.7, 0.22], [0, 0, 0.42]))
  structure.push(box([3.4, 57.9, 0], [0.22, 4.7, 0.22], [0, 0, -0.42]))

  neonCyanBoxes.push(box([0, 56.55, 4.74], [8.8, 0.09, 0.08]))
  neonCyanBoxes.push(box([0, 62.1, 4.15], [7.3, 0.08, 0.08]))
  neonMagentaBoxes.push(box([0, 62.45, -4.15], [7.3, 0.08, 0.08]))
  neonMagentaBoxes.push(box([4.15, 62.0, 0], [0.08, 0.08, 7.2]))
  neonCyanBoxes.push(box([-4.15, 62.0, 0], [0.08, 0.08, 7.2]))

  // Mechanised observation deck: an asymmetric cantilever that breaks the box silhouette.
  structure.push(box([9.5, 49.25, 0.1], [7.8, 1.35, 5.2]))
  structure.push(box([9.5, 48.45, 0.1], [8.6, 0.3, 6]))
  structure.push(box([9.5, 50.05, 0.1], [8.3, 0.32, 5.7]))
  structure.push(box([5.9, 47.75, 0.1], [0.42, 3.3, 3.9], [0, 0, -0.34]))
  glassVolumes.push(box([9.6, 49.5, 0.1], [6.5, 1.15, 4.35]))
  neonMagentaBoxes.push(box([9.5, 48.23, 0.1], [8.7, 0.055, 6.1]))

  // Cantilever windows are inserted separately because this pod is not a full facade tier.
  const podFaces: Face[] = [
    { rotationY: 0, axis: 'z', sign: 1 },
    { rotationY: Math.PI, axis: 'z', sign: -1 },
  ]
  podFaces.forEach((face) => {
    for (let column = 0; column < 3; column += 1) {
      for (let row = 0; row < 2; row += 1) {
        const color = row === 0 ? cyan.clone().multiplyScalar(1.35) : ice.clone().multiplyScalar(0.75)
        const [px, pz] = facePoint(face, 9.6, 0.1, 6.5, 4.35, -2 + column * 2, 0.04)
        windows.push({
          position: [px, 49.12 + row * 0.38, pz],
          rotationY: face.rotationY,
          scale: [0.9, 0.24],
          color: [color.r, color.g, color.b],
        })
      }
    }
  })

  // ---- Crown window slots ----------------------------------------------------------
  {
    const random = mulberry32(CROWN_WINDOWS.seed)
    FACES.forEach((face) => {
      const span = face.axis === 'z' ? CROWN_WINDOWS.width : CROWN_WINDOWS.depth
      const colStep = (span - 1.4) / CROWN_WINDOWS.columns
      const rowStep = (CROWN_WINDOWS.y1 - CROWN_WINDOWS.y0) / CROWN_WINDOWS.rows
      for (let row = 0; row < CROWN_WINDOWS.rows; row += 1) {
        for (let column = 0; column < CROWN_WINDOWS.columns; column += 1) {
          const along = -span / 2 + 0.7 + colStep * (column + 0.5)
          const color = random() < CROWN_WINDOWS.litRatio ? magenta.clone().multiplyScalar(0.75 + random()) : new Color(0.01, 0.02, 0.03)
          pushWindow(
            windows,
            face,
            CROWN_WINDOWS.x,
            CROWN_WINDOWS.z,
            CROWN_WINDOWS.width,
            CROWN_WINDOWS.depth,
            along,
            CROWN_WINDOWS.y0 + 0.5 + rowStep * (row + 0.5),
            0.44,
            0.42,
            color,
          )
        }
      }
    })
  }

  return {
    glassVolumes,
    structure,
    mullions,
    braces,
    greebles,
    windows,
    neonCyan: neonCyanBoxes,
    neonMagenta: neonMagentaBoxes,
  }
}
