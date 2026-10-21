export interface SceneSettings {
  /** Local scene time in hours, 0–24. Drives the whole lighting grade. */
  timeOfDay: number
  /** Global multiplier applied to sun, ambient and neon lights. */
  masterLight: number
  neonCyan: string
  neonMagenta: string
  /** Exponential fog density (FogExp2). */
  fogDensity: number
  bloomIntensity: number
  bloomThreshold: number
  bloomSmoothing: number
  bloomRadius: number
  rain: boolean
  rainIntensity: number
  wetness: number
  autoRotate: boolean
  autoRotateSpeed: number
}

export type Vec3 = [number, number, number]

export interface BoxTransform {
  position: Vec3
  scale: Vec3
  rotation?: Vec3
}
