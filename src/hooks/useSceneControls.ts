import { folder, useControls, useCreateStore } from 'leva'
import type { SceneSettings } from '../types'

export interface SceneControlState {
  settings: SceneSettings
  store: ReturnType<typeof useCreateStore>
}

/**
 * One Leva store powers both the panel and the scene. Values are flattened into
 * the strongly typed SceneSettings shape before reaching any Three.js code.
 */
export function useSceneControls(): SceneControlState {
  const store = useCreateStore()
  const [values] = useControls(
    () => ({
      'TIME SYSTEM': folder(
        {
          timeOfDay: {
            value: 21.6,
            min: 0,
            max: 24,
            step: 0.1,
            label: 'LOCAL TIME / HRS',
          },
          masterLight: {
            value: 1,
            min: 0,
            max: 2,
            step: 0.01,
            label: 'LIGHT GAIN',
          },
        },
        { order: 1 },
      ),
      'NEON SIGNAL': folder(
        {
          neonCyan: { value: '#42f4ff', label: 'CYAN SIGNAL' },
          neonMagenta: { value: '#ff2bd6', label: 'MAGENTA SIGNAL' },
        },
        { order: 2 },
      ),
      'ATMOSPHERE': folder(
        {
          fogDensity: {
            value: 0.0042,
            min: 0.001,
            max: 0.03,
            step: 0.0002,
            label: 'FOG DENSITY',
          },
        },
        { order: 3 },
      ),
      'BLOOM FX': folder(
        {
          bloomIntensity: {
            value: 1.35,
            min: 0,
            max: 4,
            step: 0.01,
            label: 'INTENSITY',
          },
          bloomThreshold: {
            value: 0.55,
            min: 0,
            max: 1.5,
            step: 0.01,
            label: 'THRESHOLD',
          },
          bloomSmoothing: {
            value: 0.18,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'SMOOTHING',
          },
          bloomRadius: {
            value: 0.62,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'RADIUS',
          },
        },
        { order: 4 },
      ),
      'WEATHER': folder(
        {
          rain: { value: true, label: 'RAIN SYSTEM', order: 1 },
          rainIntensity: {
            value: 0.62,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'RAIN DENSITY',
            order: 2,
          },
          wetness: {
            value: 0.86,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'SURFACE WETNESS',
            order: 3,
          },
        },
        { order: 5 },
      ),
      'CAMERA RIG': folder(
        {
          autoRotate: { value: true, label: 'AUTO ORBIT', order: 1 },
          autoRotateSpeed: {
            value: 0.55,
            min: 0,
            max: 3,
            step: 0.05,
            label: 'ORBIT SPEED',
            order: 2,
          },
        },
        { order: 6, collapsed: true },
      ),
    }),
    { store },
  )

  return {
    store,
    settings: {
      timeOfDay: values.timeOfDay,
      masterLight: values.masterLight,
      neonCyan: values.neonCyan,
      neonMagenta: values.neonMagenta,
      fogDensity: values.fogDensity,
      bloomIntensity: values.bloomIntensity,
      bloomThreshold: values.bloomThreshold,
      bloomSmoothing: values.bloomSmoothing,
      bloomRadius: values.bloomRadius,
      rain: values.rain,
      rainIntensity: values.rainIntensity,
      wetness: values.wetness,
      autoRotate: values.autoRotate,
      autoRotateSpeed: values.autoRotateSpeed,
    },
  }
}
