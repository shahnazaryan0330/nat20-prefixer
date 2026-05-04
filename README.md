# Nat20 Prefixer

A **Visual Studio Code** and **Cursor** extension for up-to-date **CSS vendor prefixes** via [Autoprefixer](https://github.com/postcss/autoprefixer) and [Browserslist](https://github.com/browserslist/browserslist), optional stripping of prefixes, and small `opacity` / `visibility` helpers inside `@keyframes`.

## Features

- Prefix CSS for your target browsers (Browserslist string in settings).
- **CSS**, **SCSS**, **Less**, **PostCSS**, and **Tailwind CSS** language modes.
- Inside `@keyframes` only: `opacity: 1` / `opacity: 0` paired with `visibility: visible` / `hidden` when applicable.
- Commands to **strip** vendor prefixes from property names and normalize `@-*-keyframes` to `@keyframes`.

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for **Nat20**.

| Command title |
|---------------|
| Nat20: Add vendor prefixes (file) |
| Nat20: Add vendor prefixes (selection) |
| Nat20: Strip vendor prefixes (file) |
| Nat20: Strip vendor prefixes (selection) |

## Settings

| Key | Default | Description |
|-----|---------|-------------|
| `nat20Prefixer.browserslist` | `> 0.5%, last 2 versions, Firefox ESR, not dead` | Browserslist query for Autoprefixer |
| `nat20Prefixer.prefixOnSave` | `false` | Run prefixing on file save |

## Development

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host (see `.vscode/launch.json`).

Build a `.vsix` installable package:

```bash
npm run package
```

This produces `nat20-prefixer-<version>.vsix` in the project root (version from `package.json`).

`vsce` may warn about a large file count (mostly `caniuse-lite` data pulled in by Autoprefixer). The extension still runs normally; you can shrink the package later with a single-file bundle (e.g. esbuild or `@vercel/ncc`).

## License

MIT — see the `LICENSE` file in the repository root.
