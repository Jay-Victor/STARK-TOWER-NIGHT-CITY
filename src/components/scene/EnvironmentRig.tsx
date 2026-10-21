import { Environment, Lightformer } from '@react-three/drei'
import type { AtmospherePalette } from '../../lib/palette'
import type { SceneSettings } from '../../types'

interface EnvironmentRigProps {
  settings: SceneSettings
  palette: AtmospherePalette
}

/**
 * A procedural city-light environment. Drei's <Environment> combined with
 * Lightformers gives the glass real PBR reflections without shipping a remote
 * HDR asset, so the scene is self-contained and works offline.
 */
export function EnvironmentRig({ settings, palette }: EnvironmentRigProps) {
  const cyan = settings.neonCyan
  const magenta = settings.neonMagenta
  const environmentPower = 0.55 + palette.night * 0.6

  return (
    <Environment
      key={cyan + magenta}
      resolution={256}
      frames={1}
      background={false}
      environmentIntensity={environmentPower * settings.masterLight}
    >
      <color attach="background" args={['#02040a']} />
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#6f91cf"
        scale={[70, 24, 1]}
        position={[0, 28, -26]}
      />
      <Lightformer
        form="rect"
        intensity={5}
        color={cyan}
        scale={[5, 38, 1]}
        position={[-21, 12, 4]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Lightformer
        form="rect"
        intensity={4}
        color={magenta}
        scale={[4.5, 26, 1]}
        position={[19, 16, -9]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#ffb875"
        scale={[24, 4, 1]}
        position={[0, 1.4, 22]}
      />
      <Lightformer
        form="rect"
        intensity={1.6}
        color="#435d88"
        scale={[34, 1.2, 1]}
        position={[0, 52, -10]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Lightformer
        form="ring"
        intensity={2.2}
        color={magenta}
        scale={10}
        position={[20, 58, -34]}
        target={[0, 25, 0]}
      />
      <Lightformer
        form="circle"
        intensity={1.1}
        color={cyan}
        scale={5}
        position={[-28, 46, -28]}
        target={[0, 30, 0]}
      />
    </Environment>
  )
}
