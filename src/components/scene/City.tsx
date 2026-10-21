import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DynamicDrawUsage,
  FrontSide,
  Object3D,
  StaticDrawUsage,
} from 'three'
import type { InstancedMesh } from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import { mulberry32 } from '../../lib/random'
import { createBillboardTexture, type BillboardSpec } from '../../lib/textures'
import type { SceneSettings, Vec3 } from '../../types'
import { WindowField } from './InstancedMeshes'
import type { WindowDatum } from './towerData'

interface CityProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

interface Building {
  position: Vec3
  scale: Vec3
  color: [number, number, number]
  height: number
  width: number
  depth: number
}

interface RoofLight {
  position: Vec3
  scale: Vec3
  color: [number, number, number]
}

interface BillboardPlacement {
  position: Vec3
  rotationY: number
  height: number
  spec: BillboardSpec
}

interface CityData {
  buildings: Building[]
  windows: WindowDatum[]
  roofLights: RoofLight[]
  billboards: BillboardPlacement[]
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

function inwardFace(building: Building) {
  // Pick the broad face that points back towards the tower. The camera also
  // orbits that centre, so the city always offers a lit face to the viewer.
  if (building.depth >= building.width) {
    const sign = building.position[2] > 0 ? -1 : 1
    return {
      axis: 'z' as const,
      sign,
      rotationY: sign > 0 ? 0 : Math.PI,
      offsetX: 0,
      offsetZ: sign * (building.depth / 2),
      span: building.width,
    }
  }
  const sign = building.position[0] > 0 ? -1 : 1
  return {
    axis: 'x' as const,
    sign,
    rotationY: sign > 0 ? Math.PI / 2 : -Math.PI / 2,
    offsetX: sign * (building.width / 2),
    offsetZ: 0,
    span: building.depth,
  }
}

function buildCityData(neonCyan: string, neonMagenta: string): CityData {
  const random = mulberry32(0x904c1c1a)
  const buildings: Building[] = []
  const windows: WindowDatum[] = []
  const roofLights: RoofLight[] = []
  const billboards: BillboardPlacement[] = []

  const cyan = new Color(neonCyan)
  const magenta = new Color(neonMagenta)
  const ice = new Color('#dfefff')
  const amber = new Color('#ffc17a')
  const paleBlue = new Color('#7da8d8')

  for (let index = 0; index < 38; index += 1) {
    const angle = (index / 38) * Math.PI * 2 + (random() - 0.5) * 0.11
    const radius = 48 + Math.pow(random(), 0.78) * 94
    const width = 7 + random() * 14
    const depth = 7 + random() * 13
    const height = 12 + Math.pow(random(), 1.62) * 53
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    if (Math.abs(x) < 28 && Math.abs(z) < 28) continue

    const tint = new Color('#0a1320').lerp(new Color('#11121e'), random() * 0.6)
    if (random() > 0.7) tint.lerp(magenta, 0.08).multiplyScalar(0.55)

    const building: Building = {
      position: [x, height / 2, z],
      scale: [width, height, depth],
      color: [tint.r, tint.g, tint.b],
      height,
      width,
      depth,
    }
    buildings.push(building)

    // The upper crown of a tower reads better when lit by a thin roofline.
    const face = inwardFace(building)
    const rimColor = random() > 0.65 ? magenta : random() > 0.35 ? cyan : amber
    const rimPower = 0.8 + random() * 2.2
    const rimWidth = face.axis === 'z' ? width * 0.72 : depth * 0.72
    const rimPosition: Vec3 =
      face.axis === 'z'
        ? [x, height + 0.12, z + face.offsetZ + face.sign * 0.08]
        : [x + face.offsetX + face.sign * 0.08, height + 0.12, z]
    const rimScale: Vec3 = face.axis === 'z' ? [rimWidth, 0.07, 0.06] : [0.06, 0.07, rimWidth]
    roofLights.push({
      position: rimPosition,
      scale: rimScale,
      color: [rimColor.r * rimPower, rimColor.g * rimPower, rimColor.b * rimPower],
    })

    if (random() > 0.66) {
      const beaconColor = new Color('#ff506d').multiplyScalar(2.6)
      roofLights.push({
        position: [x, height + 1.15, z],
        scale: [0.08, 2.3, 0.08],
        color: [beaconColor.r, beaconColor.g, beaconColor.b],
      })
    }

    // Windows on the two inward faces. This keeps distant streets alive while
    // keeping the total pane count low and the whole skyline in one draw call.
    const faceZ = {
      axis: 'z' as const,
      sign: z > 0 ? -1 : (1 as -1 | 1),
      rotationY: z > 0 ? Math.PI : 0,
      offsetX: 0,
      offsetZ: (z > 0 ? -1 : 1) * (depth / 2),
      span: width,
    }
    const faceX = {
      axis: 'x' as const,
      sign: x > 0 ? -1 : (1 as -1 | 1),
      rotationY: x > 0 ? -Math.PI / 2 : Math.PI / 2,
      offsetX: (x > 0 ? -1 : 1) * (width / 2),
      offsetZ: 0,
      span: depth,
    }

    for (const currentFace of [faceZ, faceX]) {
      const span = currentFace.axis === 'z' ? width : depth
      const columns = Math.max(2, Math.min(8, Math.round(span / 1.35)))
      const rows = Math.max(2, Math.min(19, Math.floor((height - 4) / 2.25)))
      const margin = 0.8
      const colStep = (span - margin * 2) / columns
      const rowStep = (height - 3.2) / rows
      const baseOnFaceX = x + currentFace.offsetX
      const baseOnFaceZ = z + currentFace.offsetZ
      const litProbability = 0.2 + random() * 0.22
      const accentRow = Math.floor(random() * rows)

      for (let row = 0; row < rows; row += 1) {
        const y = 1.3 + rowStep * (row + 0.5)
        for (let column = 0; column < columns; column += 1) {
          const along = -span / 2 + margin + colStep * (column + 0.5)
          const lit = random() < litProbability + (row === accentRow ? 0.32 : 0)
          if (!lit) continue

          const family = random()
          const source = family < 0.44 ? paleBlue : family < 0.7 ? ice : family < 0.9 ? amber : magenta
          const power = 0.2 + Math.pow(random(), 2) * 1.2
          const colour = source.clone().multiplyScalar(power)
          const position: Vec3 =
            currentFace.axis === 'z'
              ? [baseOnFaceX + along, y, baseOnFaceZ + currentFace.sign * 0.055]
              : [baseOnFaceX + currentFace.sign * 0.055, y, baseOnFaceZ + along]
          windows.push({
            position,
            rotationY: currentFace.rotationY,
            scale: [colStep * 0.46, rowStep * 0.42],
            color: [colour.r, colour.g, colour.b],
          })
        }
      }
    }
  }

  // Two hero billboards are attached to the two tallest inward-facing towers.
  const candidates = buildings
    .filter((building) => building.height > 30 && building.width > 8 && building.depth > 8)
    .sort((a, b) => b.height - a.height)
  const selected = [candidates[2], candidates[5]].filter(
    (building): building is Building => building !== undefined,
  )
  selected.forEach((building, index) => {
    const face = inwardFace(building)
    const signHeight = Math.min(9.2, building.height * 0.34)
    const y = Math.max(signHeight * 0.5 + 3, building.height * 0.62)
    const position: Vec3 =
      face.axis === 'z'
        ? [building.position[0], y, building.position[2] + face.offsetZ + face.sign * 0.2]
        : [building.position[0] + face.offsetX + face.sign * 0.2, y, building.position[2]]
    billboards.push({
      position,
      rotationY: face.rotationY,
      height: signHeight,
      spec: index === 0 ? BILLBOARD_A : BILLBOARD_B,
    })
  })

  return { buildings, windows, roofLights, billboards }
}

function CityBuildings({ buildings }: { buildings: Building[] }) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    buildings.forEach((building, index) => {
      dummy.position.set(...building.position)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(...building.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      color.setRGB(...building.color)
      mesh.current?.setColorAt(index, color)
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [buildings])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.72}
        roughness={0.46}
        envMapIntensity={0.8}
        dithering
      />
    </instancedMesh>
  )
}

function RoofLights({ lights }: { lights: RoofLight[] }) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    lights.forEach((light, index) => {
      dummy.position.set(...light.position)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(...light.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      color.setRGB(...light.color)
      mesh.current?.setColorAt(index, color)
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [lights])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, lights.length]} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} color="#ffffff" />
    </instancedMesh>
  )
}

function CityBillboard({ placement }: { placement: BillboardPlacement }) {
  const texture = useMemo(() => createBillboardTexture(placement.spec), [placement.spec])
  const width = placement.height * 0.667

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[width + 0.42, placement.height + 0.42, 0.18]} />
        <meshStandardMaterial color="#03070d" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.205]}>
        <planeGeometry args={[width, placement.height]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent side={FrontSide} />
      </mesh>
    </group>
  )
}

function SkyTraffic({ cyan, magenta }: { cyan: string; magenta: string }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const traffic = useMemo(() => {
    const random = mulberry32(0xacce551)
    const palette = [new Color(cyan).multiplyScalar(1.3), new Color(magenta).multiplyScalar(1.1), new Color('#ffd7a8').multiplyScalar(1.25)]
    return Array.from({ length: 9 }, (_, index) => ({
      radius: 34 + random() * 64,
      height: 22 + random() * 46,
      phase: random() * Math.PI * 2,
      speed: 0.035 + random() * 0.075,
      tilt: (random() - 0.5) * 0.35,
      color: palette[index % palette.length],
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

export function City({ settings, palette }: CityProps) {
  const data = useMemo(
    () => buildCityData(settings.neonCyan, settings.neonMagenta),
    [settings.neonCyan, settings.neonMagenta],
  )

  return (
    <group name="city">
      <CityBuildings buildings={data.buildings} />
      <WindowField windows={data.windows} brightness={0.8} />
      <RoofLights lights={data.roofLights} />
      {data.billboards.map((billboard, index) => (
        <CityBillboard key={index} placement={billboard} />
      ))}
      <SkyTraffic cyan={settings.neonCyan} magenta={settings.neonMagenta} />
      <CityUnderGlow palette={palette} />
    </group>
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
