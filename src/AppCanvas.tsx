import { useApplication } from "@pixi/react"
import { Texture, type Application } from "pixi.js"
import { useEffect } from "react"

const DISPLAY_MAX_WIDTH = 520

type AppCanvasProps = {
  texture: Texture | null
  onAppReady: (app: Application) => void
  onTextureDisplayed?: () => void
}

export function AppCanvas({ texture, onAppReady, onTextureDisplayed }: AppCanvasProps) {
  const { app } = useApplication()

  useEffect(() => {
    if (app?.renderer) {
      onAppReady(app)
    }
  }, [app, onAppReady])

  useEffect(() => {
    if (texture && !texture.destroyed && app?.renderer) {
      onTextureDisplayed?.()
    }
  }, [app, onTextureDisplayed, texture])

  const display =
    texture && !texture.destroyed ? texture : Texture.EMPTY
  const scale =
    texture && !texture.destroyed && texture.width > 0
      ? DISPLAY_MAX_WIDTH / texture.width
      : 1

  return <pixiSprite texture={display} x={16} y={16} anchor={0} scale={scale} />
}
