import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  Color,
  MathUtils,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { AtmospherePalette } from '../../lib/palette'

interface SkyDomeProps {
  palette: AtmospherePalette
  sunDirection: Vector3
}

const vertexShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uGlowColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  uniform float uStars;
  uniform float uSunStrength;
  uniform float uTime;

  varying vec3 vDirection;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 direction = normalize(vDirection);
    float height = clamp(direction.y, 0.0, 1.0);
    float horizon = pow(1.0 - height, 2.1);
    vec3 color = mix(uTopColor, uHorizonColor, horizon);

    float angle = atan(direction.z, direction.x);
    float hazeVariation = 0.08 + 0.045 * sin(angle * 3.0 + 1.7) + 0.02 * sin(angle * 8.0 - 0.4);
    color += uGlowColor * exp(-height * 12.0) * hazeVariation;

    float cosSun = max(dot(direction, normalize(uSunDirection)), 0.0);
    float sunDisc = smoothstep(0.99945, 0.99988, cosSun);
    float sunHalo = pow(cosSun, 72.0);
    color += uSunColor * ((sunDisc * 4.0) + (sunHalo * 0.22)) * uSunStrength;

    vec2 polar = vec2(
      atan(direction.z, direction.x) / 6.2831853 + 0.5,
      asin(clamp(direction.y, -1.0, 1.0)) / 3.1415926 + 0.5
    );
    vec2 starGrid = polar * vec2(780.0, 390.0);
    vec2 cell = floor(starGrid);
    vec2 local = fract(starGrid) - 0.5;
    float randomValue = hash21(cell);
    float star = smoothstep(0.1, 0.0, length(local)) * step(0.9974, randomValue);
    float twinkle = 0.7 + 0.3 * sin(uTime * (0.4 + randomValue * 1.2) + randomValue * 70.0);
    color += vec3(0.62, 0.86, 1.0) * star * twinkle * uStars * smoothstep(0.035, 0.2, direction.y);

    float ribbon = smoothstep(0.45, 0.95, sin(direction.y * 8.0 + angle * 2.0 + uTime * 0.015));
    color += uGlowColor * ribbon * 0.008 * uStars;

    gl_FragColor = vec4(color, 1.0);
  }
`

export function SkyDome({ palette, sunDirection }: SkyDomeProps) {
  const material = useRef<ShaderMaterial>(null)
  const sphere = useRef<SphereGeometry>(null)

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new Color() },
      uHorizonColor: { value: new Color() },
      uGlowColor: { value: new Color() },
      uSunColor: { value: new Color() },
      uSunDirection: { value: new Vector3(0, 1, 0) },
      uStars: { value: 1 },
      uSunStrength: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uTopColor.value.copy(palette.top)
    uniforms.uHorizonColor.value.copy(palette.horizon)
    uniforms.uGlowColor.value.copy(palette.glow)
    uniforms.uSunColor.value.copy(palette.key)
    uniforms.uSunDirection.value.copy(sunDirection)
    uniforms.uStars.value = palette.stars
    uniforms.uSunStrength.value = MathUtils.smoothstep(sunDirection.y, -0.1, 0.04)
  }, [palette, sunDirection, uniforms])

  useEffect(
    () => () => {
      sphere.current?.dispose()
      material.current?.dispose()
    },
    [],
  )

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh renderOrder={-100} frustumCulled={false} name="cyber-sky">
      <sphereGeometry ref={sphere} args={[500, 48, 32]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}
