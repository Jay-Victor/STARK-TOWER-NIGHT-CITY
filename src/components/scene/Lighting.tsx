import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight, PointLight } from 'three'
import type { Vector3 } from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import type { SceneSettings } from '../../types'

interface LightingProps {
  settings: SceneSettings
  palette: AtmospherePalette
  sunDirection: Vector3
}

export function Lighting({ settings, palette, sunDirection }: LightingProps) {
  const cyanLight = useRef<PointLight>(null)
  const magentaLight = useRef<PointLight>(null)
  const warmLight = useRef<PointLight>(null)
  const crownLight = useRef<PointLight>(null)
  const sunLight = useRef<DirectionalLight>(null)

  const sunPosition = useMemo(
    () => sunDirection.clone().multiplyScalar(150).setY(Math.max(8, sunDirection.y * 150)),
    [sunDirection],
  )
  const neonPower = 0.45 + palette.neonIntensity * 1.5
  const master = settings.masterLight

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const flickerA = 0.97 + Math.sin(t * 1.9) * 0.025 + Math.sin(t * 7.1) * 0.012
    const flickerB = 0.94 + Math.sin(t * 1.3 + 2.1) * 0.035 + Math.sin(t * 5.7) * 0.018
    if (cyanLight.current) cyanLight.current.intensity = 760 * neonPower * master * flickerA
    if (magentaLight.current) magentaLight.current.intensity = 540 * neonPower * master * flickerB
    if (warmLight.current) warmLight.current.intensity = 260 * neonPower * master * (0.9 + Math.sin(t * 0.7) * 0.06)
    if (crownLight.current) crownLight.current.intensity = 380 * neonPower * master * flickerA
    if (sunLight.current) sunLight.current.intensity = palette.keyIntensity * master
  })

  return (
    <group name="lighting">
      <ambientLight color={palette.ambient} intensity={palette.ambientIntensity * master} />
      <hemisphereLight
        color={palette.hemiSky}
        groundColor={palette.hemiGround}
        intensity={palette.hemiIntensity * master}
      />
      <directionalLight
        ref={sunLight}
        color={palette.key}
        intensity={palette.keyIntensity * master}
        position={sunPosition}
        castShadow={palette.keyIntensity > 0.04}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={420}
        shadow-camera-left={-105}
        shadow-camera-right={105}
        shadow-camera-top={120}
        shadow-camera-bottom={-55}
        shadow-bias={-0.00008}
        shadow-normalBias={0.035}
      />
      <directionalLight
        color="#7f9cff"
        intensity={palette.night * 0.55 * master}
        position={[70, 90, -80]}
      />
      <directionalLight
        color={settings.neonCyan}
        intensity={0.3 * neonPower * master}
        position={[-60, 20, -50]}
      />

      <pointLight
        ref={warmLight}
        color="#ffb16e"
        position={[0, 1.4, 25]}
        intensity={260 * neonPower * master}
        distance={68}
        decay={2}
      />
      <pointLight
        ref={cyanLight}
        color={settings.neonCyan}
        position={[-19, 10, 16]}
        intensity={760 * neonPower * master}
        distance={92}
        decay={2}
      />
      <pointLight
        ref={magentaLight}
        color={settings.neonMagenta}
        position={[18, 12, -17]}
        intensity={540 * neonPower * master}
        distance={82}
        decay={2}
      />
      <pointLight
        ref={crownLight}
        color={settings.neonCyan}
        position={[6, 58, -8]}
        intensity={380 * neonPower * master}
        distance={58}
        decay={2}
      />
      <pointLight
        color={settings.neonMagenta}
        position={[-9, 42, 9]}
        intensity={260 * neonPower * master}
        distance={45}
        decay={2}
      />
    </group>
  )
}
