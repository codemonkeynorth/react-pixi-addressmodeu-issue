# react-pixi-addressmodeu-issue

Minimal repro: Pixi throws when `texture.destroy(true)` runs while a sprite still references that texture during a React/@pixi/react texture swap.

Repo: [codemonkeynorth/react-pixi-addressmodeu-issue](https://github.com/codemonkeynorth/react-pixi-addressmodeu-issue)

Related (separate issue): [react-pixi-cleanup-issue](https://github.com/codemonkeynorth/react-pixi-cleanup-issue) — batch-pool shell retention after correct destroy.

## Run

```bash
npm install
npm run dev
```

## Repro

1. Wait for the first image.
2. **Immediate destroy** (default).
3. Click **Next** once → console:

```
TypeError: Cannot read properties of null (reading 'addressModeU')
```

## Workaround

**Deferred destroy** — assign new texture, then `destroy(true)` after render frames.

## Docs

[docs/issue.md](docs/issue.md)

## Stack

pixi.js ^8.18, @pixi/react ^8.0.5, React 19, Vite 6, image-js ^1.6
