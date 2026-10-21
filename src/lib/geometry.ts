import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
} from 'three'

type Point3 = [number, number, number]

/** Pushes a quad with triangles wound so the supplied normal face is the front face. */
function addQuad(
  positions: number[],
  normals: number[],
  a: Point3,
  b: Point3,
  c: Point3,
  d: Point3,
  normal: Point3,
) {
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const uz = b[2] - a[2]
  const vx = c[0] - a[0]
  const vy = c[1] - a[1]
  const vz = c[2] - a[2]
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const facing = nx * normal[0] + ny * normal[1] + nz * normal[2] > 0

  const order = facing ? [a, b, c, a, c, d] : [a, d, c, a, c, b]
  for (const p of order) positions.push(p[0], p[1], p[2])
  for (let i = 0; i < 6; i += 1) normals.push(normal[0], normal[1], normal[2])
}

function addTriangle(
  positions: number[],
  normals: number[],
  a: Point3,
  b: Point3,
  c: Point3,
  normal: Point3,
) {
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const uz = b[2] - a[2]
  const vx = c[0] - a[0]
  const vy = c[1] - a[1]
  const vz = c[2] - a[2]
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const facing = nx * normal[0] + ny * normal[1] + nz * normal[2] > 0
  const order = facing ? [a, b, c] : [a, c, b]
  for (const p of order) positions.push(p[0], p[1], p[2])
  for (let i = 0; i < 3; i += 1) normals.push(normal[0], normal[1], normal[2])
}

/**
 * A unit box with a real chamfer. Every bevel is a flat facet with its own
 * normal, so the silhouette keeps the hard architectural edge while the
 * narrow bevel catches a crisp highlight — the "precise" half of the 3D→2D look.
 */
export function createChamferBoxGeometry(bevel = 0.045): BufferGeometry {
  const h = 0.5
  const b = Math.min(bevel, h * 0.45)
  const m = h - b
  const positions: number[] = []
  const normals: number[] = []

  const point = (x: number, y: number, z: number): Point3 => [x, y, z]

  // Six flat faces, inset by the bevel.
  for (let axis = 0; axis < 3; axis += 1) {
    for (const sign of [-1, 1] as const) {
      const normal: Point3 = [0, 0, 0]
      normal[axis] = sign
      const corners: Point3[] = []
      const otherA = (axis + 1) % 3
      const otherB = (axis + 2) % 3
      for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        const p: Point3 = [0, 0, 0]
        p[axis] = sign * h
        p[otherA] = sa * m
        p[otherB] = sb * m
        corners.push(p)
      }
      addQuad(positions, normals, corners[0], corners[1], corners[2], corners[3], normal)
    }
  }

  // Twelve bevel strips.
  for (let axis = 0; axis < 3; axis += 1) {
    for (let other = 0; other < 3; other += 1) {
      if (other === axis) continue
      const third = 3 - axis - other
      for (const sign of [-1, 1] as const) {
        for (const otherSign of [-1, 1] as const) {
          const normal: Point3 = [0, 0, 0]
          normal[axis] = sign
          normal[other] = otherSign
          const length = Math.hypot(normal[0], normal[1], normal[2])
          normal[0] /= length
          normal[1] /= length
          normal[2] /= length

          const make = (a: number, o: number, t: number): Point3 => {
            const p: Point3 = [0, 0, 0]
            p[axis] = a
            p[other] = o
            p[third] = t
            return p
          }
          addQuad(
            positions,
            normals,
            make(sign * h, otherSign * m, -m),
            make(sign * m, otherSign * h, -m),
            make(sign * m, otherSign * h, m),
            make(sign * h, otherSign * m, m),
            normal,
          )
        }
      }
    }
  }

  // Eight corner triangles.
  for (const sx of [-1, 1] as const) {
    for (const sy of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const normal: Point3 = [sx, sy, sz]
        const length = Math.hypot(1, 1, 1)
        normal[0] /= length
        normal[1] /= length
        normal[2] /= length
        addTriangle(
          positions,
          normals,
          point(sx * h, sy * m, sz * m),
          point(sx * m, sy * h, sz * m),
          point(sx * m, sy * m, sz * h),
          normal,
        )
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function roundedRectShape(width: number, depth: number, radius: number) {
  const w = width / 2
  const d = depth / 2
  const r = Math.min(radius, w, d)
  const shape = new Shape()
  shape.moveTo(-w + r, -d)
  shape.lineTo(w - r, -d)
  shape.quadraticCurveTo(w, -d, w, -d + r)
  shape.lineTo(w, d - r)
  shape.quadraticCurveTo(w, d, w - r, d)
  shape.lineTo(-w + r, d)
  shape.quadraticCurveTo(-w, d, -w, d - r)
  shape.lineTo(-w, -d + r)
  shape.quadraticCurveTo(-w, -d, -w + r, -d)
  return shape
}

/**
 * A rounded plan extruded vertically — used for the cantilevered observation
 * pod. This is where the tower gets its genuinely curved, machined silhouette.
 */
export function createRoundedSlabGeometry(
  width: number,
  depth: number,
  radius: number,
  height: number,
  bevel = 0.07,
) {
  const shape = roundedRectShape(width, depth, radius)
  const geometry = new ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 18,
    steps: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -height / 2 + bevel, 0)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
/**
 * A truncated rectangular pyramid: four flat sloped faces and a flat cap.
 * The Stark crown uses this instead of a gable so it reads as a machined,
 * faceted lantern rather than a house roof.
 */
export function createFrustumGeometry(
  bottomWidth: number,
  bottomDepth: number,
  topWidth: number,
  topDepth: number,
  height: number,
) {
  const bw = bottomWidth / 2
  const bd = bottomDepth / 2
  const tw = topWidth / 2
  const td = topDepth / 2

  const positions: number[] = []
  const normals: number[] = []

  addQuad(
    positions,
    normals,
    [-bw, 0, bd],
    [bw, 0, bd],
    [tw, height, td],
    [-tw, height, td],
    [0, bd - td, height],
  )
  addQuad(
    positions,
    normals,
    [bw, 0, -bd],
    [-bw, 0, -bd],
    [-tw, height, -td],
    [tw, height, -td],
    [0, bd - td, -height],
  )
  addQuad(
    positions,
    normals,
    [bw, 0, bd],
    [bw, 0, -bd],
    [tw, height, -td],
    [tw, height, td],
    [bw - tw, 0, 0],
  )
  addQuad(
    positions,
    normals,
    [-bw, 0, -bd],
    [-bw, 0, bd],
    [-tw, height, td],
    [-tw, height, -td],
    [-(bw - tw), 0, 0],
  )

  const sides = new BufferGeometry()
  sides.setAttribute('position', new Float32BufferAttribute(positions, 3))
  sides.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  sides.computeBoundingSphere()

  const capPositions: number[] = []
  const capNormals: number[] = []
  addQuad(
    capPositions,
    capNormals,
    [-tw, height, td],
    [tw, height, td],
    [tw, height, -td],
    [-tw, height, -td],
    [0, 1, 0],
  )
  const cap = new BufferGeometry()
  cap.setAttribute('position', new Float32BufferAttribute(capPositions, 3))
  cap.setAttribute('normal', new Float32BufferAttribute(capNormals, 3))
  cap.computeBoundingSphere()

  return { sides, cap }
}