import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { FrontSide, Group, Mesh, MeshBasicMaterial } from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import { createStarkSignTexture } from '../../lib/textures'
import type { SceneSettings } from '../../types'
import { InstancedBoxes, WindowField } from './InstancedMeshes'
import { createTowerData } from './towerData'

interface TowerProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

const SIGN_Y = 50.4
const SIGN_Z = 4.33

function StarkSign({ cyan, magenta }: { cyan: string; magenta: string }) {
  const texture = useMemo(() => createStarkSignTexture(cyan, magenta), [cyan, magenta])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={[1.4, SIGN_Y, SIGN_Z]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.14]} castShadow={false}>
        <boxGeometry args={[8.75, 2.28, 0.16]} />
        <meshStandardMaterial color="#02050a" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, -0.025]}>
        <planeGeometry args={[8.5, 2.12]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          depthWrite={false}
          alphaTest={0.01}
          side={FrontSide}
        />
      </mesh>
      <mesh position={[0, -1.22, -0.06]}>
        <boxGeometry args={[7.3, 0.035, 0.04]} />
        <meshBasicMaterial color={magenta} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Antenna({ cyan, magenta, neonPower }: { cyan: string; magenta: string; neonPower: number }) {
  const beacon = useRef<Mesh>(null)
  const beaconMaterial = useRef<MeshBasicMaterial>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (beacon.current) {
      const pulse = 0.8 + Math.sin(t * 2.4) * 0.22
      beacon.current.scale.setScalar(pulse)
    }
    if (beaconMaterial.current) {
      beaconMaterial.current.opacity = 0.72 + Math.sin(t * 3.1) * 0.2
    }
  })

  return (
    <group position={[0, 70.1, 0]}>
      {/* Tapered comms mast */}
      <mesh position={[0, 7.4, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.34, 14.8, 8]} />
        <meshStandardMaterial color="#0b1620" metalness={0.98} roughness={0.2} envMapIntensity={1.8} />
      </mesh>
      <mesh position={[0, 15.6, 0]}>
        <cylinderGeometry args={[0.018, 0.07, 2.8, 6]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.8 * neonPower} toneMapped={false} />
      </mesh>

      {/* Sensor platforms */}
      {[4.4, 9.7, 13.2].map((y, index) => (
        <group key={y} position={[0, y, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6 + index * 0.16, 0.055, 6, 36]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? cyan : magenta}
              emissive={index % 2 === 0 ? cyan : magenta}
              emissiveIntensity={3.2 * neonPower}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[0, index * 0.5, 0]}>
            <boxGeometry args={[2.5 + index * 0.8, 0.06, 0.06]} />
            <meshStandardMaterial color="#162a37" metalness={0.92} roughness={0.26} />
          </mesh>
        </group>
      ))}

      <mesh ref={beacon} position={[0, 17.2, 0]}>
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshBasicMaterial
          ref={beaconMaterial}
          color={cyan}
          transparent
          opacity={0.9}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 17.2, 0]} color={cyan} intensity={40} distance={28} decay={2} />
    </group>
  )
}

function OrbitalHalos({ cyan, magenta, neonPower }: { cyan: string; magenta: string; neonPower: number }) {
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (outer.current) {
      outer.current.rotation.y = t * 0.11
      outer.current.rotation.z = Math.sin(t * 0.1) * 0.05
    }
    if (inner.current) {
      inner.current.rotation.y = -t * 0.18
      inner.current.rotation.x = 1.08 + Math.sin(t * 0.07) * 0.06
    }
  })

  const satellitePositions = [0, 1, 2, 3].map((index) => {
    const angle = (index / 4) * Math.PI * 2
    return [Math.cos(angle) * 9.9, 0, Math.sin(angle) * 9.9] as [number, number, number]
  })

  return (
    <group position={[0, 61.35, 0]}>
      <group ref={outer}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.9, 0.045, 6, 192]} />
          <meshStandardMaterial
            color={cyan}
            emissive={cyan}
            emissiveIntensity={3.6 * neonPower}
            metalness={0.4}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
        {satellitePositions.map((position, index) => (
          <mesh key={index} position={position}>
            <boxGeometry args={[index % 2 === 0 ? 0.5 : 0.28, 0.12, 0.18]} />
            <meshBasicMaterial color={index % 2 === 0 ? magenta : cyan} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group ref={inner}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[12.2, 0.035, 6, 192]} />
          <meshStandardMaterial
            color={magenta}
            emissive={magenta}
            emissiveIntensity={2.7 * neonPower}
            metalness={0.4}
            roughness={0.25}
            toneMapped={false}
            transparent
            opacity={0.72}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 3, 0]} position={[11.1, 0, 5.6]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshBasicMaterial color={magenta} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function ArcReactorBadge({ cyan, magenta, neonPower }: { cyan: string; magenta: string; neonPower: number }) {
  return (
    <group position={[0, 59.35, 3.63]}>
      <mesh>
        <circleGeometry args={[1.9, 48]} />
        <meshStandardMaterial color="#030910" metalness={0.96} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[1.46, 0.055, 8, 64]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={5.5 * neonPower} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[1.02, 0.028, 8, 48]} />
        <meshStandardMaterial color={magenta} emissive={magenta} emissiveIntensity={4.2 * neonPower} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial color="#b8feff" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[0, 0, (index / 3) * Math.PI]}>
          <boxGeometry args={[0.05, 1.18, 0.02]} />
          <meshBasicMaterial color={cyan} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

export function Tower({ settings, palette }: TowerProps) {
  const neonPower = 0.55 + palette.neonIntensity * 1.4

  const data = useMemo(() => {
    const next = createTowerData(settings.neonCyan, settings.neonMagenta)
    // A tight border around the canvas-texture sign.
    const frameZ = SIGN_Z + 0.01
    const x = 1.4
    const y = SIGN_Y
    next.neonCyan.push(
      { position: [x - 4.34, y, frameZ], scale: [0.035, 2.22, 0.025] },
      { position: [x + 4.34, y, frameZ], scale: [0.035, 2.22, 0.025] },
      { position: [x, y - 1.12, frameZ], scale: [8.7, 0.03, 0.025] },
      { position: [x, y + 1.12, frameZ], scale: [8.7, 0.03, 0.025] },
    )
    return next
  }, [settings.neonCyan, settings.neonMagenta])

  const neonCyan = settings.neonCyan
  const neonMagenta = settings.neonMagenta

  return (
    <group name="stark-tower">
      {/* Curtain-wall volumes: a single transparent PBR instanced draw. */}
      <InstancedBoxes items={data.glassVolumes} receiveShadow>
        <meshStandardMaterial
          color="#061722"
          metalness={0.98}
          roughness={0.065}
          envMapIntensity={2.9}
          transparent
          opacity={0.58}
          depthWrite={false}
          side={FrontSide}
        />
      </InstancedBoxes>

      {/* Inner cores, collars, corner columns, fins and mechanical architecture. */}
      <InstancedBoxes items={data.structure} castShadow receiveShadow>
        <meshStandardMaterial
          color="#0a1118"
          metalness={0.9}
          roughness={0.31}
          envMapIntensity={1.35}
        />
      </InstancedBoxes>

      {/* Floor rails and mullions. One draw call for the entire facade grid. */}
      <InstancedBoxes items={data.mullions} castShadow>
        <meshStandardMaterial
          color="#111f2a"
          metalness={0.95}
          roughness={0.22}
          envMapIntensity={1.65}
        />
      </InstancedBoxes>

      {/* Diagonal exoskeleton. */}
      <InstancedBoxes items={data.braces} castShadow receiveShadow>
        <meshStandardMaterial
          color="#0d1922"
          metalness={0.88}
          roughness={0.27}
          envMapIntensity={1.55}
        />
      </InstancedBoxes>

      {/* Service pods and vents. */}
      <InstancedBoxes items={data.greebles} castShadow>
        <meshStandardMaterial
          color="#111b24"
          metalness={0.82}
          roughness={0.38}
          envMapIntensity={1.2}
        />
      </InstancedBoxes>

      {/* Facade apertures: every window is in this one InstancedMesh. */}
      <WindowField windows={data.windows} brightness={0.9 + palette.neonIntensity * 0.22} />

      {/* Emissive strips and rails are two instanced draws, pulse driven by the clock. */}
      <InstancedBoxes items={data.neonCyan}>
        <meshStandardMaterial
          color={neonCyan}
          emissive={neonCyan}
          emissiveIntensity={5 * neonPower}
          metalness={0.25}
          roughness={0.24}
          toneMapped={false}
        />
      </InstancedBoxes>
      <InstancedBoxes items={data.neonMagenta}>
        <meshStandardMaterial
          color={neonMagenta}
          emissive={neonMagenta}
          emissiveIntensity={4.2 * neonPower}
          metalness={0.25}
          roughness={0.24}
          toneMapped={false}
        />
      </InstancedBoxes>

      {/* Unique hero pieces are meshes, not generated clutter. */}
      <StarkSign cyan={neonCyan} magenta={neonMagenta} />
      <ArcReactorBadge cyan={neonCyan} magenta={neonMagenta} neonPower={neonPower} />
      <OrbitalHalos cyan={neonCyan} magenta={neonMagenta} neonPower={neonPower} />
      <Antenna cyan={neonCyan} magenta={neonMagenta} neonPower={neonPower} />

      {/* Entry beacon wash and a subtle deck uplight. */}
      <pointLight position={[0, 12, 16]} color={neonMagenta} intensity={110 * neonPower} distance={36} decay={2} />
      <pointLight position={[7, 44, 8]} color={neonCyan} intensity={90 * neonPower} distance={34} decay={2} />
    </group>
  )
}
