# Pixi v8: crash when destroying a Texture still bound to a Sprite

## Steps to reproduce

```bash
npm install
npm run dev
```

1. Wait for the first image.
2. Select **Immediate destroy**.
3. Click **Next** once.

## Expected

Renderer tolerates or skips drawing a sprite whose texture was destroyed before rebind.

## Actual

```
applyStyleParams.mjs: Uncaught TypeError: Cannot read properties of null (reading 'addressModeU')
```

## Workaround

**Deferred destroy** — assign new texture, wait frames, then `destroy(true)` on the previous texture.

## Notes

- Single sprite, no filters — isolates the crash from batch-pool / filter paths.
- @pixi/react does not update sprite texture bindings synchronously with React state; destroying in the same navigation tick is a realistic app pattern.

Environment: pixi.js 8.18+, @pixi/react 8.0.5, Chrome.
