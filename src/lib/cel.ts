import {
  Color,
  DataTexture,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
  type ColorRepresentation,
  type Side,
} from 'three'

const GRADIENT_CACHE = new Map<string, DataTexture>()

/**
 * A tiny 1D ramp is the whole 三渲二 lighting model: MeshToonMaterial reads the
 * red channel against N·L, so these few pixels become the hard, stepped light
 * bands. Nearest filtering keeps the transitions pixel-crisp instead of muddy.
 */
export function celGradient(steps: number[]) {
  const key = steps.join(',')
  const cached = GRADIENT_CACHE.get(key)
  if (cached) return cached

  const data = new Uint8Array(steps.length * 4)
  steps.forEach((step, index) => {
    const value = Math.round(Math.min(1, Math.max(0, step)) * 255)
    data[index * 4] = value
    data[index * 4 + 1] = value
    data[index * 4 + 2] = value
    data[index * 4 + 3] = 255
  })

  const texture = new DataTexture(data, steps.length, 1, RGBAFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  GRADIENT_CACHE.set(key, texture)
  return texture
}

export const CEL_STRUCTURE_RAMP = celGradient([0.11, 0.11, 0.28, 0.54, 0.93, 1])
export const CEL_FRAME_RAMP = celGradient([0.13, 0.13, 0.3, 0.62, 0.96, 1])
export const CEL_GLASS_RAMP = celGradient([0.05, 0.08, 0.24, 0.46, 0.84, 1])
export const CEL_HERO_RAMP = celGradient([0.16, 0.16, 0.36, 0.66, 0.95, 1])

export interface CelMaterialOptions {
  color: ColorRepresentation
  ramp?: DataTexture
  rimColor?: ColorRepresentation
  rimStrength?: number
  rimPower?: number
  skyColor?: ColorRepresentation
  skyStrength?: number
  groundColor?: ColorRepresentation
  groundStrength?: number
  edgeDarkness?: number
  opacity?: number
  transparent?: boolean
  depthWrite?: boolean
  side?: Side
  emissive?: ColorRepresentation
  emissiveIntensity?: number
}

/**
 * MeshToonMaterial plus the two things a basic toon shader is missing:
 * a neon fresnel rim (the ink/rim pass) and a faint view-space edge darkening
 * that draws the silhouette without a whole extra post-processing outline pass.
 */
export function createCelMaterial(options: CelMaterialOptions) {
  const material = new MeshToonMaterial({
    color: options.color,
    gradientMap: options.ramp ?? CEL_STRUCTURE_RAMP,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true,
    side: options.side,
    emissive: options.emissive ?? '#000000',
    emissiveIntensity: options.emissiveIntensity ?? 0,
    fog: true,
  })

  const uniforms = {
    uCelRimColor: { value: new Color(options.rimColor ?? '#42f4ff') },
    uCelRimStrength: { value: options.rimStrength ?? 0.35 },
    uCelRimPower: { value: options.rimPower ?? 3.2 },
    uCelSkyColor: { value: new Color(options.skyColor ?? '#2f6a90') },
    uCelSkyStrength: { value: options.skyStrength ?? 0.16 },
    uCelGroundColor: { value: new Color(options.groundColor ?? '#ff2bd6') },
    uCelGroundStrength: { value: options.groundStrength ?? 0.06 },
    uCelEdgeDarkness: { value: options.edgeDarkness ?? 0.28 },
  }

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uCelRimColor;
        uniform float uCelRimStrength;
        uniform float uCelRimPower;
        uniform vec3 uCelSkyColor;
        uniform float uCelSkyStrength;
        uniform vec3 uCelGroundColor;
        uniform float uCelGroundStrength;
        uniform float uCelEdgeDarkness;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `float celFacing = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
        float celRim = pow(1.0 - celFacing, uCelRimPower);
        outgoingLight += uCelRimColor * (celRim * uCelRimStrength);
        outgoingLight += uCelSkyColor * (smoothstep(0.15, 0.9, normal.y) * uCelSkyStrength);
        outgoingLight += uCelGroundColor * (smoothstep(0.12, 0.92, -normal.y) * uCelGroundStrength);
        outgoingLight *= 1.0 - celRim * uCelEdgeDarkness;

        #include <opaque_fragment>`,
      )
  }

  material.customProgramCacheKey = () => 'cel-toon-v1'
  return material
}
