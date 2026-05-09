# Glimpse — Project Map

> **For AI agents:** Read this file before making any changes. It describes the full project structure, how the code is organized, and the key conventions you must follow.

---

## What Is This Project?

**Glimpse** is a browser-based signal viewer and analyzer built by **Blau Robotics**.

- It is a **static, client-only web app** — no backend, no Node.js, no build step.
- Users open `index.html` directly in a browser (or visit the hosted GitHub Pages site).
- Data comes from **CSV/text files** (drag-and-drop or file picker).
- Visualization is done with the **Plotly** charting library.
- The app is also a **PWA** (Progressive Web App) — it can be installed and used offline.
- It is **general-purpose**: any CSV data can be visualized, not just robotics telemetry.

---

## File Structure

```
Glimpse/
├── index.html          ← Main page. Defines UI layout, loads all scripts, registers service worker.
├── StyleSheet.css      ← All CSS. Includes light/dark theme variables (--bg-color, --text-color, etc.)
├── manifest.json       ← PWA install metadata (name, icons, display mode)
├── sw.js               ← Service worker. Caches app shell for offline use. Bump CACHE_VERSION on release.
├── LICENSE
├── README.md           ← User-facing documentation
├── PROJECT_MAP.md      ← This file. Project map for humans and AI agents.
│
├── js/                 ← All application logic. Plain JavaScript (no framework, no bundler).
│   ├── config.js           ← Constants and defaults (sample time, default column names, etc.)
│   ├── dataParser.js       ← Parses CSV/text input into structured data
│   ├── dataTransforms.js   ← Math operations on signals (filter, diff, integrate, detrend, etc.)
│   ├── plot.js             ← Builds and renders Plotly charts
│   ├── ui.js               ← Sidebar, checkboxes, X-axis dropdown, signal search, layout helpers
│   ├── fileIO.js           ← File input and drag-and-drop handling
│   ├── app.js              ← Central state and actions (the "main controller")
│   ├── contextMenu.js      ← Right-click context menu wired to transforms and actions
│   ├── theme.js            ← Light/dark theme toggle
│   └── views.js            ← Save/restore named signal configurations in localStorage
│
├── images/
│   ├── logo-title.svg              ← Glimpse wordmark (shown in top-right of nav)
│   ├── logo-title.png
│   ├── logo-title-1200x630.png     ← Open Graph / social media image
│   ├── logo-192x192.png            ← PWA icon
│   ├── logo-512x512.png            ← PWA icon (maskable)
│   ├── logo-180x180.png            ← Apple touch icon
│   └── glimpse.ico                 ← Browser favicon
│
├── vendor/             ← Third-party libraries (NOT tracked in git, must be present locally)
│   ├── plotly-latest.min.js
│   ├── sweetalert2@11.js
│   └── font-awesome.min.css
│
└── fonts/              ← Font Awesome webfonts (NOT tracked in git)
```

---

## Global Namespace

All JavaScript uses a **single global object**: `window.Glimpse`.

Each module registers itself as a sub-object. No module imports another — they all share `window.Glimpse` at runtime.

| Namespace | Defined in | What it holds |
|---|---|---|
| `Glimpse.config` | `config.js` | App-wide constants |
| `Glimpse.data` | `dataParser.js` | Parse functions: `parseText`, `verifyGoodName`, `defineObj`, `header4noHeader`, `isEcopiaHeader` |
| `Glimpse.data.transforms` | `dataTransforms.js` | Signal math functions |
| `Glimpse.plot` | `plot.js` | `buildTrace`, `buildLayout`, `render` |
| `Glimpse.ui` | `ui.js` | `addDropdown`, `addCheckbox`, `getCheckedBoxes`, `getXAxisName`, `cleanUp`, `addSignalSearchIfNeeded` |
| `Glimpse.actions` | `app.js` | `loadData`, `selectSignals`, `export2csv`, `cutToZoom`, `relativeTime`, `showExample`, `addLabelsLine`, `markDataTips`, `showStat`, etc. |
| `Glimpse.state` | `app.js` | `{ rows, header, fileName, gridRows, gridCols, gridPattern, operationsLog, lastRenderHadSignals, lastRenderHadTracesOnY1, lastRenderHadTracesOnY2 }` |
| `Glimpse.views` | `views.js` | `saveView`, `listViews`, `applyView`, `exportViews`, `importViews`, `toggle` |

---

## Data Flow

```
[File / Drag-Drop]
       │
   fileIO.js
       │
       ▼
 dataParser.js
(parseText → {header, rows})
       │
       ▼
    app.js
(Glimpse.state.rows/header)
       │
  ┌────┴────┐
  ▼          ▼
ui.js      plot.js
(checkboxes, (Plotly traces
 dropdowns)   and layout)
```

---

## Key Modules — Quick Reference

### `config.js`
- `defaultSampleTime`: 0.01 seconds (used by integrate/diff transforms)
- `dataTipsFontSize`: 12
- `maxHeaderScanLines`: 50 (how many lines to scan before giving up on finding a header)
- `defaultHeader`: 22 named telemetry columns for NextPower devices (TIME, PITCH, ROLL, YAW, PWM_LEFT, ENCODER_LEFT, BATTERY, etc.) — used as a fallback when a file has no header

### `dataParser.js`
- `parseText(text)` → `{ header, rows }` — main entry point for file data
- `verifyGoodName(parts)` → cleaned/validated header array
- `header4noHeader(numCols)` → generates default column names when file has no header row
- `defineObj(header)` → creates `{ colName: [] }` structure for accumulating row data
- `isEcopiaHeader(header)` → returns `true` if the header matches a specific Ecopia device format
- Handles **Ecopia-style** headers (a specific device format with special pre-processing)

### `dataTransforms.js`
Attached to `Glimpse.data.transforms`. Functions operate on column arrays in `Glimpse.state.rows`.
Operations include: `multiply`, `diff`, `integrate`, `filter`, `detrend`, `removeFirst`, `removeMean`, `smoothAngle`, `stats`.

### `plot.js`
- `buildTrace(signalName, subplotIndex, rows, xAxisName)` → Plotly trace object
- `buildLayout(numRows, numCols, options)` → Plotly layout object (supports NxM subplot grids)
- `render(traces, layout)` → calls `Plotly.react` on the `#plot` div
- Reads CSS variables for colors so it respects light/dark theme

### `app.js`
- Holds `Glimpse.state` (the loaded dataset) and `Glimpse.actions`
- `handleDataLoaded({ header, rows, fileName })` — called after parsing; sets up UI and renders initial plot
- `selectSignals()` — reads checkboxes and renders the selected signals across the subplot grid
- `showExample()` — loads built-in sample data (TIME, Sine, Cosine, Random) for demo purposes
- Manages the **operations log** (replay of transforms when applying a saved view)
- Supports **NxM subplot grids** via `gridRows`, `gridCols`, `gridPattern` in state
- `gridPattern` is either `"coupled"` (rows share Y-axes) or `"independent"` (each subplot has its own axes)

### `views.js`
- Saves named view configurations to `localStorage` under key `glimpse-views`
- A view stores: which signals are checked per subplot, grid layout, X-axis selection, and the operations log (so transforms can be replayed)
- Import/export views as JSON files
- `toggle()` — shows/hides the views panel (`#viewsnav`)

### `theme.js`
- Toggles `data-theme` attribute on `<html>` between `light` and `dark`
- Persists choice in `localStorage` under key `glimpse-theme`
- Calls `Plotly.relayout` to update chart colors after switching

---

## UI Structure (index.html)

```
<body>
  <div class="topnav">       ← Top navigation bar
    Home link (Glimpse logo text)
    File open button
    Export CSV button
    Add Labels Line button
    Cut-to-zoom button
    Relative time button
    Data Tips button
    Statistics button
    Link X-axes toggle (pattern-toggle)
    Grid layout dropdown (grid-dropdown)
    Views panel toggle
    Theme toggle (moon icon)
    Logo image (logo-title.svg) — click opens About dialog

  <div class="topnav" id="labelsNavBar">  ← Labels input bar (hidden by default)

  <div class="sidenav">      ← Left sidebar
    Example Data button
    X-axis dropdown
    Signal checkboxes (one set per subplot slot, dynamically created)

  <div id="sidenav-resizer"> ← Invisible drag handle to resize sidebar width

  <div id="viewsnav">        ← Right panel for saved views
    Save View button
    View list
    Export / Import buttons

  <div id="explenation_text"> ← Welcome screen (shown before any data is loaded)

  <div id="plot">            ← Plotly chart container (hidden until data loads)

  <nav id="context-menu">    ← Right-click menu with signal operations
```

---

## Conventions & Rules for Editing

1. **No build step.** Do not add npm, webpack, or any bundler. Edit files directly.
2. **No ES modules.** Scripts use `<script src="">` tags in `index.html`. Everything is attached to `window.Glimpse`.
3. **Each JS file is an IIFE** — wrapped in `(() => { ... })();` to avoid polluting global scope beyond `window.Glimpse`.
4. **Script load order matters.** `index.html` loads scripts in this order: `config.js` → `dataTransforms.js` → `dataParser.js` → `plot.js` → `ui.js` → `fileIO.js` → `app.js` → `contextMenu.js` → `theme.js` → `views.js`.
5. **SweetAlert2 (`Swal`)** is used for all user-facing dialogs (errors, confirmations). Do not use `alert()` or `confirm()`.
6. **localStorage keys in use:** `glimpse-theme` (theme), `glimpse-views` (saved views).
7. **CSS theme variables** are defined in `StyleSheet.css` under `[data-theme="light"]` and `[data-theme="dark"]`. Always use CSS variables for colors, never hardcode.
8. **Bump `CACHE_VERSION`** in `sw.js` whenever you change any file that is part of the app shell (HTML, CSS, JS, vendor files).
9. **No serial port module.** The `serial.js` file that existed in an earlier version has been removed. The app is file-only.

---

## Map Maintenance

This file must be kept current. Update it when:
- A new file or module is added
- A struct or data type changes
- Signal flow or control logic changes
- A new coding convention is established

---

## Hardware Context (Optional / Legacy)

Glimpse is general-purpose, but its `defaultHeader` in `config.js` is pre-filled with columns from **NextPower**, a robotics power/motor controller by Blau Robotics. These include:
- IMU: `PITCH`, `ROLL`, `YAW`, `YAW_CALIBRATION_OFFSET`, `ACCEL_X/Y/Z`
- Motors: `PWM_LEFT/RIGHT`, `ENCODER_LEFT/RIGHT`, `DIRECTION_LEFT/RIGHT`
- Current sensing: `CURRENT_LEFT`, `CURRENT_RIGHT`, `CURRENT_MF`, `CURRENT_MAGNET`
- Line sensors: `SENSOR_LEFT`, `SENSOR_RIGHT`
- Power: `BATTERY`, `GAP_DETECT`
- Time: `TIME` (in seconds, step = `defaultSampleTime`)

This default header is only used as a fallback for files with no header row. Any CSV file works with Glimpse.

---

*Last updated: May 2026*
