import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, FogExp2, BackSide } from 'three'
import type { Vector3 } from 'three'
import type { AtmospherePalette } from '../../lib/palette'
import type { SceneSettings } from '../../types'
import { SkyDome } from './SkyDome'

interface AtmosphereProps {
  settings: SceneSettings
  palette: AtmospherePalette
  sunDirection: Vector3
}

export function Atmosphere({ settings, palette, sunDirection }: AtmosphereProps) {
  const { scene } = useThree()
  const fog = useMemo(() => new FogExp2('#050912', settings.fogDensity), [])
  const background = useMemo(() => new Color('#050912'), [])

  useLayoutEffect(() => {
    scene.fog = fog
    scene.background = background
    return () => {
      if (scene.fog === fog) scene.fog = null
      if (scene.background === background) scene.background = null
    }
  }, [scene, fog, background])

  useLayoutEffect(() => {
    fog.color.copy(palette.fog)
    fog.density = settings.fogDensity
    background.copy(palette.fog).multiplyScalar(0.7)
  }, [fog, background, palette, settings.fogDensity])

  return (
    <>
      <SkyDome palette={palette} sunDirection={sunDirection} />
      {/* A barely-visible horizon dome adds extra atmospheric depth. */}
      <mesh position={[0, 5.5, 0]} renderOrder={-1}>
        <sphereGeometry args={[420, 32, 16]} />
        <meshBasicMaterial
          color={palette.fog}
          side={BackSide}
          transparent
          opacity={0.035}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </>
  )
}
