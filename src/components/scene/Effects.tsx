import {
  Bloom,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { SceneSettings } from '../../types'

interface EffectsProps {
  settings: SceneSettings
}

export function Effects({ settings }: EffectsProps) {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false} autoClear>
      <Bloom
        intensity={settings.bloomIntensity}
        luminanceThreshold={settings.bloomThreshold}
        luminanceSmoothing={settings.bloomSmoothing}
        mipmapBlur
        radius={settings.bloomRadius}
        levels={7}
      />
      <Vignette offset={0.28} darkness={0.56} eskil={false} />
      <Noise opacity={0.024} blendFunction={BlendFunction.OVERLAY} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
