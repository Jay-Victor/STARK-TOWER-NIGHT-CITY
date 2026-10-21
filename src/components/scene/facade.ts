import { Color, Euler, Quaternion, Vector3 } from 'three'
import type { BoxTransform, Vec3 } from '../../types'
import { mulberry32 } from '../../lib/random'

export interface WindowDatum {
  position: Vec3
  rotationY: number
  scale: [number, number]
  color: Vec3
}

export interface Face {
  rotationY: number
  axis: 'x' | 'z'
  sign: 1 | -1
}

export const FACES: readonly Face[] = [
  { rotationY: 0, axis: 'z', sign: 1 },
  { rotationY: Math.PI, axis: 'z', sign: -1 },
  { rotationY: Math.PI / 2, axis: 'x', sign: 1 },
  { rotationY: -Math.PI / 2, axis: 'x', sign: -1 },
]

export interface WindowPalette {
  cyan: Color
  magenta: Color
  amber: Color
  ice: Color
  warm: Color
  dim: Color
}

export function createWindowPalette(neonCyan: string, neonMagenta: string): WindowPalette {
  return {
    cyan: new Color(neonCyan),
    magenta: new Color(neonMagenta),
    amber: new Color('#ff9f57'),
    ice: new Color('#c4e6ff'),
    warm: new Color('#ffd6a0'),
    // Linear-space values: unlit glass must stay almost black at night.
    dim: new Color().setRGB(0.011, 0.03, 0.045),
  }
}

export function facePoint(
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

export type WindowStyle = 'bay' | 'ribbon' | 'glass'

export interface WindowSpec {
  x: number
  z: number
  y0: number
  y1: number
  width: number
  depth: number
  columns: number
  rows: number
  litRatio: number
  seed: number
  margin?: number
  style?: WindowStyle
  faces?: readonly Face[]
  darkPanes?: boolean
  warmBias?: number
}

function windowColour(
  random: () => number,
  lit: boolean,
  palette: WindowPalette,
  warmBias: number,
) {
  if (!lit) {
    const dim = palette.dim.clone().multiplyScalar(0.55 + random() * 0.9)
    return [dim.r, dim.g, dim.b] as Vec3
  }

  const family = random() + warmBias
  const source =
    family < 0.54
      ? palette.warm
      : family < 0.76
        ? palette.ice
        : family < 0.89
          ? palette.amber
          : family < 0.96
            ? palette.cyan
            : palette.magenta
  const power = 0.38 + Math.pow(random(), 1.6) * 1.02 + (random() > 0.9 ? 0.5 : 0)
  const colour = source.clone().multiplyScalar(power)
  return [colour.r, colour.g, colour.b] as Vec3
}

/**
 * Builds the lit and unlit pane grid for one shaft. Keeping the dark panes is
 * what makes the curtain wall read as architecture instead of a sprinkle of
 * lights floating in front of a black box.
 */
export function emitWindows(spec: WindowSpec, palette: WindowPalette, target: WindowDatum[]) {
  const random = mulberry32(spec.seed)
  const faces = spec.faces ?? FACES
  const margin = spec.margin ?? 0.8
  const style = spec.style ?? 'bay'
  const rowStep = (spec.y1 - spec.y0) / spec.rows
  const glowRow = random() > 0.42 ? Math.floor(random() * spec.rows) : -1
  const glowRowB = random() > 0.72 ? Math.floor(random() * spec.rows) : -1
  const glowColumn = random() > 0.68 ? Math.floor(random() * spec.columns) : -1

  for (const face of faces) {
    const span = face.axis === 'z' ? spec.width : spec.depth
    const colStep = (span - margin * 2) / spec.columns
    for (let row = 0; row < spec.rows; row += 1) {
      const y = spec.y0 + rowStep * (row + 0.5)
      for (let column = 0; column < spec.columns; column += 1) {
        const along = -span / 2 + margin + colStep * (column + 0.5)
        const lit =
          random() < spec.litRatio ||
          row === glowRow ||
          (row === glowRowB && random() < 0.45) ||
          (column === glowColumn && random() < 0.3)
        if (!lit && spec.darkPanes === false) continue

        const paneWidth =
          style === 'ribbon'
            ? colStep * 0.9
            : style === 'glass'
              ? colStep * 0.82
              : colStep * 0.52
        const paneHeight =
          style === 'ribbon'
            ? rowStep * 0.5
            : style === 'glass'
              ? rowStep * 0.78
              : rowStep * 0.61

        const [px, pz] = facePoint(face, spec.x, spec.z, spec.width, spec.depth, along, 0.07)
        target.push({
          position: [px, y, pz],
          rotationY: face.rotationY,
          scale: [paneWidth, paneHeight],
          color: windowColour(random, lit, palette, spec.warmBias ?? 0),
        })
      }
    }
  }
}

/** Slim vertical mullions at every window boundary. */
export function emitMullions(
  spec: WindowSpec,
  target: BoxTransform[],
  options: { width?: number; depth?: number; every?: number } = {},
) {
  const faces = spec.faces ?? FACES
  const margin = spec.margin ?? 0.8
  const width = options.width ?? 0.055
  const depth = options.depth ?? 0.08
  const every = options.every ?? 1
  const height = spec.y1 - spec.y0 - 0.4

  for (const face of faces) {
    const span = face.axis === 'z' ? spec.width : spec.depth
    const colStep = (span - margin * 2) / spec.columns
    for (let column = 0; column <= spec.columns; column += every) {
      const along = -span / 2 + margin + colStep * column
      const [px, pz] = facePoint(face, spec.x, spec.z, spec.width, spec.depth, along, 0.03)
      target.push({
        position: [px, (spec.y0 + spec.y1) / 2, pz],
        scale: face.axis === 'z' ? [width, height, depth] : [depth, height, width],
      })
    }
  }
}

/** Projecting facade fins — the vertical rhythm that makes the tower feel engineered. */
export function emitFins(
  spec: WindowSpec,
  target: BoxTransform[],
  options: { width?: number; depth?: number; every?: number; start?: number } = {},
) {
  const faces = spec.faces ?? FACES
  const margin = spec.margin ?? 0.8
  const width = options.width ?? 0.2
  const depth = options.depth ?? 0.5
  const every = options.every ?? 1
  const start = options.start ?? 0
  const height = spec.y1 - spec.y0 - 0.35

  for (const face of faces) {
    const span = face.axis === 'z' ? spec.width : spec.depth
    const colStep = (span - margin * 2) / spec.columns
    for (let column = start; column <= spec.columns; column += every) {
      const along = -span / 2 + margin + colStep * column
      const [px, pz] = facePoint(face, spec.x, spec.z, spec.width, spec.depth, along, depth / 2 - 0.02)
      target.push({
        position: [px, (spec.y0 + spec.y1) / 2, pz],
        scale: face.axis === 'z' ? [width, height, depth] : [depth, height, width],
      })
    }
  }
}

/** Horizontal spandrel / floor bands running around all four faces. */
export function emitBands(
  spec: WindowSpec,
  target: BoxTransform[],
  options: { height?: number; depth?: number; every?: number } = {},
) {
  const faces = spec.faces ?? FACES
  const bandHeight = options.height ?? 0.12
  const bandDepth = options.depth ?? 0.09
  const every = options.every ?? 1
  const rowStep = (spec.y1 - spec.y0) / spec.rows

  for (const face of faces) {
    const span = face.axis === 'z' ? spec.width : spec.depth
    for (let row = 0; row <= spec.rows; row += every) {
      const y = spec.y0 + rowStep * row
      const [px, pz] = facePoint(face, spec.x, spec.z, spec.width, spec.depth, 0, 0.035)
      target.push({
        position: [px, y, pz],
        scale:
          face.axis === 'z'
            ? [span - 0.35, bandHeight, bandDepth]
            : [bandDepth, bandHeight, span - 0.35],
      })
    }
  }
}

/** Windows wrapped around a cylindrical shaft, each pane tangent to the curve. */
export function emitCylinderWindows(
  spec: {
    x: number
    z: number
    radius: number
    y0: number
    y1: number
    rows: number
    segments: number
    litRatio: number
    seed: number
    style?: WindowStyle
    darkPanes?: boolean
  },
  palette: WindowPalette,
  target: WindowDatum[],
) {
  const random = mulberry32(spec.seed)
  const rowStep = (spec.y1 - spec.y0) / spec.rows
  const arc = (Math.PI * 2 * spec.radius) / spec.segments
  const width = spec.style === 'glass' ? arc * 0.78 : spec.style === 'ribbon' ? arc * 0.86 : arc * 0.5
  const height = spec.style === 'ribbon' ? rowStep * 0.5 : spec.style === 'glass' ? rowStep * 0.8 : rowStep * 0.62

  for (let row = 0; row < spec.rows; row += 1) {
    const y = spec.y0 + rowStep * (row + 0.5)
    for (let segment = 0; segment < spec.segments; segment += 1) {
      const angle = (segment / spec.segments) * Math.PI * 2
      const lit = random() < spec.litRatio
      if (!lit && spec.darkPanes === false) continue
      target.push({
        position: [
          spec.x + Math.cos(angle) * (spec.radius + 0.07),
          y,
          spec.z + Math.sin(angle) * (spec.radius + 0.07),
        ],
        rotationY: Math.PI / 2 - angle,
        scale: [width, height],
        color: windowColour(random, lit, palette, 0.04),
      })
    }
  }
}

const UP = new Vector3(0, 1, 0)

/** A box stretched between two points — diagonal bracing and crown struts. */
export function strutBetween(from: Vec3, to: Vec3, thickness: number): BoxTransform {
  const a = new Vector3(...from)
  const b = new Vector3(...to)
  const direction = b.clone().sub(a)
  const length = direction.length()
  const quaternion = new Quaternion().setFromUnitVectors(UP, direction.normalize())
  const euler = new Euler().setFromQuaternion(quaternion)
  const middle = a.clone().add(b).multiplyScalar(0.5)
  return {
    position: [middle.x, middle.y, middle.z],
    scale: [thickness, length, thickness],
    rotation: [euler.x, euler.y, euler.z],
  }
}

export function box(position: Vec3, scale: Vec3, rotation?: Vec3): BoxTransform {
  return rotation ? { position, scale, rotation } : { position, scale }
}