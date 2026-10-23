# Hide & Seek — Pathfinding Visualizer

An interactive pathfinding playground. Draw a map, drop a start and a goal, and
watch six classic graph-search algorithms explore it cell by cell — then race
them against each other and see which one actually suits the map you built.

**Live:** <http://troyyu527.github.io/hidenseek>

The point isn't just to animate Dijkstra. It's to make the *trade-offs* visible:
which algorithms guarantee the shortest route, which ones get there faster by
guessing, and which ones fall apart when the terrain has a cost.

## What it does

- **Six search algorithms**, animated as they expand:
  **Dijkstra**, **A\***, **breadth-first (BFS)**, **depth-first (DFS)**,
  **greedy best-first**, and **bidirectional search**.
- **Weighted terrain** — sand costs more to cross than open ground, so the
  algorithms visibly disagree about where they're willing to go. This is where
  BFS and Dijkstra stop being the same thing.
- **Comparison mode** — runs all six on an identical map and plots
  **path cost against cells explored**, then recommends the best fit by a
  lexicographic rule: the optimal route first, and among optimal routes, the one
  that did the least work.
- **Editable grid** — paint walls, place terrain, move start and goal.
- **Maze generation** and preset scenarios for quick demos.
- **Live metrics** — path length, cost, and cells explored per run.

## Tools & technologies

| Area | Used |
|---|---|
| Framework | **React 18** (function components + hooks) |
| Build tool | **Vite 5** |
| Language | JavaScript (ESM) |
| Styling | SCSS → CSS |
| Algorithms | Dijkstra, A\*, BFS, DFS, greedy best-first, bidirectional search |
| Deploy | GitHub Pages via `gh-pages` |

## Getting started

```bash
npm install
npm run dev          # or: npm start
```

Then open **<http://localhost:3000>**.

> The port is pinned to `3000` in `vite.config.js` (Vite's own default is 5173).
> The dev server binds `0.0.0.0`, so you can also reach it from another device on
> the same network via your machine's LAN address.

## Build & preview

```bash
npm run build        # production build → dist/
npm run preview      # serve the built output locally
```

`vite.config.js` sets `base: './'`, so the build uses relative asset paths and
works from any sub-path — GitHub Pages, a subfolder, or opened from disk.

## Deploying

```bash
npm run build
npx gh-pages -d dist
```

`gh-pages` is already a dev dependency and `homepage` is set in `package.json`.
Note there's no `deploy` npm script — run the two commands above, or add one:

```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

## Project layout

```
src/
  App.jsx                app shell and routing
  main.jsx               entry point
  pages/home.jsx         main visualizer page
  components/
    algo.jsx             search algorithm implementations
    Dijkstra.jsx         Dijkstra / weighted search
    compare.jsx          comparison mode + scatter plot + recommendation
    control.jsx          toolbar: algorithm picker, speed, maze, reset
    cell.jsx             a single grid cell
    bubble.jsx           tooltips / callouts
    sta.jsx              run statistics panel
  img/                   terrain and marker sprites
  style/                 SCSS sources and compiled CSS
```

Algorithms, rendering, and state are kept separate: the search functions are
plain JavaScript over a grid and know nothing about React, which is what makes
the comparison mode possible — it just runs them all and collects the results.

## Reading the comparison chart

Each dot is one algorithm: **x = cells explored** (work done), **y = path cost**
(quality of the answer). Bottom-left is best — a shortest route found cheaply.
Algorithms that fail to reach the goal are listed separately rather than plotted,
since they have no cost to compare.
