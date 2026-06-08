export type TestMode = "immediate" | "deferred"

export const TEST_MODES: { value: TestMode; label: string }[] = [
  { value: "immediate", label: "Immediate destroy (crash repro)" },
  { value: "deferred", label: "Deferred destroy (workaround)" },
]

export function deferredReleaseFrameDelay(mode: TestMode): number {
  return mode === "deferred" ? 3 : 0
}
