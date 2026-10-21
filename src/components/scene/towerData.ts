import type { BoxTransform, Vec3 } from '../../types'
import { mulberry32 } from '../../lib/random'
import {
  box,
  FACES,
  createWindowPalette,
  emitBands,
  emitFins,
  emitMullions,
  emitWindows,
  strutBetween,
  type WindowDatum,
  type WindowSpec,
} from './facade'

export type { WindowDatum } from './facade'

export interface TowerData {
  glassVolumes: BoxTransform[]
  structure: BoxTransform[]
  frames: BoxTransform[]
  trim: BoxTransform[]
  greebles: BoxTransform[]
  windows: WindowDatum[]
  neonCyan: BoxTransform[]
  neonMagenta: BoxTransform[]
  neonWarm: BoxTransform[]
  inkEdges: BoxTransform[]
  beacons: Vec3[]
}

export const TOWER_HEIGHT = 92

export const TOWER_SIGN = {
  y: 53.35,
  z: 7.05,
  width: 14.0,
  height: 3.6,
  planeWidth: 13.4,
  planeHeight: 2.8,
}

export const TOWER_ROOF = {
  y: 64.75,
  width: 13.4,
  depth: 9.4,
  topWidth: 6.8,
  topDepth: 4.4,
  height: 4.8,
}

export const TOWER_DECK = {
  x: 13.0,
  z: 0.45,
  y: 48.8,
  width: 9.0,
  depth: 8.0,
  radius: 2.45,
  height: 2.9,
}

interface Tier {
  id: string
  y0: number
  y1: number
  width: number
  depth: number
  columns: number
  seed: number
  litRatio: number
  margin: number
}

const TIERS: Tier[] = [
  { id: 'lower', y0: 10.6, y1: 31.2, width: 25.5, depth: 17.6, columns: 14, seed: 117, litRatio: 0.27, margin: 1.1 },
  { id: 'mid', y0: 32.0, y1: 45.4, width: 21, depth: 14.6, columns: 12, seed: 231, litRatio: 0.24, margin: 1.05 },
  { id: 'upper', y0: 46.2, y1: 57.2, width: 16.8, depth: 12.4, columns: 10, seed: 379, litRatio: 0.26, margin: 1.0 },
]

/** A tier's window bay grid, sized so every floor line lands on a real storey. */
function tierWindowSpec(tier: Tier): WindowSpec {
  const rows = Math.max(4, Math.floor((tier.y1 - tier.y0 - 1.2) / 1.35))
  return {
    x: 0,
    z: 0,
    y0: tier.y0 + 0.65,
    y1: tier.y1 - 0.55,
    width: tier.width,
    depth: tier.depth,
    columns: tier.columns,
    rows,
    litRatio: tier.litRatio,
    seed: tier.seed,
    margin: tier.margin,
    style: 'bay',
  }
}

export function createTowerData(neonCyan: string, neonMagenta: string): TowerData {
  const palette = createWindowPalette(neonCyan, neonMagenta)
  const glassVolumes: BoxTransform[] = []
  const structure: BoxTransform[] = []
  const frames: BoxTransform[] = []
  const trim: BoxTransform[] = []
  const greebles: BoxTransform[] = []
  const windows: WindowDatum[] = []
  const neonCyanBoxes: BoxTransform[] = []
  const neonMagentaBoxes: BoxTransform[] = []
  const neonWarmBoxes: BoxTransform[] = []
  const inkEdges: BoxTransform[] = []
  const beacons: Vec3[] = []
  const random = mulberry32(0x57a4c0de)

  // ---------------------------------------------------------------- plaza / plinth
  structure.push(box([0, 0.22, 0], [46, 0.44, 46]))
  structure.push(box([0, 0.68, 0], [40, 0.5, 40]))
  structure.push(box([0, 1.12, 0], [34, 0.4, 34]))
  structure.push(box([0, 1.58, 0], [28, 0.55, 26]))

  // Approach steps: broad on the +Z frontage, with a low landing.
  structure.push(box([0, 0.35, 20.9], [26, 0.3, 2.4]))
  structure.push(box([0, 0.62, 22.6], [24, 0.26, 2.2]))
  structure.push(box([0, 0.88, 24.2], [22, 0.24, 2.0]))
  trim.push(box([0, 1.03, 25.4], [21, 0.14, 1.1]))

  // Bollards along the forecourt edge.
  for (let i = -5; i <= 5; i += 1) {
    structure.push(box([i * 2.4, 1.55, 27.3], [0.32, 1.0, 0.32]))
  }

  // --------------------------------------------------------------------- podium
  structure.push(box([0, 5.7, 0], [26, 7.8, 20]))
  glassVolumes.push(box([0, 4.5, 0], [25.2, 4.9, 19.2]))
  structure.push(box([0, 8.55, 0], [26.6, 2.2, 20.6]))
  trim.push(box([0, 9.75, 0], [28.6, 0.5, 22.6]))
  trim.push(box([0, 10.12, 0], [27.8, 0.3, 21.8]))

  // Deep-set lobby behind the colonnade.
  glassVolumes.push(box([0, 4.4, 9.95], [20.4, 4.8, 0.35]))
  for (let i = -5; i <= 5; i += 1) {
    frames.push(box([i * 1.75, 4.4, 10.18], [0.1, 4.8, 0.12]))
  }
  neonWarmBoxes.push(box([0, 6.95, 10.2], [19.4, 0.08, 0.08]))
  neonWarmBoxes.push(box([0, 2.15, 10.2], [19.4, 0.06, 0.08]))

  // Colonnade: four front piers, five per side, all with base and capital blocks.
  const frontColumns = [-11.2, -7.0, 7.0, 11.2]
  for (const x of frontColumns) {
    structure.push(box([x, 2.05, 10.7], [1.75, 0.6, 1.75]))
    structure.push(box([x, 5.25, 10.7], [1.35, 6.4, 1.35]))
    structure.push(box([x, 8.7, 10.7], [1.65, 0.45, 1.65]))
  }
  for (const z of [-7.2, -3.2, 0.8, 4.8]) {
    for (const sign of [-1, 1]) {
      structure.push(box([sign * 13.2, 2.05, z], [1.65, 0.6, 1.65]))
      structure.push(box([sign * 13.2, 5.25, z], [1.3, 6.4, 1.3]))
      structure.push(box([sign * 13.2, 8.7, z], [1.55, 0.45, 1.55]))
    }
  }

  // Corner piers are heavier than the colonnade: the base reads as masonry.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      structure.push(box([sx * 12.5, 5.6, sz * 9.5], [2.5, 7.6, 2.5]))
      trim.push(box([sx * 12.5, 9.6, sz * 9.5], [2.9, 0.4, 2.9]))
    }
  }

  // Entry portal and its cantilevered canopy.
  glassVolumes.push(box([0, 4.55, 10.45], [11.6, 5.2, 0.3]))
  frames.push(box([-5.9, 4.55, 10.65], [0.16, 5.2, 0.2]))
  frames.push(box([5.9, 4.55, 10.65], [0.16, 5.2, 0.2]))
  frames.push(box([0, 7.2, 10.65], [11.9, 0.16, 0.2]))
  neonWarmBoxes.push(box([0, 2.15, 10.7], [11.2, 0.08, 0.1]))
  neonWarmBoxes.push(box([-5.55, 4.3, 10.7], [0.06, 4.2, 0.1]))
  neonWarmBoxes.push(box([5.55, 4.3, 10.7], [0.06, 4.2, 0.1]))
  for (const sx of [-1, 1]) {
    structure.push(box([sx * 7.4, 6.3, 12.7], [1.35, 9.2, 1.35]))
  }
  trim.push(box([0, 9.15, 15.5], [17.2, 0.6, 6.6]))
  trim.push(box([0, 9.65, 15.5], [16.4, 0.35, 5.8]))
  trim.push(box([0, 9.0, 18.9], [17.6, 0.45, 0.5]))
  structure.push(strutBetween([-7.4, 5.2, 11.9], [-7.4, 9.0, 18.3], 0.38))
  structure.push(strutBetween([7.4, 5.2, 11.9], [7.4, 9.0, 18.3], 0.38))
  neonMagentaBoxes.push(box([0, 8.75, 18.95], [17.6, 0.07, 0.09]))
  neonWarmBoxes.push(box([0, 8.68, 12.5], [14.8, 0.06, 0.08]))

  inkEdges.push(box([0, 5.7, 0], [26, 7.8, 20]))

  // ---------------------------------------------------------------- shaft tiers
  TIERS.forEach((tier, index) => {
    const height = tier.y1 - tier.y0
    const midY = (tier.y0 + tier.y1) / 2

    glassVolumes.push(box([0, midY, 0], [tier.width - 0.25, height - 0.45, tier.depth - 0.25]))
    structure.push(box([0, midY - 0.1, 0], [tier.width - 3.4, height - 1.5, tier.depth - 3.4]))

    // Facade grid.
    const spec = tierWindowSpec(tier)
    emitWindows(spec, palette, windows)
    emitMullions(spec, frames, { every: 2, width: 0.055, depth: 0.085 })
    emitBands(spec, frames, { every: 2, height: 0.12, depth: 0.07 })
    emitFins(spec, frames, { every: 1, width: 0.2, depth: 0.55 })

    // Broad structural fins on the short ends of the slab.
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) {
        structure.push(
          box(
            [sx * (tier.width / 2 - 0.42), midY, sz * (tier.depth / 2 + 0.22)],
            [0.82, height - 0.8, 0.9],
          ),
        )
      }
    }
    // Corner mega-columns.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        structure.push(
          box(
            [sx * (tier.width / 2 - 0.72), midY, sz * (tier.depth / 2 - 0.72)],
            [1.55, height - 0.6, 1.55],
          ),
        )
      }
    }

    // Base belt and roof terrace: dark metal, only a thin stone lip.
    frames.push(box([0, tier.y0 + 0.05, 0], [tier.width + 0.55, 0.42, tier.depth + 0.55]))
    frames.push(box([0, tier.y1 + 0.26, 0], [tier.width + 0.95, 0.4, tier.depth + 0.95]))
    structure.push(box([0, tier.y1 + 0.58, 0], [tier.width + 0.35, 0.22, tier.depth + 0.35]))
    for (const sz of [-1, 1]) {
      trim.push(box([0, tier.y1 + 0.82, sz * (tier.depth / 2 + 0.46)], [tier.width + 0.95, 0.32, 0.18]))
    }
    for (const sx of [-1, 1]) {
      trim.push(box([sx * (tier.width / 2 + 0.46), tier.y1 + 0.82, 0], [0.18, 0.32, tier.depth + 0.95]))
    }

    // A cyan belt at each setback, a magenta one on alternating tiers.
    const top = tier.y1 - 0.3
    for (const face of [
      [0, top, tier.depth / 2 + 0.62, tier.width + 0.2, 0.07, 0.07],
      [0, top, -(tier.depth / 2 + 0.62), tier.width + 0.2, 0.07, 0.07],
      [tier.width / 2 + 0.62, top, 0, 0.07, 0.07, tier.depth + 0.2],
      [-(tier.width / 2 + 0.62), top, 0, 0.07, 0.07, tier.depth + 0.2],
    ] as const) {
      neonCyanBoxes.push(box([face[0], face[1], face[2]], [face[3], face[4], face[5]]))
    }
    if (index !== 1) {
      const belt = tier.y0 + 0.28
      for (const face of [
        [0, belt, tier.depth / 2 + 0.55, tier.width + 0.1, 0.055, 0.06],
        [0, belt, -(tier.depth / 2 + 0.55), tier.width + 0.1, 0.055, 0.06],
        [tier.width / 2 + 0.55, belt, 0, 0.06, 0.055, tier.depth + 0.1],
        [-(tier.width / 2 + 0.55), belt, 0, 0.06, 0.055, tier.depth + 0.1],
      ] as const) {
        neonMagentaBoxes.push(box([face[0], face[1], face[2]], [face[3], face[4], face[5]]))
      }
    }

    // Mechanical grilles and louvers break up the glass with real hardware.
    for (let i = 0; i < 6; i += 1) {
      const face = Math.floor(random() * 4)
      const along = (random() - 0.5) * (tier.width - 4)
      const y = tier.y0 + 1.2 + random() * (height - 2.6)
      if (face === 0 || face === 1) {
        greebles.push(box([along, y, (face === 0 ? 1 : -1) * (tier.depth / 2 + 0.4)], [0.65, 0.28, 0.5]))
      } else {
        greebles.push(box([(face === 2 ? 1 : -1) * (tier.width / 2 + 0.4), y, along], [0.5, 0.28, 0.65]))
      }
    }

    // Rooftop mechanical volumes only appear on the broad terraces.
    if (index < 2) {
      structure.push(box([-6.8, tier.y1 + 1.6, 3.1], [4.6, 1.8, 3.2]))
      structure.push(box([5.9, tier.y1 + 1.35, -2.9], [3.9, 1.3, 2.8]))
      structure.push(box([0.4, tier.y1 + 1.15, -6.4], [4.8, 0.9, 1.6]))
      greebles.push(box([-6.8, tier.y1 + 2.7, 3.1], [1.2, 0.4, 1.2]))
      greebles.push(box([5.9, tier.y1 + 2.15, -2.9], [0.9, 0.3, 0.9]))
      beacons.push([-6.8, tier.y1 + 3.0, 3.1], [5.9, tier.y1 + 2.4, -2.9])
    }

    inkEdges.push(box([0, midY, 0], [tier.width - 0.2, height - 0.4, tier.depth - 0.2]))
  })

  // -------------------------------------------------------- cantilever observation pod
  // The pod itself is a hero mesh; these are its structural attachments.
  structure.push(box([12.8, 47.28, TOWER_DECK.z], [8.6, 0.4, 7.4]))
  structure.push(strutBetween([14.9, 47.4, 2.4], [8.55, 43.3, 2.4], 0.46))
  structure.push(strutBetween([14.9, 47.4, -2.4], [8.55, 43.3, -2.4], 0.46))
  structure.push(box([8.7, 45.8, 0], [0.9, 5.0, 6.2]))

  // ------------------------------------------------------------------- crown
  structure.push(box([0, 57.85, 0], [14.8, 1.35, 10.4]))
  trim.push(box([0, 58.65, 0], [14.0, 0.38, 9.8]))
  structure.push(box([0, 59.7, 0], [13.2, 2.1, 9.2]))
  glassVolumes.push(box([0, 62.55, 0], [12.4, 4.4, 8.6]))

  const lanternSpec: WindowSpec = {
    x: 0,
    z: 0,
    y0: 60.8,
    y1: 64.6,
    width: 12.4,
    depth: 8.6,
    columns: 6,
    rows: 3,
    litRatio: 0.72,
    seed: 913,
    margin: 0.75,
    style: 'glass',
    faces: [FACES[1], FACES[2], FACES[3]],
  }
  emitWindows(lanternSpec, palette, windows)
  emitMullions(lanternSpec, frames, { every: 1, width: 0.08, depth: 0.1 })
  emitBands(lanternSpec, frames, { every: 1, height: 0.12, depth: 0.09 })

  // Crown struts: canted supports that tie the top shaft into the lantern.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      structure.push(
        strutBetween(
          [sx * 8.2, 56.0, sz * 6.0],
          [sx * 7.05, 59.3, sz * 5.0],
          0.44,
        ),
      )
    }
  }

  // Lantern base light ring.
  for (const face of [
    [0, 60.85, 4.45, 12.6, 0.07, 0.08],
    [0, 60.85, -4.45, 12.6, 0.07, 0.08],
    [4.45, 60.85, 0, 0.08, 0.07, 8.8],
    [-4.45, 60.85, 0, 0.08, 0.07, 8.8],
  ] as const) {
    neonCyanBoxes.push(box([face[0], face[1], face[2]], [face[3], face[4], face[5]]))
  }

  // The faceted crown, eave trim and ribs are hero geometry in Tower.tsx.


  // Neon hip lines draw the four faceted crown edges in ink and light.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      neonCyanBoxes.push(
        strutBetween(
          [sx * 6.7, 64.82, sz * 4.7],
          [sx * 3.4, 69.55, sz * 2.2],
          0.045,
        ),
      )
    }
  }

  // --------------------------------------------------------------------- sign
  for (const sz of [-1, 1]) {
    const signZ = sz * TOWER_SIGN.z
    frames.push(box([0, TOWER_SIGN.y, signZ], [TOWER_SIGN.width + 0.5, TOWER_SIGN.height + 0.5, 0.42]))
    inkEdges.push(box([0, TOWER_SIGN.y, signZ], [TOWER_SIGN.width + 0.5, TOWER_SIGN.height + 0.5, 0.42]))
    // Mounting arms bridge the facade fins.
    for (const x of [-4.8, 0, 4.8]) {
      structure.push(box([x, TOWER_SIGN.y, sz * 6.55], [0.22, 0.22, 1.1]))
    }
    neonCyanBoxes.push(box([-(TOWER_SIGN.width / 2 + 0.32), TOWER_SIGN.y, sz * 7.28], [0.06, TOWER_SIGN.height + 0.2, 0.06]))
    neonCyanBoxes.push(box([TOWER_SIGN.width / 2 + 0.32, TOWER_SIGN.y, sz * 7.28], [0.06, TOWER_SIGN.height + 0.2, 0.06]))
    neonMagentaBoxes.push(box([0, TOWER_SIGN.y - TOWER_SIGN.height / 2 - 0.34, sz * 7.28], [TOWER_SIGN.width + 0.2, 0.07, 0.07]))
  }

  // ------------------------------------------------------------------- spire base
  structure.push(box([0, 70.05, 0], [3.6, 1.1, 3.0]))
  trim.push(box([0, 70.62, 0], [2.7, 0.35, 2.3]))
  beacons.push([7.0, 69.9, 0], [-7.0, 69.9, 0])

  // A single warm reveal along the crown lantern reads as a lit interior.
  neonWarmBoxes.push(box([0, 61.4, 4.34], [9.4, 0.05, 0.06]))
  neonWarmBoxes.push(box([0, 63.7, 4.34], [9.4, 0.05, 0.06]))
  neonWarmBoxes.push(box([0, 61.4, -4.34], [9.4, 0.05, 0.06]))

  return {
    glassVolumes,
    structure,
    frames,
    trim,
    greebles,
    windows,
    neonCyan: neonCyanBoxes,
    neonMagenta: neonMagentaBoxes,
    neonWarm: neonWarmBoxes,
    inkEdges,
    beacons,
  }
}

/** Real count of the generated facade, used by the HUD readout. */
export const TOWER_WINDOW_COUNT = createTowerData('#42f4ff', '#ff2bd6').windows.length