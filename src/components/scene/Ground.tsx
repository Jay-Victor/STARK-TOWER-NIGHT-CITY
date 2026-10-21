import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { Color, DoubleSide, Object3D, Quaternion, StaticDrawUsage, Vector3 } from 'three'
import type { InstancedMesh } from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import { createAsphaltTextures, disposeTextureSet } from '../../lib/textures'
import { mulberry32 } from '../../lib/random'
import type { BoxTransform, SceneSettings } from '../../types'
import { InstancedBoxes } from './InstancedMeshes'

interface GroundProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

export function Ground({ settings, palette }: GroundProps) {
  const textures = useMemo(() => createAsphaltTextures(512), [])
  const puddleMesh = useRef<InstancedMesh>(null)
  const neonPower = 0.55 + palette.neonIntensity * 1.2
  const guideColor = useMemo(
    () => palette.glow.clone().lerp(new Color(settings.neonCyan), 0.45),
    [palette.glow, settings.neonCyan],
  )

  useEffect(() => () => disposeTextureSet(textures), [textures])

  const puddles = useMemo(() => {
    const random = mulberry32(0x9a12b3c4)
    const patches: { position: [number, number, number]; scale: [number, number]; rotation: number }[] = []
    for (let i = 0; i < 16; i += 1) {
      const angle = random() * Math.PI * 2
      const radius = 26 + Math.pow(random(), 0.72) * 95
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const width = 1.8 + random() * 8
      const depth = 0.75 + random() * 3.4
      patches.push({ position: [x, 0.018, z], scale: [width, depth], rotation: random() * Math.PI })
      if (random() > 0.5) {
        patches.push({
          position: [x + (random() - 0.5) * 5, 0.017, z + (random() - 0.5) * 4],
          scale: [width * 0.55, depth * 0.7],
          rotation: random() * Math.PI,
        })
      }
    }
    return patches
  }, [])

  useLayoutEffect(() => {
    if (!puddleMesh.current) return
    const dummy = new Object3D()
    const flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
    const spin = new Quaternion()
    puddles.forEach((puddle, index) => {
      dummy.position.set(...puddle.position)
      dummy.quaternion
        .copy(spin.setFromAxisAngle(new Vector3(0, 1, 0), puddle.rotation))
        .multiply(flat)
      dummy.scale.set(puddle.scale[0], puddle.scale[1], 1)
      dummy.updateMatrix()
      puddleMesh.current?.setMatrixAt(index, dummy.matrix)
    })
    puddleMesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    puddleMesh.current.instanceMatrix.needsUpdate = true
    puddleMesh.current.computeBoundingSphere()
  }, [puddles])

  const guideLights = useMemo(() => {
    const boxes: BoxTransform[] = []
    const tickCount = 32
    const tickRadius = 31.8
    for (let i = 0; i < tickCount; i += 1) {
      const angle = (i / tickCount) * Math.PI * 2
      const long = i % 4 === 0 ? 1.5 : 0.65
      boxes.push({
        position: [Math.cos(angle) * tickRadius, 0.016, Math.sin(angle) * tickRadius],
        scale: [0.055, 0.018, long],
        rotation: [0, Math.PI / 2 - angle, 0],
      })
    }

    // Entry approach light dashes.
    for (const x of [-4.4, 4.4]) {
      for (let i = 0; i < 8; i += 1) {
        boxes.push({
          position: [x, 0.016, 26 + i * 3.4],
          scale: [0.07, 0.02, i % 2 === 0 ? 1.25 : 0.48],
        })
      }
    }

    // Long wet runway edges, reflected by the ground.
    boxes.push(
      { position: [-4.4, 0.014, 38], scale: [0.03, 0.018, 28] },
      { position: [4.4, 0.014, 38], scale: [0.03, 0.018, 28] },
    )

    return boxes
  }, [])

  return (
    <group name="wet-ground">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[520, 520, 1, 1]} />
        <MeshReflectorMaterial
          resolution={1024}
          blur={[240, 72]}
          mixBlur={0.9}
          mixStrength={0.8 + settings.wetness * 4.8}
          mirror={0.2 + settings.wetness * 0.67}
          depthScale={1.12}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.55}
          distortion={0.18 + settings.wetness * 0.34}
          distortionMap={textures.roughnessMap}
          roughness={0.48 - settings.wetness * 0.34}
          metalness={0.82}
          color="#070b11"
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.08}
          roughnessMap={textures.roughnessMap}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* Environment-visible puddles sit just above the planar reflector. */}
      <instancedMesh
        ref={puddleMesh}
        args={[undefined, undefined, puddles.length]}
        renderOrder={1}
      >
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color="#02070d"
          roughness={0.035}
          metalness={1}
          envMapIntensity={2.6}
          transparent
          opacity={0.12 + settings.wetness * 0.28}
          depthWrite={false}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </instancedMesh>

      <group rotation={[0, -0.38, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <torusGeometry args={[29.2, 0.045, 8, 220, Math.PI * 1.3]} />
          <meshStandardMaterial
            color={settings.neonCyan}
            emissive={settings.neonCyan}
            emissiveIntensity={3.1 * neonPower}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[34.6, 0.028, 8, 220, Math.PI * 0.78]} />
          <meshStandardMaterial
            color={settings.neonMagenta}
            emissive={settings.neonMagenta}
            emissiveIntensity={2.4 * neonPower}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      <InstancedBoxes items={guideLights}>
        <meshBasicMaterial
          color={guideColor}
          toneMapped={false}
          transparent
          opacity={0.55}
        />
      </InstancedBoxes>
    </group>
  )
}
