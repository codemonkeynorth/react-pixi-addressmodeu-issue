import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Application } from "@pixi/react"
import { Texture, type Application as PixiApplication } from "pixi.js"

import { AppCanvas } from "./AppCanvas"
import { loadImageTexture, releaseTexture, waitFrames } from "./loadImageTexture"
import { deferredReleaseFrameDelay, TEST_MODES, type TestMode } from "./testMode"

import "./pixiSetup"

const IMAGE_URLS = [
  "/images/sample-1.png",
  "/images/sample-2.png",
  "/images/sample-3.png",
] as const

const IMMEDIATE_RENDER_FRAMES = 5

const codeStyle: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.8125rem",
}

const Code = ({ children }: { children: ReactNode }) => (
  <code style={codeStyle}>{children}</code>
)

const CALLOUTS: Record<
  TestMode,
  { tone: "issue" | "ok"; title: string; body: ReactNode }
> = {
  immediate: {
    tone: "issue",
    title: "Destroy while sprite still bound",
    body: (
      <>
        Destroys the previous texture, then forces <Code>renderer.render(stage)</Code> while{" "}
        @pixi/react still binds the sprite to it. Click <strong>Next</strong> once — expect{" "}
        <Code>addressModeU</Code> (or <Code>alphaMode</Code>) TypeError.
      </>
    ),
  },
  deferred: {
    tone: "ok",
    title: "Workaround — deferred destroy",
    body: (
      <>
        Assigns the new texture first, then <Code>destroy(true)</Code> on the previous texture
        after render frames.
      </>
    ),
  },
}

async function renderWhileSpriteStillBound(app: PixiApplication): Promise<void> {
  for (let i = 0; i < IMMEDIATE_RENDER_FRAMES; i += 1) {
    app.renderer.render(app.stage)
    await waitFrames(1)
  }
}

export default function App() {
  const [imageIndex, setImageIndex] = useState(0)
  const [texture, setTexture] = useState<Texture | null>(null)
  const [loading, setLoading] = useState(true)
  const [testMode, setTestMode] = useState<TestMode>("immediate")
  const [navCount, setNavCount] = useState(0)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const textureRef = useRef<Texture | null>(null)
  const appRef = useRef<PixiApplication | null>(null)
  const pendingReleaseRef = useRef<Texture | null>(null)
  const testModeRef = useRef(testMode)
  testModeRef.current = testMode

  const currentUrl = IMAGE_URLS[imageIndex % IMAGE_URLS.length]

  const onAppReady = useCallback((app: PixiApplication) => {
    appRef.current = app
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const previous = textureRef.current
        const mode = testModeRef.current

        const nextTexture = await loadImageTexture(currentUrl)
        if (cancelled) {
          releaseTexture(nextTexture)
          return
        }

        if (previous && mode === "immediate") {
          releaseTexture(previous)
          const app = appRef.current
          if (app?.renderer) {
            await renderWhileSpriteStillBound(app)
          } else {
            await waitFrames(IMMEDIATE_RENDER_FRAMES)
          }
          if (cancelled) {
            releaseTexture(nextTexture)
            return
          }
        }

        textureRef.current = nextTexture
        setTexture(nextTexture)

        if (previous && mode === "deferred") {
          pendingReleaseRef.current = previous
        } else {
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [currentUrl])

  const onTextureDisplayed = useCallback(() => {
    const pending = pendingReleaseRef.current
    const mode = testModeRef.current

    if (!pending) {
      setLoading(false)
      return
    }

    pendingReleaseRef.current = null

    void (async () => {
      await waitFrames(deferredReleaseFrameDelay(mode))
      releaseTexture(pending)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    return () => {
      releaseTexture(textureRef.current)
      textureRef.current = null
    }
  }, [])

  const callout = CALLOUTS[testMode]

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Pixi addressModeU crash repro</h1>
        <p style={styles.subtitle}>
          Single <Code>pixiSprite</Code>, dynamic <Code>BufferImageSource</Code>. Destroying a
          bound texture should not crash the renderer.
        </p>
      </header>

      <div style={styles.controls}>
        <button
          type="button"
          onClick={() => {
            setImageIndex((i) => (i + 1) % IMAGE_URLS.length)
            setNavCount((c) => c + 1)
          }}
          disabled={loading}
        >
          Next image
        </button>
        <span style={styles.muted}>Navigations: {navCount}</span>
      </div>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Method</legend>
        {TEST_MODES.map(({ value, label }) => (
          <label key={value} style={styles.radio}>
            <input
              type="radio"
              name="testMode"
              value={value}
              checked={testMode === value}
              onChange={() => setTestMode(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div style={callout.tone === "ok" ? styles.calloutOk : styles.calloutIssue}>
        <strong>{callout.title}</strong>
        <p style={styles.calloutBody}>{callout.body}</p>
      </div>

      <div ref={viewportRef} style={styles.viewport}>
        <Application background="#111" resizeTo={viewportRef} antialias={false}>
          <AppCanvas
            texture={texture}
            onAppReady={onAppReady}
            onTextureDisplayed={onTextureDisplayed}
          />
        </Application>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily: "system-ui, sans-serif",
    margin: 0,
    padding: "1rem",
    color: "#eee",
    background: "#0a0a0a",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: { marginBottom: "0.75rem" },
  title: { margin: "0 0 0.25rem", fontSize: "1.25rem" },
  subtitle: { margin: 0, opacity: 0.75, maxWidth: "52rem", lineHeight: 1.45 },
  controls: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  muted: { fontSize: "0.875rem", opacity: 0.7 },
  fieldset: {
    border: "1px solid #333",
    borderRadius: "4px",
    margin: "0 0 0.75rem",
    padding: "0.5rem 0.75rem",
    maxWidth: "48rem",
  },
  legend: { padding: "0 0.25rem", fontSize: "0.875rem" },
  radio: {
    display: "flex",
    gap: "0.35rem",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "0.875rem",
    marginBottom: "0.25rem",
  },
  calloutIssue: {
    margin: "0 0 0.75rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "4px",
    background: "#3b1f1f",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    fontSize: "0.875rem",
    maxWidth: "52rem",
  },
  calloutOk: {
    margin: "0 0 0.75rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "4px",
    background: "#14291a",
    border: "1px solid #166534",
    color: "#bbf7d0",
    fontSize: "0.875rem",
    maxWidth: "52rem",
  },
  calloutBody: { margin: "0.35rem 0 0", lineHeight: 1.45 },
  viewport: {
    width: "100%",
    height: "min(70vh, 720px)",
    border: "1px solid #333",
    borderRadius: "4px",
    overflow: "hidden",
  },
}
