import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
} from 'three'
import { mulberry32 } from '../../lib/random'

const RAIN_COUNT = 6200
const RAIN_AREA = 94
const RAIN_HEIGHT = 82

interface RainProps {
  intensity: number
  color: string
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSpeed;
  attribute float aSize;

  varying float vFade;

  void main() {
    vec3 transformed = position;
    float fall = mod(position.y - uTime * aSpeed, 82.0);
    transformed.y = fall;
    transformed.x += sin(uTime * 0.4 + position.z * 0.08) * 1.2 + fall * 0.03;
    transformed.z += cos(uTime * 0.22 + position.x * 0.05) * 0.9;

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * (220.0 / -viewPosition.z) * uPixelRatio, 0.7, 22.0);

    float horizonFade = smoothstep(0.0, 4.0, transformed.y) *
      (1.0 - smoothstep(68.0, 82.0, transformed.y));
    float depthFade = clamp(150.0 / -viewPosition.z, 0.08, 1.0);
    vFade = horizonFade * depthFade;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vFade;

  void main() {
    vec2 coord = gl_PointCoord;
    if (abs(coord.x - 0.5) > 0.11) discard;

    float edge = smoothstep(0.11, 0.015, abs(coord.x - 0.5));
    float verticalFade = smoothstep(0.0, 0.22, coord.y) * smoothstep(1.0, 0.74, coord.y);
    float alpha = edge * verticalFade * vFade * uOpacity;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`

export function Rain({ intensity, color }: RainProps) {
  const { viewport } = useThree()

  const geometry = useMemo(() => {
    const random = mulberry32(0x5eedbabe)
    const positions = new Float32Array(RAIN_COUNT * 3)
    const speeds = new Float32Array(RAIN_COUNT)
    const sizes = new Float32Array(RAIN_COUNT)
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      positions[i * 3] = (random() - 0.5) * RAIN_AREA * 2
      positions[i * 3 + 1] = random() * RAIN_HEIGHT
      positions[i * 3 + 2] = (random() - 0.5) * RAIN_AREA * 2
      speeds[i] = 34 + Math.pow(random(), 1.8) * 54
      sizes[i] = 0.9 + random() * 2.2
    }
    const next = new BufferGeometry()
    next.setAttribute('position', new Float32BufferAttribute(positions, 3))
    next.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1))
    next.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
    return next
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: viewport.dpr },
      uColor: { value: new Color('#c7f6ff') },
      uOpacity: { value: 0.3 },
    }),
    [],
  )

  const rainMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [uniforms],
  )

  useEffect(() => {
    geometry.setDrawRange(0, Math.floor(RAIN_COUNT * Math.max(0, Math.min(1, intensity))))
  }, [geometry, intensity])

  useEffect(() => {
    uniforms.uPixelRatio.value = viewport.dpr
  }, [uniforms, viewport.dpr])

  useEffect(() => {
    uniforms.uColor.value.set(color)
  }, [color, uniforms])

  useEffect(
    () => () => {
      geometry.dispose()
      rainMaterial.dispose()
    },
    [geometry, rainMaterial],
  )

  useFrame((state, delta) => {
    uniforms.uTime.value += delta
    uniforms.uOpacity.value =
      (0.24 + intensity * 0.22) * (0.94 + Math.sin(state.clock.elapsedTime * 0.4) * 0.06)
  })

  return (
    <points
      geometry={geometry}
      material={rainMaterial}
      frustumCulled={false}
      renderOrder={10}
    />
  )
}
