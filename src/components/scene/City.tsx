import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DynamicDrawUsage,
  FrontSide,
  MeshBasicMaterial,
  Object3D,
  type InstancedMesh,
  type MeshToonMaterial,
} from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import { CEL_FRAME_RAMP, CEL_GLASS_RAMP, CEL_STRUCTURE_RAMP, createCelMaterial } from '../../lib/cel'
import { mulberry32 } from '../../lib/random'
import { createBillboardTexture, type BillboardSpec } from '../../lib/textures'
import type { BoxTransform, SceneSettings, Vec3 } from '../../types'
import {
  box,
  createWindowPalette,
  strutBetween,
  emitBands,
  emitCylinderWindows,
  emitFins,
  emitMullions,
  emitWindows,
  type Face,
  type WindowDatum,
  type WindowSpec,
  type WindowStyle,
} from './facade'
import {
  EdgeLines,
  InstancedBoxes,
  InstancedChamferBoxes,
  InstancedCones,
  InstancedCylinders,
  WindowField,
} from './InstancedMeshes'

interface CityProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

interface BillboardPlacement {
  position: Vec3
  rotationY: number
  height: number
  spec: BillboardSpec
}

type Archetype = 'low' | 'slab' | 'setback' | 'deco' | 'round' | 'twin' | 'silhouette'

interface CitySite {
  x: number
  z: number
  width: number
  depth: number
  height: number
  seed: number
  archetype: Archetype
  tint: Color
  detail: boolean
  hero: boolean
}

interface CityData {
  solids: BoxTransform[]
  solidColors: Vec3[]
  cylinders: BoxTransform[]
  cylinderColors: Vec3[]
  cones: BoxTransform[]
  coneColors: Vec3[]
  trim: BoxTransform[]
  frames: BoxTransform[]
  glass: BoxTransform[]
  greebles: BoxTransform[]
  windows: WindowDatum[]
  neonCyan: BoxTransform[]
  neonMagenta: BoxTransform[]
  warm: BoxTransform[]
  edges: BoxTransform[]
  beacons: Vec3[]
  billboards: BillboardPlacement[]
}

interface CityDataInternal extends CityData {
  windowPalette: ReturnType<typeof createWindowPalette>
}

interface CityMaterials {
  solid: MeshToonMaterial
  trim: MeshToonMaterial
  frame: MeshToonMaterial
  glass: MeshToonMaterial
  metal: MeshToonMaterial
  cyan: MeshBasicMaterial
  magenta: MeshBasicMaterial
  warm: MeshBasicMaterial
}

const BILLBOARD_A: BillboardSpec = {
  kicker: 'NIGHT CITY // 07',
  title: 'NEON',
  subline: 'セクター 07 · 夜の街',
  accent: '#55f5ff',
  secondary: '#ff2bd6',
}

const BILLBOARD_B: BillboardSpec = {
  kicker: 'STARK INDUSTRIES',
  title: 'ARC',
  subline: 'POWER THE FUTURE',
  accent: '#ff2bd6',
  secondary: '#55f5ff',
}

const PRISM_FACTOR = Math.SQRT2

function tintFor(random: () => number, cyan: Color, magenta: Color) {
  const base = new Color('#22313c').lerp(new Color('#2c3947'), random() * 0.8)
  if (random() > 0.68) base.lerp(magenta, 0.045)
  else base.lerp(cyan, 0.03)
  return base
}

function addMass(
  data: CityData,
  x: number,
  z: number,
  y0: number,
  y1: number,
  width: number,
  depth: number,
  tint: Color,
  edge = true,
) {
  const height = Math.max(0.2, y1 - y0)
  data.solids.push(box([x, (y0 + y1) / 2, z], [width, height, depth]))
  data.solidColors.push([tint.r, tint.g, tint.b])
  if (edge) {
    data.edges.push(
      box(
        [x, (y0 + y1) / 2, z],
        [Math.max(0.3, width - 0.06), Math.max(0.3, height - 0.06), Math.max(0.3, depth - 0.06)],
      ),
    )
  }
}

function addCylinder(
  data: CityData,
  x: number,
  z: number,
  y0: number,
  y1: number,
  radiusX: number,
  radiusZ: number,
  tint: Color,
) {
  data.cylinders.push(box([x, (y0 + y1) / 2, z], [radiusX, y1 - y0, radiusZ]))
  data.cylinderColors.push([tint.r, tint.g, tint.b])
}

function addCone(
  data: CityData,
  x: number,
  z: number,
  y0: number,
  y1: number,
  width: number,
  depth: number,
  tint: Color,
) {
  data.cones.push(box([x, (y0 + y1) / 2, z], [width / PRISM_FACTOR, y1 - y0, depth / PRISM_FACTOR]))
  data.coneColors.push([tint.r, tint.g, tint.b])
}

function inwardFaces(site: CitySite): Face[] {
  const zSign = site.z > 0 ? -1 : 1
  const xSign = site.x > 0 ? -1 : 1
  return [
    { axis: 'z', sign: zSign as 1 | -1, rotationY: zSign > 0 ? 0 : Math.PI },
    { axis: 'x', sign: xSign as 1 | -1, rotationY: xSign > 0 ? Math.PI / 2 : -Math.PI / 2 },
  ]
}

function addFacade(
  data: CityDataInternal,
  site: CitySite,
  y0: number,
  y1: number,
  width: number,
  depth: number,
  seed: number,
  litRatio: number,
  style: WindowStyle,
) {
  if (y1 - y0 < 1.4) return
  const span = Math.max(width, depth)
  const columns = Math.max(3, Math.min(10, Math.round((span - 1.2) / 1.5)))
  const rows = Math.max(2, Math.round((y1 - y0 - 0.8) / 1.55))
  const spec: WindowSpec = {
    x: site.x,
    z: site.z,
    y0: y0 + 0.5,
    y1: y1 - 0.4,
    width,
    depth,
    columns,
    rows,
    litRatio,
    seed,
    margin: 0.6,
    style,
    faces: site.detail ? undefined : inwardFaces(site),
    darkPanes: site.detail,
    warmBias: 0.05,
  }
  emitWindows({ ...spec, litRatio: spec.litRatio * 0.72 }, data.windowPalette, data.windows)
  if (site.detail) {
    emitFins(spec, data.frames, { every: 2, width: 0.12, depth: 0.24 })
    emitBands(spec, data.trim, { every: 2, height: 0.11, depth: 0.055 })
    emitMullions(spec, data.frames, { every: 2, width: 0.04, depth: 0.05 })
  }
}

function addStorefront(data: CityDataInternal, site: CitySite) {
  const { x, z, width, depth } = site
  const front = depth / 2
  data.glass.push(box([x, 1.35, z + front + 0.015], [width * 0.93, 1.95, 0.06]))
  data.glass.push(box([x - width / 2 - 0.015, 1.35, z], [0.06, 1.95, depth * 0.9]))
  data.glass.push(box([x + width / 2 + 0.015, 1.35, z], [0.06, 1.95, depth * 0.9]))

  const bays = Math.max(3, Math.round(width / 1.5))
  for (let index = 0; index <= bays; index += 1) {
    const px = x - (width * 0.93) / 2 + ((width * 0.93) / bays) * index
    data.frames.push(box([px, 1.35, z + front + 0.05], [0.055, 1.95, 0.08]))
  }

  data.warm.push(box([x, 2.28, z + front + 0.06], [width * 0.9, 0.055, 0.06]))
  data.trim.push(box([x, 2.85, z + front + 0.8], [width * 1.1, 0.16, 1.7]))
  data.trim.push(box([x, 3.12, z + front + 1.5], [width * 1.1, 0.12, 0.3]))
  data.neonMagenta.push(box([x, 2.99, z + front + 1.67], [width * 1.03, 0.05, 0.06]))

  // A stone plinth grounds every storefront instead of letting it float.
  data.trim.push(box([x, 0.2, z], [width + 0.45, 0.4, depth + 0.45]))

  // One vertical blade sign every few buildings: the classic street-level cue.
  if (site.detail && site.seed % 3 === 0) {
    const side = site.seed % 2 === 0 ? -1 : 1
    const signX = x + side * (width / 2 + 0.32)
    const signZ = z + front - 1.1
    const signTop = 4.6 + (site.seed % 5) * 0.35
    const target = site.seed % 2 === 0 ? data.neonCyan : data.neonMagenta
    data.frames.push(box([signX, signTop / 2 + 1.0, signZ], [0.34, signTop, 0.24]))
    target.push(box([signX + side * 0.2, signTop / 2 + 1.0, signZ], [0.08, signTop - 0.4, 0.3]))
    for (let tick = 0; tick < 3; tick += 1) {
      target.push(box([signX + side * 0.2, 2.4 + tick * 1.1, signZ], [0.09, 0.07, 0.5]))
    }
  }
}

function addRoof(data: CityDataInternal, site: CitySite, top: number, width: number, depth: number) {
  const random = mulberry32(site.seed ^ 0x5eed)
  const { x, z, tint } = site
  const parapetHeight = 0.55

  data.trim.push(box([x, top + parapetHeight / 2, z + depth / 2 - 0.12], [width, parapetHeight, 0.24]))
  data.trim.push(box([x, top + parapetHeight / 2, z - depth / 2 + 0.12], [width, parapetHeight, 0.24]))
  data.trim.push(box([x + width / 2 - 0.12, top + parapetHeight / 2, z], [0.24, parapetHeight, depth]))
  data.trim.push(box([x - width / 2 + 0.12, top + parapetHeight / 2, z], [0.24, parapetHeight, depth]))

  const mechWidth = width * (0.32 + random() * 0.2)
  const mechDepth = depth * (0.3 + random() * 0.2)
  const mechX = x + (random() - 0.5) * Math.max(0, width - mechWidth - 1)
  const mechZ = z + (random() - 0.5) * Math.max(0, depth - mechDepth - 1)
  addMass(data, mechX, mechZ, top, top + 1.1 + random() * 1.4, mechWidth, mechDepth, tint, false)
  data.greebles.push(
    box([mechX, top + 0.65, mechZ + mechDepth / 2 + 0.02], [mechWidth * 0.6, 0.16, 0.05]),
  )

  if (random() < 0.45) {
    addCylinder(data, mechX + mechWidth * 0.28, mechZ - mechDepth * 0.2, top, top + 1.8, 0.85, 0.85, tint)
    addCone(
      data,
      mechX + mechWidth * 0.28,
      mechZ - mechDepth * 0.2,
      top + 1.8,
      top + 2.55,
      1.15,
      1.15,
      tint,
    )
  }

  if (random() < 0.72) {
    const mastHeight = 3 + random() * 6
    const mastX = x + (random() - 0.5) * width * 0.5
    const mastZ = z + (random() - 0.5) * depth * 0.5
    addCylinder(data, mastX, mastZ, top, top + mastHeight, 0.055, 0.055, tint)
    data.beacons.push([mastX, top + mastHeight + 0.15, mastZ])
  }

  if (site.detail) {
    const inwardX = x > 0 ? -1 : 1
    const inwardZ = z > 0 ? -1 : 1
    const target = random() > 0.5 ? data.neonCyan : data.neonMagenta
    if (Math.abs(x) > Math.abs(z)) {
      target.push(box([x + inwardX * (width / 2 - 0.2), top + 0.62, z], [0.06, 0.05, depth * 0.67]))
    } else {
      target.push(box([x, top + 0.62, z + inwardZ * (depth / 2 - 0.2)], [width * 0.67, 0.05, 0.06]))
    }
  }
}

function composeLow(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const baseHeight = Math.max(4, site.height * (0.55 + random() * 0.3))
  addMass(data, site.x, site.z, 0, baseHeight, site.width, site.depth, site.tint)
  addFacade(data, site, 0, baseHeight, site.width, site.depth, site.seed, 0.24 + random() * 0.14, random() > 0.5 ? 'ribbon' : 'bay')
  addStorefront(data, site)

  const setbackSite: CitySite = {
    ...site,
    x: site.x + (random() - 0.5) * 1.2,
    z: site.z + (random() - 0.5) * 1.2,
    width: site.width * 0.64,
    depth: site.depth * 0.62,
  }
  addMass(
    data,
    setbackSite.x,
    setbackSite.z,
    baseHeight,
    site.height,
    setbackSite.width,
    setbackSite.depth,
    site.tint.clone().multiplyScalar(0.9),
    false,
  )
  data.trim.push(box([site.x, baseHeight + 0.18, site.z], [site.width + 0.5, 0.3, site.depth + 0.5]))
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      data.trim.push(
        box(
          [site.x + sx * (site.width / 2 - 0.22), baseHeight / 2, site.z + sz * (site.depth / 2 - 0.22)],
          [0.3, baseHeight, 0.3],
        ),
      )
    }
  }
  addRoof(data, setbackSite, site.height, setbackSite.width, setbackSite.depth)
}

function composeSlab(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const podium = 2.6 + random() * 2.2
  addMass(data, site.x, site.z, 0, podium, site.width * 1.14, site.depth * 1.14, site.tint.clone().multiplyScalar(0.82))
  data.trim.push(box([site.x, podium + 0.12, site.z], [site.width * 1.2, 0.3, site.depth * 1.2]))
  addStorefront(data, site)

  addMass(data, site.x, site.z, podium, site.height, site.width, site.depth, site.tint)
  addFacade(data, site, podium, site.height, site.width, site.depth, site.seed + 11, 0.2 + random() * 0.16, random() > 0.62 ? 'ribbon' : 'bay')

  const crownStart = site.height - (2.2 + random() * 3)
  data.trim.push(box([site.x, crownStart, site.z], [site.width + 0.55, 0.35, site.depth + 0.55]))
  if (random() > 0.42) {
    const upperWidth = site.width * 0.8
    const upperDepth = site.depth * 0.8
    addMass(data, site.x, site.z, crownStart, site.height + 1.6, upperWidth, upperDepth, site.tint, true)
    addFacade(data, site, crownStart + 0.3, site.height + 1.4, upperWidth, upperDepth, site.seed + 29, 0.22, 'bay')
    addRoof(data, site, site.height + 1.6, upperWidth, upperDepth)
  } else {
    addRoof(data, site, site.height, site.width, site.depth)
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      data.frames.push(
        box(
          [site.x + sx * (site.width / 2 - 0.25), (podium + site.height) / 2, site.z + sz * (site.depth / 2 - 0.25)],
          [0.32, site.height - podium - 0.4, 0.32],
        ),
      )
    }
  }
}

function composeSetback(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const tiers = 2 + Math.floor(random() * 2)
  const podium = 2.4 + random() * 2
  addMass(data, site.x, site.z, 0, podium, site.width * 1.16, site.depth * 1.16, site.tint.clone().multiplyScalar(0.82))
  addStorefront(data, site)

  let currentWidth = site.width
  let currentDepth = site.depth
  let currentY = podium
  for (let tier = 0; tier < tiers; tier += 1) {
    const top = site.height * ((tier + 1) / tiers)
    const tint = site.tint.clone().multiplyScalar(1 - tier * 0.04)
    addMass(data, site.x, site.z, currentY, top, currentWidth, currentDepth, tint)
    addFacade(
      data,
      site,
      currentY,
      top,
      currentWidth,
      currentDepth,
      site.seed + tier * 41,
      0.19 + random() * 0.15,
      tier === 0 ? 'ribbon' : 'bay',
    )
    data.trim.push(box([site.x, top + 0.15, site.z], [currentWidth + 0.7, 0.34, currentDepth + 0.7]))
    if (tier < tiers - 1) {
      currentY = top + 0.15
      currentWidth *= 0.8 + random() * 0.07
      currentDepth *= 0.8 + random() * 0.07
    }
  }

  addRoof(data, site, site.height, currentWidth, currentDepth)
}

function composeDeco(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const tiers = 3 + Math.floor(random() * 2)
  let width = site.width
  let depth = site.depth
  let y = 0
  for (let tier = 0; tier < tiers; tier += 1) {
    const top = site.height * (0.5 + (tier / tiers) * 0.5)
    addMass(data, site.x, site.z, y, top, width, depth, site.tint.clone().multiplyScalar(1 - tier * 0.03))
    addFacade(
      data,
      site,
      y,
      top,
      width,
      depth,
      site.seed + tier * 53,
      0.17 + random() * 0.13,
      tier < 2 ? 'ribbon' : 'bay',
    )
    data.trim.push(box([site.x, top + 0.12, site.z], [width + 0.55, 0.3, depth + 0.55]))
    y = top + 0.12
    width *= 0.82
    depth *= 0.82
  }

  // A glazed lantern under a slimmer, ribbed crown. The ribs stop the prism
  // reading as a black tent, and the lantern gives the crown a human scale.
  const crownWidth = width * 0.86
  const crownDepth = depth * 0.86
  const lanternTop = site.height + 1.5
  addMass(data, site.x, site.z, site.height - 0.2, lanternTop, crownWidth, crownDepth, site.tint.clone().multiplyScalar(1.18), true)
  data.glass.push(box([site.x, site.height + 0.7, site.z], [crownWidth + 0.06, 1.15, crownDepth + 0.06]))
  data.neonCyan.push(box([site.x, site.height + 0.08, site.z], [crownWidth + 0.3, 0.06, crownDepth + 0.3]))
  const prismBase = lanternTop
  const prismTop = prismBase + 4.0
  addCone(data, site.x, site.z, prismBase, prismTop, crownWidth * 0.86, crownDepth * 0.86, site.tint.clone().multiplyScalar(1.26))
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      data.frames.push(
        strutBetween(
          [site.x + sx * (crownWidth * 0.43), prismBase, site.z + sz * (crownDepth * 0.43)],
          [site.x, prismTop - 0.08, site.z],
          0.12,
        ),
      )
    }
  }
  data.neonCyan.push(box([site.x, prismBase + 0.12, site.z], [crownWidth * 0.9, 0.06, crownDepth * 0.9]))
  data.beacons.push([site.x, prismTop + 0.12, site.z])
}

function composeRound(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const radius = Math.min(site.width, site.depth) / 2
  const oldWidth = site.width
  const oldDepth = site.depth
  site.width = radius * 2
  site.depth = radius * 2
  const podium = 2.2 + random() * 1.8
  addMass(data, site.x, site.z, 0, podium, oldWidth * 1.15, oldDepth * 1.15, site.tint.clone().multiplyScalar(0.8))
  addStorefront(data, site)

  const bodyTop = site.height * 0.84
  addCylinder(data, site.x, site.z, podium, bodyTop, radius, radius, site.tint)
  const rows = Math.max(4, Math.round((bodyTop - podium) / 1.55))
  emitCylinderWindows(
    {
      x: site.x,
      z: site.z,
      radius,
      y0: podium + 0.5,
      y1: bodyTop - 0.4,
      rows,
      segments: site.detail ? 20 : 12,
      litRatio: 0.25 + random() * 0.12,
      seed: site.seed + 71,
      style: 'bay',
      darkPanes: site.detail,
    },
    data.windowPalette,
    data.windows,
  )

  for (const fraction of [0.4, 0.7, 1]) {
    const y = podium + (bodyTop - podium) * fraction
    addCylinder(data, site.x, site.z, y - 0.12, y + 0.12, radius + 0.25, radius + 0.25, site.tint.clone().multiplyScalar(0.7))
  }

  const drumTop = site.height + 1.4
  addCylinder(data, site.x, site.z, bodyTop, drumTop, radius * 0.62, radius * 0.62, site.tint.clone().multiplyScalar(0.9))
  const mastHeight = 3.5 + random() * 4
  addCylinder(data, site.x, site.z, drumTop, drumTop + mastHeight, 0.08, 0.08, site.tint)
  data.beacons.push([site.x, drumTop + mastHeight + 0.2, site.z])
  data.neonCyan.push(box([site.x, drumTop - 0.25, site.z], [radius * 1.3, 0.055, radius * 1.3]))

  const inwardX = site.x > 0 ? -1 : 1
  data.neonCyan.push(
    box([site.x + inwardX * (radius + 0.04), podium + (bodyTop - podium) / 2, site.z], [0.05, bodyTop - podium - 0.8, 0.05]),
  )
  data.trim.push(box([site.x, bodyTop + 0.15, site.z], [radius * 2.2, 0.3, radius * 2.2]))
}

function composeTwin(data: CityDataInternal, site: CitySite) {
  const random = mulberry32(site.seed)
  const gap = site.width * 0.16
  const towerWidth = (site.width - gap) / 2
  const podium = 2.8 + random() * 2
  addMass(data, site.x, site.z, 0, podium, site.width * 1.16, site.depth * 1.1, site.tint.clone().multiplyScalar(0.82))
  addStorefront(data, site)

  const offsets = [-(towerWidth + gap) / 2, (towerWidth + gap) / 2]
  offsets.forEach((offset, index) => {
    const towerSite: CitySite = {
      ...site,
      x: site.x + offset,
      width: towerWidth,
      height: site.height + index * 1.4,
    }
    addMass(data, towerSite.x, site.z, podium, towerSite.height, towerWidth, site.depth, site.tint)
    addFacade(data, towerSite, podium, towerSite.height, towerWidth, site.depth, site.seed + index * 67, 0.2 + random() * 0.14, 'bay')
    data.trim.push(box([towerSite.x, towerSite.height + 0.12, site.z], [towerWidth + 0.45, 0.3, site.depth + 0.45]))
    addRoof(data, towerSite, towerSite.height, towerWidth, site.depth)
  })

  const bridgeY = podium + (site.height - podium) * (0.45 + random() * 0.2)
  data.glass.push(box([site.x, bridgeY, site.z], [towerWidth + gap, 1.7, site.depth * 0.55]))
  data.trim.push(box([site.x, bridgeY - 0.95, site.z], [towerWidth + gap + 0.4, 0.25, site.depth * 0.6]))
  data.trim.push(box([site.x, bridgeY + 0.95, site.z], [towerWidth + gap + 0.4, 0.25, site.depth * 0.6]))
  data.warm.push(box([site.x, bridgeY, site.z + site.depth * 0.275], [towerWidth + gap - 0.4, 0.06, 0.06]))
}

function composeSilhouette(data: CityDataInternal, site: CitySite) {
  addMass(data, site.x, site.z, 0, site.height, site.width, site.depth, site.tint, false)
  addMass(data, site.x, site.z, site.height, site.height + site.height * 0.12, site.width * 0.6, site.depth * 0.6, site.tint, false)
  if (site.height > 55) {
    data.beacons.push([site.x, site.height * 1.12 + 0.2, site.z])
  }
}

function billboardFor(site: CitySite, spec: BillboardSpec): BillboardPlacement {
  const signHeight = Math.min(10, Math.max(5, site.height * 0.2))
  const y = Math.max(signHeight / 2 + 4, site.height * 0.58)
  if (Math.abs(site.x) > Math.abs(site.z)) {
    const sign = site.x > 0 ? -1 : 1
    return {
      position: [site.x + sign * (site.width / 2 + 0.3), y, site.z],
      rotationY: sign > 0 ? Math.PI / 2 : -Math.PI / 2,
      height: signHeight,
      spec,
    }
  }
  const sign = site.z > 0 ? -1 : 1
  return {
    position: [site.x, y, site.z + sign * (site.depth / 2 + 0.3)],
    rotationY: sign > 0 ? 0 : Math.PI,
    height: signHeight,
    spec,
  }
}

function buildCityData(neonCyan: string, neonMagenta: string): CityDataInternal {
  const random = mulberry32(0x9f2c71a)
  const cyan = new Color(neonCyan)
  const magenta = new Color(neonMagenta)
  const data: CityDataInternal = {
    solids: [],
    solidColors: [],
    cylinders: [],
    cylinderColors: [],
    cones: [],
    coneColors: [],
    trim: [],
    frames: [],
    glass: [],
    greebles: [],
    windows: [],
    neonCyan: [],
    neonMagenta: [],
    warm: [],
    edges: [],
    beacons: [],
    billboards: [],
    windowPalette: createWindowPalette(neonCyan, neonMagenta),
  }

  const sites: CitySite[] = []
  const rings = [
    {
      count: 15,
      rMin: 49,
      rMax: 63,
      hMin: 6,
      hMax: 17,
      wMin: 7,
      wMax: 14,
      detail: true,
      kinds: ['low', 'low', 'slab', 'low', 'slab'] as Archetype[],
    },
    {
      count: 20,
      rMin: 72,
      rMax: 102,
      hMin: 17,
      hMax: 38,
      wMin: 9,
      wMax: 18,
      detail: true,
      kinds: ['slab', 'setback', 'deco', 'round', 'low', 'slab'] as Archetype[],
    },
    {
      count: 24,
      rMin: 110,
      rMax: 150,
      hMin: 25,
      hMax: 62,
      wMin: 11,
      wMax: 24,
      detail: false,
      kinds: ['setback', 'deco', 'slab', 'round', 'twin', 'deco'] as Archetype[],
    },
  ]

  rings.forEach((ring, ringIndex) => {
    for (let index = 0; index < ring.count; index += 1) {
      const angle = (index / ring.count) * Math.PI * 2 + (random() - 0.5) * 0.12
      const radius = ring.rMin + random() * (ring.rMax - ring.rMin)
      const width = ring.wMin + random() * (ring.wMax - ring.wMin)
      const depth = width * (0.72 + random() * 0.4)
      let height = ring.hMin + Math.pow(random(), 1.35) * (ring.hMax - ring.hMin)
      if (ringIndex === 0) height = Math.min(height, 18)
      const archetype = ring.kinds[Math.floor(random() * ring.kinds.length)]
      sites.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        width,
        depth,
        height,
        seed: 0x31 + ringIndex * 0x400 + index * 97,
        archetype,
        tint: tintFor(random, cyan, magenta),
        detail: ring.detail,
        hero: false,
      })
    }
  })

  const heroes: CitySite[] = [
    {
      x: -88,
      z: 46,
      width: 19,
      depth: 15,
      height: 58,
      seed: 0xabc101,
      archetype: 'deco',
      tint: tintFor(random, cyan, magenta),
      detail: true,
      hero: true,
    },
    {
      x: 94,
      z: -34,
      width: 17,
      depth: 17,
      height: 51,
      seed: 0xabc202,
      archetype: 'round',
      tint: tintFor(random, cyan, magenta),
      detail: true,
      hero: true,
    },
    {
      x: -66,
      z: 58,
      width: 17,
      depth: 17,
      height: 42,
      seed: 0xabc303,
      archetype: 'round',
      tint: tintFor(random, cyan, magenta),
      detail: true,
      hero: true,
    },
  ]
  for (const hero of heroes) {
    sites.push(hero)
    for (let index = sites.length - 2; index >= 0; index -= 1) {
      const site = sites[index]
      if (Math.hypot(site.x - hero.x, site.z - hero.z) < 27) sites.splice(index, 1)
    }
  }

  for (let index = 0; index < 28; index += 1) {
    const angle = (index / 28) * Math.PI * 2 + random() * 0.1
    const radius = 174 + random() * 68
    const width = 14 + random() * 18
    const depth = width * (0.7 + random() * 0.5)
    sites.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      width,
      depth,
      height: 32 + random() * 58,
      seed: 0x5a100 + index * 13,
      archetype: 'silhouette',
      tint: new Color('#0a131b'),
      detail: false,
      hero: false,
    })
  }

  for (const site of sites) {
    switch (site.archetype) {
      case 'low':
        composeLow(data, site)
        break
      case 'slab':
        composeSlab(data, site)
        break
      case 'setback':
        composeSetback(data, site)
        break
      case 'deco':
        composeDeco(data, site)
        break
      case 'round':
        composeRound(data, site)
        break
      case 'twin':
        composeTwin(data, site)
        break
      case 'silhouette':
        composeSilhouette(data, site)
        break
    }
  }

  data.billboards.push(
    billboardFor(heroes[0], BILLBOARD_A),
    billboardFor(heroes[1], BILLBOARD_B),
  )

  return data
}

function useCityMaterials(
  palette: AtmospherePalette,
  neonCyan: string,
  neonMagenta: string,
): CityMaterials {
  const neonPower = 0.55 + palette.neonIntensity * 1.4
  return useMemo(() => {
    const cyanGlow = new Color(neonCyan).multiplyScalar(0.35 + neonPower * 0.45)
    const magentaGlow = new Color(neonMagenta).multiplyScalar(0.3 + neonPower * 0.4)
    return {
      solid: createCelMaterial({
        color: '#ffffff',
        ramp: CEL_STRUCTURE_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.16,
        rimPower: 3.4,
        skyColor: '#3f718f',
        skyStrength: 0.18,
        groundColor: magentaGlow,
        groundStrength: 0.12,
        edgeDarkness: 0.3,
        emissive: '#02070c',
        emissiveIntensity: 0.45,
      }),
      trim: createCelMaterial({
        color: '#4a5a65',
        ramp: CEL_STRUCTURE_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.2,
        rimPower: 3.2,
        skyColor: '#4c7d9b',
        skyStrength: 0.2,
        groundColor: magentaGlow,
        groundStrength: 0.1,
        edgeDarkness: 0.26,
        emissive: '#03090f',
        emissiveIntensity: 0.4,
      }),
      frame: createCelMaterial({
        color: '#1d2c36',
        ramp: CEL_FRAME_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.24,
        rimPower: 3,
        skyColor: '#3a6b89',
        skyStrength: 0.16,
        groundColor: magentaGlow,
        groundStrength: 0.1,
        edgeDarkness: 0.3,
        emissive: '#01080d',
        emissiveIntensity: 0.45,
      }),
      glass: createCelMaterial({
        color: '#0a2330',
        ramp: CEL_GLASS_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.6,
        rimPower: 2.4,
        skyColor: '#5b9cbc',
        skyStrength: 0.2,
        groundColor: magentaGlow,
        groundStrength: 0.08,
        edgeDarkness: 0.12,
        emissive: '#02090f',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        side: FrontSide,
      }),
      metal: createCelMaterial({
        color: '#26343e',
        ramp: CEL_FRAME_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.3,
        rimPower: 2.8,
        skyColor: '#426f8c',
        skyStrength: 0.18,
        groundColor: magentaGlow,
        groundStrength: 0.12,
        edgeDarkness: 0.28,
        emissive: '#02080d',
        emissiveIntensity: 0.45,
      }),
      cyan: new MeshBasicMaterial({
        color: new Color(neonCyan).multiplyScalar(0.78 + neonPower * 0.28),
        toneMapped: false,
      }),
      magenta: new MeshBasicMaterial({
        color: new Color(neonMagenta).multiplyScalar(0.72 + neonPower * 0.24),
        toneMapped: false,
      }),
      warm: new MeshBasicMaterial({
        color: new Color('#ffb878').multiplyScalar(0.78),
        toneMapped: false,
      }),
    }
  }, [neonCyan, neonMagenta, neonPower])
}

function useDisposeMaterials(materials: CityMaterials) {
  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose())
    },
    [materials],
  )
}

function ToonMaterial({ material }: { material: MeshToonMaterial }) {
  return <primitive object={material} attach="material" />
}

function CitySolids({ data, materials }: { data: CityData; materials: CityMaterials }) {
  return (
    <>
      <InstancedChamferBoxes items={data.solids} colors={data.solidColors} castShadow receiveShadow>
        <ToonMaterial material={materials.solid} />
      </InstancedChamferBoxes>
      <InstancedCylinders items={data.cylinders} colors={data.cylinderColors} castShadow receiveShadow>
        <ToonMaterial material={materials.solid} />
      </InstancedCylinders>
      <InstancedCones items={data.cones} colors={data.coneColors} castShadow receiveShadow>
        <ToonMaterial material={materials.solid} />
      </InstancedCones>
      <InstancedBoxes items={data.trim} castShadow receiveShadow>
        <ToonMaterial material={materials.trim} />
      </InstancedBoxes>
      <InstancedBoxes items={data.frames} castShadow>
        <ToonMaterial material={materials.frame} />
      </InstancedBoxes>
      <InstancedBoxes items={data.greebles} castShadow>
        <ToonMaterial material={materials.metal} />
      </InstancedBoxes>
      <InstancedBoxes items={data.glass}>
        <primitive object={materials.glass} attach="material" />
      </InstancedBoxes>
      <InstancedBoxes items={data.neonCyan}>
        <primitive object={materials.cyan} attach="material" />
      </InstancedBoxes>
      <InstancedBoxes items={data.neonMagenta}>
        <primitive object={materials.magenta} attach="material" />
      </InstancedBoxes>
      <InstancedBoxes items={data.warm}>
        <primitive object={materials.warm} attach="material" />
      </InstancedBoxes>
      <EdgeLines items={data.edges} color="#020810" opacity={0.62} />
    </>
  )
}

function CityBillboard({
  placement,
  materials,
}: {
  placement: BillboardPlacement
  materials: CityMaterials
}) {
  const texture = useMemo(() => createBillboardTexture(placement.spec), [placement.spec])
  const width = placement.height * 0.667
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      <mesh position={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[width + 0.5, placement.height + 0.5, 0.3]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[width, placement.height]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent side={FrontSide} />
      </mesh>
      <mesh position={[0, -placement.height / 2 - 0.4, 0.02]}>
        <boxGeometry args={[width + 0.7, 0.08, 0.1]} />
        <primitive object={materials.magenta} attach="material" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.3, -placement.height * 0.35, -0.9]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.16, placement.height * 0.75, 0.16]} />
          <ToonMaterial material={materials.frame} />
        </mesh>
      ))}
    </group>
  )
}

function CityBeacons({ positions }: { positions: Vec3[] }) {
  const mesh = useRef<InstancedMesh>(null)
  const material = useRef<MeshBasicMaterial>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    positions.forEach((position, index) => {
      dummy.position.set(...position)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [positions])

  useFrame((state) => {
    if (!material.current) return
    material.current.opacity = 0.2 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.7 + 1.2)) * 0.7
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(1, positions.length)]}>
      <sphereGeometry args={[0.14, 8, 6]} />
      <meshBasicMaterial
        ref={material}
        color="#ff4d6a"
        transparent
        opacity={0.8}
        toneMapped={false}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function SkyTraffic({ cyan, magenta }: { cyan: string; magenta: string }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const traffic = useMemo(() => {
    const random = mulberry32(0xacce551)
    const colours = [
      new Color(cyan).multiplyScalar(1.3),
      new Color(magenta).multiplyScalar(1.1),
      new Color('#ffd7a8').multiplyScalar(1.25),
    ]
    return Array.from({ length: 9 }, (_, index) => ({
      radius: 34 + random() * 64,
      height: 22 + random() * 46,
      phase: random() * Math.PI * 2,
      speed: 0.035 + random() * 0.075,
      tilt: (random() - 0.5) * 0.35,
      color: colours[index % colours.length],
      scale: 0.9 + random() * 1.4,
    }))
  }, [cyan, magenta])

  useLayoutEffect(() => {
    if (!mesh.current) return
    const color = new Color()
    traffic.forEach((craft, index) => {
      color.setRGB(craft.color.r, craft.color.g, craft.color.b)
      mesh.current?.setColorAt(index, color)
      const angle = craft.phase
      dummy.position.set(
        Math.cos(angle) * craft.radius,
        craft.height,
        Math.sin(angle) * craft.radius * 0.72,
      )
      dummy.rotation.set(0, -angle + Math.PI / 2, craft.tilt)
      dummy.scale.set(0.85 * craft.scale, 0.16 * craft.scale, 0.32 * craft.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [dummy, traffic])

  useFrame((state) => {
    if (!mesh.current) return
    const t = state.clock.elapsedTime
    traffic.forEach((craft, index) => {
      const angle = craft.phase + t * craft.speed
      const x = Math.cos(angle) * craft.radius
      const z = Math.sin(angle) * craft.radius * 0.72
      const y = craft.height + Math.sin(t * 0.45 + craft.phase) * 1.8
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, -angle + Math.PI / 2, craft.tilt)
      dummy.scale.set(0.85 * craft.scale, 0.16 * craft.scale, 0.32 * craft.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, traffic.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  )
}

function CityUnderGlow({ palette }: { palette: AtmospherePalette }) {
  return (
    <group>
      <mesh position={[-116, 0.06, 26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 16]} />
        <meshBasicMaterial
          color={palette.glow}
          transparent
          opacity={0.045}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[104, 0.065, -54]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[90, 12]} />
        <meshBasicMaterial
          color={palette.glow}
          transparent
          opacity={0.035}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function City({ settings, palette }: CityProps) {
  const data = useMemo(
    () => buildCityData(settings.neonCyan, settings.neonMagenta),
    [settings.neonCyan, settings.neonMagenta],
  )
  const materials = useCityMaterials(palette, settings.neonCyan, settings.neonMagenta)
  useDisposeMaterials(materials)
  const neonPower = 0.55 + palette.neonIntensity * 1.4

  return (
    <group name="city">
      <CitySolids data={data} materials={materials} />
      <WindowField windows={data.windows} brightness={0.78 * (0.35 + palette.night * 0.75)} />
      <CityBeacons positions={data.beacons} />
      {data.billboards.map((billboard, index) => (
        <CityBillboard key={index} placement={billboard} materials={materials} />
      ))}
      <SkyTraffic cyan={settings.neonCyan} magenta={settings.neonMagenta} />
      <CityUnderGlow palette={palette} />
      <pointLight
        position={[-44, 4.2, 30]}
        color={settings.neonCyan}
        intensity={28 * neonPower}
        distance={26}
        decay={2}
      />
      <pointLight
        position={[46, 4.8, -18]}
        color={settings.neonMagenta}
        intensity={22 * neonPower}
        distance={24}
        decay={2}
      />
    </group>
  )
}