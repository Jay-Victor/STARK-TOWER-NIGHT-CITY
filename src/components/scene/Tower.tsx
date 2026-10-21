import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  FrontSide,
  MeshBasicMaterial,
  Object3D,
  type Group,
  type InstancedMesh,
  type MeshToonMaterial,
} from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import {
  CEL_FRAME_RAMP,
  CEL_GLASS_RAMP,
  CEL_HERO_RAMP,
  CEL_STRUCTURE_RAMP,
  createCelMaterial,
} from '../../lib/cel'
import { createFrustumGeometry, createRoundedSlabGeometry, roundedRectShape } from '../../lib/geometry'
import { createStarkSignTexture } from '../../lib/textures'
import { strutBetween } from './facade'
import type { BoxTransform, SceneSettings, Vec3 } from '../../types'
import { EdgeLines, InstancedBoxes, InstancedChamferBoxes, WindowField } from './InstancedMeshes'
import {
  TOWER_DECK,
  TOWER_ROOF,
  TOWER_SIGN,
  TOWER_WINDOW_COUNT,
  createTowerData,
} from './towerData'

export { TOWER_WINDOW_COUNT }

interface TowerProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

interface TowerMaterials {
  glass: MeshToonMaterial
  structure: MeshToonMaterial
  frame: MeshToonMaterial
  trim: MeshToonMaterial
  metal: MeshToonMaterial
  cyan: MeshBasicMaterial
  magenta: MeshBasicMaterial
  warm: MeshBasicMaterial
  white: MeshBasicMaterial
  reactor: MeshBasicMaterial
}

function useTowerMaterials(
  palette: AtmospherePalette,
  neonCyan: string,
  neonMagenta: string,
): TowerMaterials {
  const neonPower = 0.55 + palette.neonIntensity * 1.4

  return useMemo(() => {
    const cyanGlow = new Color(neonCyan).multiplyScalar(0.55 + neonPower * 0.55)
    const magentaGlow = new Color(neonMagenta).multiplyScalar(0.45 + neonPower * 0.5)
    return {
      glass: createCelMaterial({
        color: '#081b26',
        ramp: CEL_GLASS_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.85,
        rimPower: 2.2,
        skyColor: '#5f9fc4',
        skyStrength: 0.22,
        groundColor: magentaGlow,
        groundStrength: 0.1,
        edgeDarkness: 0.1,
        emissive: '#030d14',
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: FrontSide,
      }),
      structure: createCelMaterial({
        color: '#27323b',
        ramp: CEL_STRUCTURE_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.16,
        rimPower: 3.4,
        skyColor: '#4b86a8',
        skyStrength: 0.18,
        groundColor: magentaGlow,
        groundStrength: 0.08,
        edgeDarkness: 0.4,
        emissive: '#040d15',
        emissiveIntensity: 0.55,
      }),
      frame: createCelMaterial({
        color: '#131f28',
        ramp: CEL_FRAME_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.18,
        rimPower: 3,
        skyColor: '#487b9c',
        skyStrength: 0.16,
        groundColor: magentaGlow,
        groundStrength: 0.07,
        edgeDarkness: 0.36,
        emissive: '#020a10',
        emissiveIntensity: 0.5,
      }),
      trim: createCelMaterial({
        color: '#33404a',
        ramp: CEL_HERO_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.24,
        rimPower: 2.8,
        skyColor: '#6ba2c2',
        skyStrength: 0.2,
        groundColor: magentaGlow,
        groundStrength: 0.07,
        edgeDarkness: 0.3,
        emissive: '#050e16',
        emissiveIntensity: 0.5,
      }),
      metal: createCelMaterial({
        color: '#101820',
        ramp: CEL_STRUCTURE_RAMP,
        rimColor: cyanGlow,
        rimStrength: 0.45,
        rimPower: 2.6,
        skyColor: '#446f8c',
        skyStrength: 0.2,
        groundColor: magentaGlow,
        groundStrength: 0.14,
        edgeDarkness: 0.3,
        emissive: '#02080e',
        emissiveIntensity: 0.5,
      }),
      cyan: new MeshBasicMaterial({
        color: new Color(neonCyan).multiplyScalar(0.9 + neonPower * 0.35),
        toneMapped: false,
      }),
      magenta: new MeshBasicMaterial({
        color: new Color(neonMagenta).multiplyScalar(0.85 + neonPower * 0.3),
        toneMapped: false,
      }),
      warm: new MeshBasicMaterial({
        color: new Color('#ffb878').multiplyScalar(0.75 + neonPower * 0.15),
        toneMapped: false,
      }),
      white: new MeshBasicMaterial({
        color: new Color('#d8ffff').multiplyScalar(1.15),
        toneMapped: false,
      }),
      reactor: new MeshBasicMaterial({
        color: new Color('#00c8ff').multiplyScalar(0.95),
        toneMapped: false,
      }),
    }
  }, [neonCyan, neonMagenta, neonPower])
}

function useDisposeMaterials(materials: TowerMaterials) {
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

function NeonMaterial({ material }: { material: MeshBasicMaterial }) {
  return <primitive object={material} attach="material" />
}

/** Hexagonal Stark seal above the entrance — the base's only piece of branding. */
function PodiumEmblem({ materials }: { materials: TowerMaterials }) {
  return (
    <group position={[0, 11.85, 9.16]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.95, 1.95, 0.24, 6]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <torusGeometry args={[1.5, 0.075, 6, 6]} />
        <NeonMaterial material={materials.cyan} />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[1.02, 0.035, 6, 32]} />
        <NeonMaterial material={materials.magenta} />
      </mesh>
      <mesh position={[0, 0, 0.22]}>
        <circleGeometry args={[0.32, 24]} />
        <NeonMaterial material={materials.white} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh
          key={index}
          position={[0, 0, 0.19]}
          rotation={[0, 0, (index / 6) * Math.PI * 2]}
        >
          <boxGeometry args={[0.045, 1.46, 0.02]} />
          <NeonMaterial material={materials.cyan} />
        </mesh>
      ))}
    </group>
  )
}

function StarkSign({
  texture,
  materials,
}: {
  texture: ReturnType<typeof createStarkSignTexture>
  materials: TowerMaterials
}) {
  return (
    <>
      {[1, -1].map((sign) => (
        <group
          key={sign}
          position={[0, TOWER_SIGN.y, sign * TOWER_SIGN.z]}
          rotation={[0, sign > 0 ? 0 : Math.PI, 0]}
        >
          <mesh position={[0, 0, 0.235]}>
            <planeGeometry args={[TOWER_SIGN.planeWidth, TOWER_SIGN.planeHeight]} />
            <meshBasicMaterial
              map={texture}
              transparent
              toneMapped={false}
              depthWrite={false}
              alphaTest={0.01}
              side={FrontSide}
            />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <planeGeometry args={[TOWER_SIGN.planeWidth + 0.1, TOWER_SIGN.planeHeight + 0.1]} />
            <meshBasicMaterial
              color={materials.magenta.color}
              transparent
              opacity={0.06}
              toneMapped={false}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** The arc reactor is the crown's vertical badge: segmented ring, hot core, rotor. */
function ArcReactor({
  materials,
  palette,
}: {
  materials: TowerMaterials
  palette: AtmospherePalette
}) {
  const rotor = useRef<Group>(null)

  useFrame((state) => {
    if (rotor.current) rotor.current.rotation.z = state.clock.elapsedTime * 0.18
  })

  return (
    <group position={[0, 61.95, 4.42]} scale={0.9}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[3.3, 3.3, 0.32, 64]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 0, 0.16]}>
        <circleGeometry args={[3.2, 64]} />
        <meshBasicMaterial
          color={materials.reactor.color}
          transparent
          opacity={0.1}
          toneMapped={false}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[3.06, 0.25, 8, 64]} />
        <ToonMaterial material={materials.metal} />
      </mesh>

      {/* Copper housings with thin cyan slots: ten coils, not gear teeth. */}
      {Array.from({ length: 10 }, (_, index) => (
        <group key={index} rotation={[0, 0, (index / 10) * Math.PI * 2]}>
          <mesh position={[0, 2.78, 0.24]}>
            <boxGeometry args={[0.46, 0.36, 0.14]} />
            <ToonMaterial material={materials.metal} />
          </mesh>
          <mesh position={[0, 2.78, 0.32]}>
            <boxGeometry args={[0.1, 0.24, 0.06]} />
            <NeonMaterial material={materials.reactor} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0, 0.34]}>
        <torusGeometry args={[2.92, 0.075, 8, 72]} />
        <NeonMaterial material={materials.reactor} />
      </mesh>
      <mesh position={[0, 0, 0.35]}>
        <torusGeometry args={[2.24, 0.1, 8, 72]} />
        <NeonMaterial material={materials.reactor} />
      </mesh>
      <mesh position={[0, 0, 0.36]}>
        <torusGeometry args={[1.56, 0.06, 6, 64]} />
        <NeonMaterial material={materials.magenta} />
      </mesh>

      {Array.from({ length: 10 }, (_, index) => (
        <group key={index} rotation={[0, 0, (index / 10) * Math.PI * 2]}>
          <mesh position={[0, 1.66, 0.35]}>
            <boxGeometry args={[0.075, 1.14, 0.05]} />
            <NeonMaterial material={materials.reactor} />
          </mesh>
        </group>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.38]}>
        <cylinderGeometry args={[0.86, 0.86, 0.2, 40]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <torusGeometry args={[0.6, 0.065, 6, 40]} />
        <NeonMaterial material={materials.reactor} />
      </mesh>
      <mesh position={[0, 0, 0.52]}>
        <circleGeometry args={[0.18, 28]} />
        <NeonMaterial material={materials.white} />
      </mesh>
      <group ref={rotor} position={[0, 0, 0.46]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[0, 0, (index / 3) * Math.PI * 2]}>
            <torusGeometry args={[1.26, 0.055, 6, 28, Math.PI * 0.46]} />
            <NeonMaterial material={materials.reactor} />
          </mesh>
        ))}
      </group>
      <pointLight
        position={[0, 0, 1.5]}
        color={materials.reactor.color}
        intensity={46 * (0.5 + palette.neonIntensity)}
        distance={16}
        decay={2}
      />
    </group>
  )
}

function CrownRoof({ materials }: { materials: TowerMaterials }) {
  const roof = useMemo(
    () => ({
      outer: createFrustumGeometry(
        TOWER_ROOF.width,
        TOWER_ROOF.depth,
        TOWER_ROOF.topWidth,
        TOWER_ROOF.topDepth,
        TOWER_ROOF.height,
      ),
      inner: createFrustumGeometry(
        TOWER_ROOF.width - 1.1,
        TOWER_ROOF.depth - 1.0,
        TOWER_ROOF.topWidth - 0.7,
        TOWER_ROOF.topDepth - 0.6,
        TOWER_ROOF.height - 0.45,
      ),
    }),
    [],
  )

  const ribs = useMemo(() => {
    const halfW = TOWER_ROOF.width / 2
    const halfD = TOWER_ROOF.depth / 2
    const topHalfW = TOWER_ROOF.topWidth / 2
    const topHalfD = TOWER_ROOF.topDepth / 2
    const list: BoxTransform[] = []
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        list.push(
          strutBetween(
            [sx * halfW, 0.05, sz * halfD],
            [sx * topHalfW, TOWER_ROOF.height, sz * topHalfD],
            0.16,
          ),
        )
      }
    }
    for (const sx of [-1, 1]) {
      list.push(
        strutBetween(
          [sx * halfW * 0.48, 0.05, halfD],
          [sx * topHalfW * 0.48, TOWER_ROOF.height, topHalfD],
          0.1,
        ),
      )
      list.push(
        strutBetween(
          [sx * halfW * 0.48, 0.05, -halfD],
          [sx * topHalfW * 0.48, TOWER_ROOF.height, -topHalfD],
          0.1,
        ),
      )
    }
    for (const sz of [-1, 1]) {
      list.push(
        strutBetween(
          [halfW, 0.05, sz * halfD * 0.48],
          [topHalfW, TOWER_ROOF.height, sz * topHalfD * 0.48],
          0.1,
        ),
      )
      list.push(
        strutBetween(
          [-halfW, 0.05, sz * halfD * 0.48],
          [-topHalfW, TOWER_ROOF.height, sz * topHalfD * 0.48],
          0.1,
        ),
      )
    }
    return list
  }, [])

  useEffect(
    () => () => {
      roof.outer.sides.dispose()
      roof.outer.cap.dispose()
      roof.inner.sides.dispose()
      roof.inner.cap.dispose()
    },
    [roof],
  )

  const eaveNeon = useMemo<BoxTransform[]>(
    () => [
      { position: [0, 0.14, TOWER_ROOF.depth / 2 + 0.03], scale: [TOWER_ROOF.width + 0.2, 0.06, 0.06] },
      { position: [0, 0.14, -TOWER_ROOF.depth / 2 - 0.03], scale: [TOWER_ROOF.width + 0.2, 0.06, 0.06] },
      { position: [TOWER_ROOF.width / 2 + 0.03, 0.14, 0], scale: [0.06, 0.06, TOWER_ROOF.depth + 0.2] },
      { position: [-TOWER_ROOF.width / 2 - 0.03, 0.14, 0], scale: [0.06, 0.06, TOWER_ROOF.depth + 0.2] },
    ],
    [],
  )

  const capNeon = useMemo<BoxTransform[]>(
    () => [
      { position: [0, TOWER_ROOF.height + 0.16, TOWER_ROOF.topDepth / 2 + 0.03], scale: [TOWER_ROOF.topWidth + 0.15, 0.06, 0.06] },
      { position: [0, TOWER_ROOF.height + 0.16, -TOWER_ROOF.topDepth / 2 - 0.03], scale: [TOWER_ROOF.topWidth + 0.15, 0.06, 0.06] },
      { position: [TOWER_ROOF.topWidth / 2 + 0.03, TOWER_ROOF.height + 0.16, 0], scale: [0.06, 0.06, TOWER_ROOF.topDepth + 0.15] },
      { position: [-TOWER_ROOF.topWidth / 2 - 0.03, TOWER_ROOF.height + 0.16, 0], scale: [0.06, 0.06, TOWER_ROOF.topDepth + 0.15] },
    ],
    [],
  )

  return (
    <group position={[0, TOWER_ROOF.y, 0]}>
      <mesh geometry={roof.inner.sides} position={[0, 0.06, 0]}>
        <ToonMaterial material={materials.frame} />
      </mesh>
      <mesh geometry={roof.inner.cap} position={[0, 0.06, 0]}>
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh geometry={roof.outer.sides} castShadow>
        <primitive object={materials.glass} attach="material" />
      </mesh>
      <InstancedBoxes items={ribs} castShadow>
        <ToonMaterial material={materials.frame} />
      </InstancedBoxes>
      <mesh position={[0, TOWER_ROOF.height - 0.1, 0]} castShadow>
        <boxGeometry args={[TOWER_ROOF.topWidth + 0.6, 0.32, TOWER_ROOF.topDepth + 0.5]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[TOWER_ROOF.width + 0.5, 0.3, TOWER_ROOF.depth + 0.5]} />
        <ToonMaterial material={materials.trim} />
      </mesh>
      <InstancedBoxes items={eaveNeon}>
        <NeonMaterial material={materials.magenta} />
      </InstancedBoxes>
      <InstancedBoxes items={capNeon}>
        <NeonMaterial material={materials.cyan} />
      </InstancedBoxes>
    </group>
  )
}

function Antenna({ materials }: { materials: TowerMaterials }) {
  const ring = useRef<Group>(null)

  useFrame((state) => {
    if (ring.current) ring.current.rotation.y = state.clock.elapsedTime * 0.22
  })

  return (
    <group position={[0, TOWER_ROOF.y + TOWER_ROOF.height, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.8, 1.3, 8]} />
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh position={[0, 7.2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.28, 11.6, 8]} />
        <ToonMaterial material={materials.frame} />
      </mesh>
      <mesh position={[0, 16.2, 0]}>
        <cylinderGeometry args={[0.018, 0.09, 6.4, 6]} />
        <NeonMaterial material={materials.cyan} />
      </mesh>
      <mesh position={[0, 19.5, 0]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <NeonMaterial material={materials.white} />
      </mesh>

      {[4.6, 8.2, 11.6].map((y, index) => (
        <group key={y} position={[0, y, 0]} rotation={[0, index * 0.62, 0]}>
          <mesh>
            <boxGeometry args={[3.2 - index * 0.35, 0.11, 0.12]} />
            <ToonMaterial material={materials.frame} />
          </mesh>
          <mesh position={[1.5 - index * 0.16, 0, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <NeonMaterial material={materials.magenta} />
          </mesh>
        </group>
      ))}

      <group ref={ring} position={[0, 6.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.55, 0.05, 6, 48]} />
          <NeonMaterial material={materials.cyan} />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} rotation={[0, (index / 4) * Math.PI * 2, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[3.1, 0.05, 0.05]} />
            <ToonMaterial material={materials.frame} />
          </mesh>
        ))}
      </group>

      {[3.2, 9.6].map((y, index) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, index * 0.4]}>
          <torusGeometry args={[0.42, 0.08, 6, 20]} />
          <NeonMaterial material={index === 0 ? materials.magenta : materials.cyan} />
        </mesh>
      ))}
      <pointLight
        position={[0, 19.5, 0]}
        color={materials.cyan.color}
        intensity={18}
        distance={22}
        decay={2}
      />
    </group>
  )
}

/** Rounded cantilever pod, with a real curved curtain wall and underglow. */
function ObservationDeck({ materials }: { materials: TowerMaterials }) {
  const deck = useMemo(() => {
    const { width, depth, radius, height } = TOWER_DECK
    const geometry = {
      glass: createRoundedSlabGeometry(width, depth, radius, height, 0.06),
      base: createRoundedSlabGeometry(width + 0.28, depth + 0.28, radius + 0.1, 0.5, 0.05),
      roof: createRoundedSlabGeometry(width + 0.32, depth + 0.32, radius + 0.12, 0.34, 0.04),
    }

    const shape = roundedRectShape(width, depth, radius)
    const points = shape.getPoints(64).map((point) => ({ x: point.x, z: -point.y }))
    const mullions: BoxTransform[] = []
    const lowerGlow: BoxTransform[] = []
    const upperGlow: BoxTransform[] = []
    const crownRim: BoxTransform[] = []

    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const next = points[index + 1]
      const dx = next.x - current.x
      const dz = next.z - current.z
      const length = Math.hypot(dx, dz)
      if (length < 0.01) continue
      const rotation: Vec3 = [0, Math.atan2(dx, dz), 0]
      const midX = (current.x + next.x) / 2
      const midZ = (current.z + next.z) / 2
      if (index % 3 === 0) {
        mullions.push({
          position: [midX, 0, midZ],
          scale: [0.07, height - 0.18, 0.13],
          rotation,
        })
      }
      if (index % 2 === 0) {
        lowerGlow.push({
          position: [midX, -height / 2 - 0.46, midZ],
          scale: [0.06, 0.06, length * 0.94],
          rotation,
        })
        upperGlow.push({
          position: [midX, height / 2 + 0.39, midZ],
          scale: [0.05, 0.05, length * 0.94],
          rotation,
        })
        crownRim.push({
          position: [midX, height / 2 + 0.25, midZ],
          scale: [0.12, 0.2, length * 0.94],
          rotation,
        })
      }
    }

    return { geometry, mullions, lowerGlow, upperGlow, crownRim }
  }, [])

  useEffect(
    () => () => {
      deck.geometry.glass.dispose()
      deck.geometry.base.dispose()
      deck.geometry.roof.dispose()
    },
    [deck],
  )

  return (
    <group position={[TOWER_DECK.x, TOWER_DECK.y, TOWER_DECK.z]}>
      <mesh geometry={deck.geometry.base} position={[0, -TOWER_DECK.height / 2 - 0.2, 0]} castShadow receiveShadow>
        <ToonMaterial material={materials.metal} />
      </mesh>
      <mesh geometry={deck.geometry.glass} castShadow>
        <primitive object={materials.glass} attach="material" />
      </mesh>
      <mesh geometry={deck.geometry.roof} position={[0, TOWER_DECK.height / 2 + 0.18, 0]} castShadow>
        <primitive object={materials.glass} attach="material" />
      </mesh>
      <InstancedBoxes items={deck.mullions}>
        <ToonMaterial material={materials.frame} />
      </InstancedBoxes>
      <InstancedBoxes items={deck.lowerGlow}>
        <NeonMaterial material={materials.magenta} />
      </InstancedBoxes>
      <InstancedBoxes items={deck.upperGlow}>
        <NeonMaterial material={materials.magenta} />
      </InstancedBoxes>
      <InstancedBoxes items={deck.crownRim}>
        <ToonMaterial material={materials.frame} />
      </InstancedBoxes>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[TOWER_DECK.width - 1.4, 0.1, TOWER_DECK.depth - 1.4]} />
        <NeonMaterial material={materials.warm} />
      </mesh>
      <pointLight
        position={[0, -1.1, 0]}
        color={materials.magenta.color}
        intensity={26}
        distance={17}
        decay={2}
      />
    </group>
  )
}

function Beacons({ positions }: { positions: Vec3[] }) {
  const mesh = useRef<InstancedMesh>(null)
  const material = useRef<MeshBasicMaterial>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    positions.forEach((position, index) => {
      dummy.position.set(...position)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [positions])

  useFrame((state) => {
    if (!material.current) return
    const pulse = Math.max(0, Math.sin(state.clock.elapsedTime * 1.9))
    material.current.opacity = 0.25 + pulse * 0.7
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(1, positions.length)]}>
      <sphereGeometry args={[0.16, 8, 6]} />
      <meshBasicMaterial
        ref={material}
        color="#ff4d6a"
        transparent
        opacity={0.9}
        toneMapped={false}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export function Tower({ settings, palette }: TowerProps) {
  const materials = useTowerMaterials(palette, settings.neonCyan, settings.neonMagenta)
  useDisposeMaterials(materials)
  const neonPower = 0.55 + palette.neonIntensity * 1.4

  const data = useMemo(
    () => createTowerData(settings.neonCyan, settings.neonMagenta),
    [settings.neonCyan, settings.neonMagenta],
  )

  const signTexture = useMemo(
    () => createStarkSignTexture(settings.neonCyan, settings.neonMagenta),
    [settings.neonCyan, settings.neonMagenta],
  )
  useEffect(() => () => signTexture.dispose(), [signTexture])

  const beacons = useMemo(
    () => [...data.beacons, [0, TOWER_ROOF.y + 19.5, 0] as Vec3],
    [data.beacons],
  )

  return (
    <group name="stark-tower">
      {/* Glazing, structure, mullions, cornices and hardware. */}
      <InstancedChamferBoxes items={data.glassVolumes}>
        <primitive object={materials.glass} attach="material" />
      </InstancedChamferBoxes>
      <InstancedChamferBoxes items={data.structure} castShadow receiveShadow>
        <ToonMaterial material={materials.structure} />
      </InstancedChamferBoxes>
      <InstancedBoxes items={data.frames} castShadow>
        <ToonMaterial material={materials.frame} />
      </InstancedBoxes>
      <InstancedBoxes items={data.trim} castShadow receiveShadow>
        <ToonMaterial material={materials.trim} />
      </InstancedBoxes>
      <InstancedBoxes items={data.greebles} castShadow>
        <ToonMaterial material={materials.metal} />
      </InstancedBoxes>

      <EdgeLines items={data.inkEdges} color="#030b12" opacity={0.8} />

      <WindowField
        windows={data.windows}
        brightness={(0.82 + palette.neonIntensity * 0.12) * (0.4 + palette.night * 0.7)}
      />

      <InstancedBoxes items={data.neonCyan}>
        <NeonMaterial material={materials.cyan} />
      </InstancedBoxes>
      <InstancedBoxes items={data.neonMagenta}>
        <NeonMaterial material={materials.magenta} />
      </InstancedBoxes>
      <InstancedBoxes items={data.neonWarm}>
        <NeonMaterial material={materials.warm} />
      </InstancedBoxes>

      <CrownRoof materials={materials} />
      <ArcReactor materials={materials} palette={palette} />
      <Antenna materials={materials} />
      <ObservationDeck materials={materials} />
      <PodiumEmblem materials={materials} />
      <StarkSign texture={signTexture} materials={materials} />
      <Beacons positions={beacons} />

      {/* Local light spill: entrance, crown, deck and mast. */}
      <pointLight
        position={[0, 4.2, 17]}
        color="#ffb875"
        intensity={60 * neonPower}
        distance={32}
        decay={2}
      />
      <pointLight
        position={[0, 62.5, 8]}
        color={settings.neonCyan}
        intensity={85 * neonPower}
        distance={30}
        decay={2}
      />
      <pointLight
        position={[TOWER_DECK.x, 48.4, TOWER_DECK.z]}
        color={settings.neonMagenta}
        intensity={80 * neonPower}
        distance={22}
        decay={2}
      />
      <pointLight
        position={[0, TOWER_ROOF.y + 18.5, 0]}
        color={settings.neonCyan}
        intensity={25 * neonPower}
        distance={24}
        decay={2}
      />
    </group>
  )
}