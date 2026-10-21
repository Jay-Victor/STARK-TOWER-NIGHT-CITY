import { useMemo } from 'react'
import { getSunDirection, samplePalette } from '../../lib/palette'
import type { SceneSettings } from '../../types'
import { Atmosphere } from './Atmosphere'
import { CameraRig } from './CameraRig'
import { City } from './City'
import { Effects } from './Effects'
import { EnvironmentRig } from './EnvironmentRig'
import { Ground } from './Ground'
import { Lighting } from './Lighting'
import { Rain } from './Rain'
import { Tower } from './Tower'

interface SceneProps {
  settings: SceneSettings
}

export function Scene({ settings }: SceneProps) {
  const palette = useMemo(() => samplePalette(settings.timeOfDay), [settings.timeOfDay])
  const sunDirection = useMemo(() => getSunDirection(settings.timeOfDay), [settings.timeOfDay])

  return (
    <>
      <Atmosphere settings={settings} palette={palette} sunDirection={sunDirection} />
      <EnvironmentRig settings={settings} palette={palette} />
      <Lighting settings={settings} palette={palette} sunDirection={sunDirection} />
      <Tower settings={settings} palette={palette} />
      <City settings={settings} palette={palette} />
      <Ground settings={settings} palette={palette} />
      {settings.rain && (
        <Rain
          intensity={settings.rainIntensity}
          color={settings.neonCyan}
        />
      )}
      <CameraRig
        autoRotate={settings.autoRotate}
        autoRotateSpeed={settings.autoRotateSpeed}
      />
      <Effects settings={settings} />
    </>
  )
}
