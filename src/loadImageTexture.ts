import { decode } from "image-js"
import { BufferImageSource, Texture } from "pixi.js"

export async function loadImageTexture(url: string): Promise<Texture> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const decoded = decode(bytes)
  const raw = decoded.getRawImage()
  const { width, height, data, channels } = raw

  const rgba = new Uint8Array(width * height * 4)

  if (channels === 4) {
    rgba.set(data as Uint8Array)
  } else if (channels === 3) {
    const rgb = data as Uint8Array
    for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
      rgba[j] = rgb[i]
      rgba[j + 1] = rgb[i + 1]
      rgba[j + 2] = rgb[i + 2]
      rgba[j + 3] = 255
    }
  } else if (channels === 1) {
    const grey = data as Uint8Array
    for (let i = 0, j = 0; i < grey.length; i += 1, j += 4) {
      const v = grey[i]
      rgba[j] = v
      rgba[j + 1] = v
      rgba[j + 2] = v
      rgba[j + 3] = 255
    }
  } else {
    throw new Error(`Unsupported channel count: ${channels}`)
  }

  const source = new BufferImageSource({ resource: rgba, width, height })
  return Texture.from(source, true)
}

export function releaseTexture(texture: Texture | null | undefined): void {
  if (!texture || texture.destroyed) return
  texture.destroy(true)
}

export function waitFrames(frames = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = Math.max(1, frames)
    const tick = () => {
      remaining -= 1
      if (remaining > 0) {
        requestAnimationFrame(tick)
        return
      }
      resolve()
    }
    requestAnimationFrame(tick)
  })
}
