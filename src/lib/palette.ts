import { Color, MathUtils, Vector3 } from 'three'

export interface AtmospherePalette {
  top: Color
  horizon: Color
  glow: Color
  fog: Color
  key: Color
  ambient: Color
  hemiSky: Color
  hemiGround: Color
  keyIntensity: number
  ambientIntensity: number
  hemiIntensity: number
  neonIntensity: number
  stars: number
  night: number
}

interface PaletteKeyframe {
  hour: number
  top: string
  horizon: string
  glow: string
  fog: string
  key: string
  ambient: string
  hemiSky: string
  hemiGround: string
  keyIntensity: number
  ambientIntensity: number
  hemiIntensity: number
  neonIntensity: number
  stars: number
  night: number
}

const KEYFRAMES: PaletteKeyframe[] = [
  {
    hour: 0,
    top: '#010309',
    horizon: '#081422',
    glow: '#ff2bd6',
    fog: '#040910',
    key: '#6b8cff',
    ambient: '#263a63',
    hemiSky: '#0a1830',
    hemiGround: '#03040a',
    keyIntensity: 0,
    ambientIntensity: 0.42,
    hemiIntensity: 0.45,
    neonIntensity: 1,
    stars: 1,
    night: 1,
  },
  {
    hour: 4.5,
    top: '#01040c',
    horizon: '#0a1726',
    glow: '#d13cff',
    fog: '#050a12',
    key: '#6f8cf2',
    ambient: '#233658',
    hemiSky: '#0a172a',
    hemiGround: '#03040a',
    keyIntensity: 0,
    ambientIntensity: 0.34,
    hemiIntensity: 0.38,
    neonIntensity: 0.9,
    stars: 0.62,
    night: 1,
  },
  {
    hour: 6.2,
    top: '#16172b',
    horizon: '#de6d5c',
    glow: '#ff7d5e',
    fog: '#281a24',
    key: '#ff9b6d',
    ambient: '#7b6175',
    hemiSky: '#4b3f64',
    hemiGround: '#10080f',
    keyIntensity: 0.9,
    ambientIntensity: 0.55,
    hemiIntensity: 0.65,
    neonIntensity: 0.4,
    stars: 0.04,
    night: 0.55,
  },
  {
    hour: 8,
    top: '#263849',
    horizon: '#a38f8a',
    glow: '#ffc39f',
    fog: '#4b4b55',
    key: '#ffd7b2',
    ambient: '#8b95a9',
    hemiSky: '#7a93a8',
    hemiGround: '#28242b',
    keyIntensity: 2,
    ambientIntensity: 0.75,
    hemiIntensity: 0.85,
    neonIntensity: 0.18,
    stars: 0,
    night: 0,
  },
  {
    hour: 12.5,
    top: '#344b5d',
    horizon: '#a7a5a1',
    glow: '#ffe8c9',
    fog: '#66686f',
    key: '#fff2de',
    ambient: '#a7b4c4',
    hemiSky: '#a7c3d3',
    hemiGround: '#3a3537',
    keyIntensity: 2.8,
    ambientIntensity: 0.9,
    hemiIntensity: 1,
    neonIntensity: 0.12,
    stars: 0,
    night: 0,
  },
  {
    hour: 16.5,
    top: '#2a3548',
    horizon: '#c48e77',
    glow: '#ffc994',
    fog: '#5a5053',
    key: '#ffcf9f',
    ambient: '#94858a',
    hemiSky: '#8f9eae',
    hemiGround: '#3b2e2e',
    keyIntensity: 2.1,
    ambientIntensity: 0.7,
    hemiIntensity: 0.8,
    neonIntensity: 0.22,
    stars: 0,
    night: 0,
  },
  {
    hour: 18.2,
    top: '#16152b',
    horizon: '#e4684e',
    glow: '#ff4d7e',
    fog: '#331f2b',
    key: '#ff8152',
    ambient: '#6d5368',
    hemiSky: '#6b4560',
    hemiGround: '#160b14',
    keyIntensity: 0.9,
    ambientIntensity: 0.55,
    hemiIntensity: 0.6,
    neonIntensity: 0.55,
    stars: 0.05,
    night: 0.15,
  },
  {
    hour: 19.5,
    top: '#06091b',
    horizon: '#2f1d44',
    glow: '#ff2bd6',
    fog: '#0f0b18',
    key: '#ff6552',
    ambient: '#3c2f56',
    hemiSky: '#2d2448',
    hemiGround: '#08040c',
    keyIntensity: 0.18,
    ambientIntensity: 0.4,
    hemiIntensity: 0.45,
    neonIntensity: 0.9,
    stars: 0.45,
    night: 0.78,
  },
  {
    hour: 21.5,
    top: '#01030b',
    horizon: '#071525',
    glow: '#ff2bd6',
    fog: '#040812',
    key: '#7192ff',
    ambient: '#24375a',
    hemiSky: '#0a1830',
    hemiGround: '#030409',
    keyIntensity: 0,
    ambientIntensity: 0.3,
    hemiIntensity: 0.35,
    neonIntensity: 1,
    stars: 1,
    night: 1,
  },
  {
    hour: 24,
    top: '#010309',
    horizon: '#081422',
    glow: '#ff2bd6',
    fog: '#040910',
    key: '#6b8cff',
    ambient: '#263a63',
    hemiSky: '#0a1830',
    hemiGround: '#03040a',
    keyIntensity: 0,
    ambientIntensity: 0.42,
    hemiIntensity: 0.45,
    neonIntensity: 1,
    stars: 1,
    night: 1,
  },
]

// Pre-convert every colour once. ColorManagement handles sRGB -> linear conversion.
const COLOR_KEYS = ['top', 'horizon', 'glow', 'fog', 'key', 'ambient', 'hemiSky', 'hemiGround'] as const
const PREPARED = KEYFRAMES.map((frame) => {
  const colours = {} as Record<(typeof COLOR_KEYS)[number], Color>
  for (const key of COLOR_KEYS) colours[key] = new Color(frame[key])
  return { ...frame, ...colours }
})

/** Interpolates the hand-authored lighting grade for any hour of the day. */
export function samplePalette(hours: number): AtmospherePalette {
  const wrapped = ((hours % 24) + 24) % 24
  let index = 0
  while (index < PREPARED.length - 2 && wrapped >= PREPARED[index + 1].hour) index += 1
  const a = PREPARED[index]
  const b = PREPARED[index + 1]
  const mix = MathUtils.smoothstep(wrapped, a.hour, b.hour)

  const blend = (key: (typeof COLOR_KEYS)[number]) => new Color().lerpColors(a[key], b[key], mix)
  const lerp = (key: 'keyIntensity' | 'ambientIntensity' | 'hemiIntensity' | 'neonIntensity' | 'stars' | 'night') =>
    MathUtils.lerp(a[key], b[key], mix)

  return {
    top: blend('top'),
    horizon: blend('horizon'),
    glow: blend('glow'),
    fog: blend('fog'),
    key: blend('key'),
    ambient: blend('ambient'),
    hemiSky: blend('hemiSky'),
    hemiGround: blend('hemiGround'),
    keyIntensity: lerp('keyIntensity'),
    ambientIntensity: lerp('ambientIntensity'),
    hemiIntensity: lerp('hemiIntensity'),
    neonIntensity: lerp('neonIntensity'),
    stars: lerp('stars'),
    night: lerp('night'),
  }
}

/** Arc from sunrise (06:00) over the tower to sunset (18:00). */
export function getSunDirection(hours: number, target = new Vector3()) {
  const angle = ((hours - 6) / 24) * Math.PI * 2
  return target.set(Math.cos(angle) * 0.92, Math.sin(angle), 0.38 + Math.cos(angle) * 0.28).normalize()
}

export function formatClock(hours: number) {
  const totalMinutes = Math.round((((hours % 24) + 24) % 24) * 60) % 1440
  const hh = Math.floor(totalMinutes / 60)
  const mm = totalMinutes % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function getTimeLabel(hours: number) {
  const h = ((hours % 24) + 24) % 24
  if (h < 5) return 'DEEP NIGHT'
  if (h < 7) return 'DAWN'
  if (h < 17.5) return 'DAYLIGHT'
  if (h < 19.2) return 'SUNSET'
  if (h < 22.5) return 'NIGHT'
  return 'MIDNIGHT'
}
