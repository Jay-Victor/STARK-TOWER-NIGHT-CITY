import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { mulberry32, smoothstep } from './random'

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available in this browser')
  return { canvas, ctx }
}

function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  let cursor = x
  for (const character of text) {
    ctx.fillText(character, cursor, y)
    cursor += ctx.measureText(character).width + tracking
  }
}

/** The sign never fetches a font or image; it is drawn straight into a CanvasTexture. */
export function createStarkSignTexture(accent = '#63f8ff', secondary = '#ff2bd6') {
  const { canvas, ctx } = makeCanvas(1024, 256)
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0)
  gradient.addColorStop(0, 'rgba(3, 8, 15, 0)')
  gradient.addColorStop(0.16, 'rgba(3, 8, 15, 0.88)')
  gradient.addColorStop(0.78, 'rgba(3, 8, 15, 0.88)')
  gradient.addColorStop(1, 'rgba(3, 8, 15, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 256)

  ctx.strokeStyle = 'rgba(100, 247, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 42)
  ctx.lineTo(944, 42)
  ctx.moveTo(80, 213)
  ctx.lineTo(944, 213)
  ctx.stroke()

  ctx.font = '500 17px "Cascadia Mono", "Consolas", monospace'
  ctx.fillStyle = 'rgba(175, 239, 255, 0.72)'
  trackedText(ctx, 'STARK INDUSTRIES  /  ARC REACTOR INTEGRATED', 88, 66, 2.4)
  ctx.fillStyle = secondary
  trackedText(ctx, 'NYC — 01', 820, 66, 2)

  ctx.font = '900 116px "Bahnschrift", "Arial Black", sans-serif'
  ctx.fillStyle = '#f2ffff'
  ctx.shadowColor = accent
  ctx.shadowBlur = 32
  trackedText(ctx, 'STARK', 92, 172, 12)
  ctx.shadowBlur = 0

  ctx.fillStyle = accent
  ctx.fillRect(92, 188, 504, 4)

  ctx.font = '600 19px "Cascadia Mono", "Consolas", monospace'
  ctx.fillStyle = 'rgba(215, 252, 255, 0.9)'
  trackedText(ctx, 'TOWER 01  //  DEFENSE GRID ONLINE', 616, 163, 1.5)
  ctx.fillStyle = secondary
  ctx.fillRect(922, 140, 3, 28)
  ctx.fillRect(930, 140, 1, 28)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export interface BillboardSpec {
  kicker: string
  title: string
  subline: string
  accent: string
  secondary: string
}

export function createBillboardTexture(spec: BillboardSpec) {
  const { canvas, ctx } = makeCanvas(512, 768)
  ctx.fillStyle = '#03070e'
  ctx.fillRect(0, 0, 512, 768)

  const wash = ctx.createLinearGradient(0, 0, 512, 768)
  wash.addColorStop(0, 'rgba(30, 224, 255, 0.14)')
  wash.addColorStop(0.55, 'rgba(5, 10, 20, 0.92)')
  wash.addColorStop(1, 'rgba(255, 43, 214, 0.12)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, 512, 768)

  ctx.strokeStyle = spec.accent
  ctx.lineWidth = 3
  ctx.strokeRect(20, 20, 472, 728)
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 1
  ctx.strokeRect(34, 34, 444, 700)

  ctx.fillStyle = spec.accent
  ctx.fillRect(54, 70, 86, 4)
  ctx.font = '600 21px "Cascadia Mono", "Consolas", monospace'
  ctx.fillStyle = 'rgba(217, 252, 255, 0.85)'
  trackedText(ctx, spec.kicker, 54, 113, 4)

  ctx.save()
  ctx.translate(58, 610)
  ctx.rotate(-Math.PI / 2)
  ctx.font = '900 84px "Bahnschrift", "Arial Black", sans-serif'
  ctx.fillStyle = spec.accent
  ctx.shadowColor = spec.accent
  ctx.shadowBlur = 24
  trackedText(ctx, spec.title, 0, 0, 6)
  ctx.restore()

  ctx.font = '700 28px "Bahnschrift", "Arial Narrow", sans-serif'
  ctx.fillStyle = '#f6feff'
  trackedText(ctx, spec.subline, 54, 690, 2.3)

  ctx.font = '500 18px "Cascadia Mono", "Consolas", monospace'
  ctx.fillStyle = spec.secondary
  trackedText(ctx, 'NIGHT CITY // OPEN CHANNEL', 54, 725, 2)

  // Tiny scanlines make the panels read as emissive screens rather than flat cards.
  ctx.fillStyle = 'rgba(75, 240, 255, 0.06)'
  for (let y = 42; y < 720; y += 7) ctx.fillRect(38, y, 436, 1)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function hash2(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function valueNoise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy
}

function fbm(x: number, y: number, octaves: number) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise(x * frequency, y * frequency) * amplitude
    frequency *= 2.08
    amplitude *= 0.48
  }
  return value
}

/** Procedural wet asphalt: color, height and roughness maps share one noise field. */
export function createAsphaltTextures(size = 512) {
  const random = mulberry32(0x51a7c0de)
  const { canvas: colorCanvas, ctx: colorCtx } = makeCanvas(size, size)
  const { canvas: bumpCanvas, ctx: bumpCtx } = makeCanvas(size, size)
  const { canvas: roughCanvas, ctx: roughCtx } = makeCanvas(size, size)

  const colorImage = colorCtx.createImageData(size, size)
  const bumpImage = bumpCtx.createImageData(size, size)
  const roughImage = roughCtx.createImageData(size, size)
  const colorData = colorImage.data
  const bumpData = bumpImage.data
  const roughData = roughImage.data

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      const u = x / size
      const v = y / size
      const grain = fbm(u * 24 + 4.2, v * 24 - 8.4, 4)
      const broad = fbm(u * 5.2 - 3.1, v * 5.2 + 8.7, 5)
      const puddle = smoothstep(0.53, 0.67, fbm(u * 2.9 + 14.2, v * 2.9 - 2.4, 4))
      const cracks = Math.abs(fbm(u * 11 + 19, v * 11 + 7, 3) - 0.5)
      const crack = cracks < 0.012 ? 0.35 : 1
      const speck = random()

      const base = (14 + grain * 36 + broad * 14) * crack
      const wet = puddle * 8
      const red = Math.max(2, base * 0.5 + wet * 0.42)
      const green = Math.max(3, base * 0.76 + wet * 0.8)
      const blue = Math.max(5, base * 1.12 + wet * 1.2)

      colorData[index] = Math.min(70, red + (speck > 0.982 ? 20 : 0))
      colorData[index + 1] = Math.min(85, green + (speck > 0.982 ? 24 : 0))
      colorData[index + 2] = Math.min(105, blue + (speck > 0.982 ? 30 : 0))
      colorData[index + 3] = 255

      const height = 124 + grain * 86 + (1 - puddle) * 24 - (crack < 1 ? 26 : 0)
      bumpData[index] = height
      bumpData[index + 1] = height
      bumpData[index + 2] = height
      bumpData[index + 3] = 255

      const rough = 208 - puddle * 154 + grain * 26 + (speck > 0.986 ? 20 : 0)
      roughData[index] = rough
      roughData[index + 1] = rough
      roughData[index + 2] = rough
      roughData[index + 3] = 255
    }
  }

  colorCtx.putImageData(colorImage, 0, 0)
  bumpCtx.putImageData(bumpImage, 0, 0)
  roughCtx.putImageData(roughImage, 0, 0)

  const configure = (texture: CanvasTexture) => {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(14, 14)
    texture.anisotropy = 8
    return texture
  }

  const map = configure(new CanvasTexture(colorCanvas))
  map.colorSpace = SRGBColorSpace
  const bumpMap = configure(new CanvasTexture(bumpCanvas))
  const roughnessMap = configure(new CanvasTexture(roughCanvas))

  return { map, bumpMap, roughnessMap }
}

export function disposeTextureSet(textures: { map: CanvasTexture; bumpMap: CanvasTexture; roughnessMap: CanvasTexture }) {
  textures.map.dispose()
  textures.bumpMap.dispose()
  textures.roughnessMap.dispose()
}
