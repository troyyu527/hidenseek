import React, { useEffect, useRef, useState } from "react";
import Panel from "../components/control";
import Cell from "../components/cell";
import Sta from "../components/sta";
import Bubble from "../components/bubble";
import CompareChart from "../components/compare";
import { Graph, MinHeap } from "../components/Dijkstra";
import { initialMap, initialSta, Dijkstra, BFS, AStar, GreedyBestFirst, BidirectionalBFS, DFS, shortestPath, genMaze } from "../components/algo";

const map = {};
map.width = 980;
// Height chosen so the grid is 31 rows of 25px cells (31 * 25 = 775), while the
// 980px width keeps the column count at 39 (floor(980 / 25)). Cells stay square.
map.height = 775;
// Increase cell size by 1.25× while keeping cells square.
// Previous effective cell size: ~20px, so target ~25px (1.25×)
const targetCellSize = 25; // pixels
// Use the white background size as the maze area and keep the visual cell size constant.
// Compute the number of rows and cols by dividing the white panel dimensions by the fixed cell size.
// compute how many cells fit in each dimension given the fixed cell size
const rowsByHeight = Math.max(3, Math.floor(map.height / targetCellSize));
const colsByWidth = Math.max(3, Math.floor(map.width / targetCellSize));
// Use the maximum number of rows and cols that fit; we'll distribute extra space as gutters
map.rows = rowsByHeight;
map.cols = colsByWidth;
// cell size (square) is the target size
const _cellSize = targetCellSize;

const dataModel = new Graph();
const MH = new MinHeap();
// Build the map using the visible white background (`map`) with a fixed `cellSize` so
// cells are square and any leftover space is distributed evenly as gutters.
map.cellSize = targetCellSize;
const cellSize = initialMap(dataModel, map);
const stations = initialSta(dataModel);
const nameGrid = cellSize.arr;

function Page() {
  const distRef = useRef(null);
  const insightsRef = useRef(null);
  const [grid, setGrid] = useState(dataModel.nodes);
  const [algorithm, setAlgorithm] = useState("Dijkstra");
  const [status, setStatus] = useState("A polished personal project for exploring route-planning behavior in a changing map.");
  const [stats, setStats] = useState({ distance: "Unknown", visited: 0, pathLength: 0 });
  const [insights, setInsights] = useState([]);
  const [algoInfo, setAlgoInfo] = useState(getAlgoInfo("Dijkstra"));
  const [complexity, setComplexity] = useState(2);
  // While an algorithm is running (and until the green path is drawn) the map is
  // locked: terrain, Start and Goal cannot be changed.
  const [isRunning, setIsRunning] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  function getAlgoInfo(name) {
    const infoMap = {
      Dijkstra: {
        title: "Dijkstra",
        summary: "Guarantees the shortest path in weighted graphs by expanding the lowest-cost frontier first.",
        pros: ["Optimal for weighted maps", "Reliable and easy to reason about"],
        cons: ["Can explore more nodes than faster heuristics", "Slower on large grids"],
        scenes: ["Weighted terrain", "When correctness matters most"]
      },
      BFS: {
        title: "Breadth-First Search",
        summary: "Explores level by level, making it ideal for unweighted grids where the first found path is shortest.",
        pros: ["Simple and intuitive", "Finds shortest paths in unweighted maps"],
        cons: ["Less efficient on weighted terrain", "Can expand a lot of nodes"],
        scenes: ["Uniform-cost movement", "Clear grid-based navigation"]
      },
      AStar: {
        title: "A*",
        summary: "Uses cost-so-far plus a heuristic to goal, making it one of the fastest practical choices.",
        pros: ["Fast on grids", "Often finds shortest paths efficiently"],
        cons: ["Depends on a good heuristic", "Can be less predictable on weird maps"],
        scenes: ["Game maps", "Navigation with strong directional hints"]
      },
      GreedyBestFirst: {
        title: "Greedy Best-First",
        summary: "Chooses the node that looks closest to the goal, which makes it quick but not always optimal.",
        pros: ["Very fast in practice", "Works well when the heuristic is strong"],
        cons: ["Not guaranteed to return the shortest path", "Can get trapped by poor choices"],
        scenes: ["Fast approximate planning", "When speed matters more than perfect optimality"]
      },
      BidirectionalBFS: {
        title: "Bidirectional BFS",
        summary: "Searches from both the start and the goal, meeting in the middle to reduce work.",
        pros: ["Often faster than standard BFS", "Good for large unweighted spaces"],
        cons: ["More bookkeeping", "Best suited to unweighted problems"],
        scenes: ["Large maps", "When you want a quicker BFS-style search"]
      },
      DFS: {
        title: "Depth-First Search",
        summary: "Dives deeply into one branch before backtracking, which makes it simple but not shortest-path focused.",
        pros: ["Very lightweight", "Easy to implement and explain"],
        cons: ["Does not guarantee shortest paths", "Can wander far from the goal"],
        scenes: ["Maze exploration", "Small search spaces"]
      }
    };
    return infoMap[name] || infoMap.Dijkstra;
  }

  useEffect(() => {
    if (insightsRef.current) {
      insightsRef.current.scrollTop = insightsRef.current.scrollHeight;
    }
  }, [insights]);

  const pushInsight = (message) => {
    setInsights((prev) => [...prev, message]);
  };

  const selectAlgorithm = (value) => {
    setAlgorithm(value);
    setAlgoInfo(getAlgoInfo(value));
    setInsights([]);
  };

  const run = async () => {
    if (isRunning) return;
    const svg = document.querySelector("svg");

    setIsRunning(true);
    setInsights([]);
    svg.setAttribute("pointer-events", "none");
    setStatus(`Running ${algorithm} across the grid...`);

    try {
      let result;
      if (algorithm === "BFS") {
        result = await BFS(grid, stations[0], stations[1], setGrid, pushInsight);
      } else if (algorithm === "AStar") {
        result = await AStar(grid, stations[0], stations[1], setGrid, pushInsight);
      } else if (algorithm === "GreedyBestFirst") {
        result = await GreedyBestFirst(grid, stations[0], stations[1], setGrid, pushInsight);
      } else if (algorithm === "BidirectionalBFS") {
        result = await BidirectionalBFS(grid, stations[0], stations[1], setGrid, pushInsight);
      } else if (algorithm === "DFS") {
        result = await DFS(grid, stations[0], stations[1], setGrid, pushInsight);
      } else {
        result = await Dijkstra(grid, MH, stations[0], stations[1], setGrid, pushInsight);
      }

      const path = result[0];
      const visitedCount = result[1].filter((node) => node.visited).length;
      // distance = total traversal cost of the route (sand counts as 3);
      // steps = number of moves = edges = one less than the node count.
      const distance = path.length ? path[path.length - 1].distFromStart : "Unknown";
      const steps = path.length ? path.length - 1 : 0;
      setStats({ distance, visited: visitedCount, pathLength: steps });

      await shortestPath(result, setGrid, distRef);
      setStatus(path.length ? `${algorithm} found a route in ${steps} steps.` : `${algorithm} could not find a path.`);
    } finally {
      // Always unlock, even if the search throws, so the UI can never get stuck.
      svg.setAttribute("pointer-events", "auto");
      setIsRunning(false);
    }
  };

  const compareAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus("Comparing all algorithms on the current map...");
    try {
      const noop = () => {};
      const opts = { animate: false };
      const defs = [
        ["Dijkstra", () => Dijkstra(grid, MH, stations[0], stations[1], noop, noop, opts)],
        ["BFS", () => BFS(grid, stations[0], stations[1], noop, noop, opts)],
        ["A*", () => AStar(grid, stations[0], stations[1], noop, noop, opts)],
        ["Greedy", () => GreedyBestFirst(grid, stations[0], stations[1], noop, noop, opts)],
        ["Bidirectional", () => BidirectionalBFS(grid, stations[0], stations[1], noop, noop, opts)],
        ["DFS", () => DFS(grid, stations[0], stations[1], noop, noop, opts)]
      ];

      const rows = [];
      for (const [name, fn] of defs) {
        const res = await fn();
        const path = res[0];
        const found = path.length > 0;
        rows.push({
          name,
          found,
          cost: found ? path[path.length - 1].distFromStart : null,
          steps: found ? path.length - 1 : null,
          // Snapshot the explored count before the next run's reset clears it.
          cells: res[1].filter((node) => node.visited).length
        });
      }

      // The silent runs left search state on the shared grid; clear it so the map
      // shows no stray bubbles or path colors.
      grid.forEach((node) => {
        node.visited = false;
        node.distFromStart = Infinity;
        node.previous = null;
        node.color = "darkgray";
      });
      setGrid([...grid]);
      setComparison(rows);
      setShowCompare(true);
      setStatus("Comparison ready. Lowest cost = the true shortest route (Dijkstra & A*); among those, A* reaches it exploring far fewer cells than Dijkstra.");
    } finally {
      setIsRunning(false);
    }
  };

  // The floating tab: recompute+open if there's nothing yet, otherwise just toggle.
  const toggleCompare = () => {
    if (isRunning) return;
    if (!comparison) {
      compareAll();
    } else {
      setShowCompare((s) => !s);
    }
  };

  const cellClick = (e) => {
    if (isRunning) return;
    const nodeName = e.currentTarget.getAttribute("class");
    const obs = document.querySelector("#obstacle option:checked");
    const action = obs.getAttribute("class");
    const newGrid = [...grid];
    let newNode;
    newGrid.forEach((n) => {
      if (n.name === nodeName) newNode = n;
    });
    if (action === "wall") {
      if (newNode.state === "sand" || newNode.state === "regular") {
        newNode.state = "wall";
        newNode.weight = Infinity;
      } else if (newNode.state === "wall") {
        newNode.state = "regular";
        newNode.weight = 1;
      }
    } else if (action === "sand") {
      if (newNode.state === "wall" || newNode.state === "regular") {
        newNode.state = "sand";
        newNode.weight = 3;
      } else if (newNode.state === "sand") {
        newNode.state = "regular";
        newNode.weight = 1;
      }
    }
    newNode.color = "darkgray";
    setComparison(null);
    setGrid(newGrid);
    setStatus("Terrain updated. Run the simulation to compare the new route.");
  };

  const applyPreset = (preset) => {
    if (isRunning) return;
    setComparison(null);
    const nextGrid = [...grid];
    // Reset search/visual state and clear interior terrain so preset recreates from scratch
    nextGrid.forEach((node) => {
      node.visited = false;
      node.distFromStart = Infinity;
      node.previous = null;
      node.color = "darkgray";
      // preserve borders and stations
      if (node.ox === 0 || node.oy === 0 || node.ox === map.cols - 1 || node.oy === map.rows - 1) return;
      if (stations && (node.name === stations[0].node.name || node.name === stations[1].node.name)) return;
      node.state = "regular";
      node.weight = 1;
    });

    // Complexity: 1 (low), 2 (medium), 3 (high)
    const level = Math.max(1, Math.min(3, Math.round(complexity)));

    if (preset === "bottleneck") {
      const lines = level; // number of bottleneck bands
      const thickness = 1 + Math.floor((level - 1) / 1); // 1..3
      const openingWidth = Math.max(1, 3 - (level - 1)); // 1..3, higher level narrower
      for (let L = 0; L < lines; L++) {
        const horizontal = Math.random() < 0.5;
        const mid = horizontal ? Math.floor(Math.random() * (map.rows - 4)) + 2 : Math.floor(Math.random() * (map.cols - 4)) + 2;
        const pos = mid;
        const gapCenter = horizontal ? (Math.floor(Math.random() * (map.cols - 2)) + 1) : (Math.floor(Math.random() * (map.rows - 2)) + 1);
        for (let t = 0; t < thickness; t++) {
          for (let i = 1; i < (horizontal ? map.cols : map.rows) - 1; i++) {
            const gapStart = gapCenter - Math.floor(openingWidth / 2);
            const gapEnd = gapCenter + Math.floor(openingWidth / 2);
            let ox, oy;
            if (horizontal) {
              ox = i;
              oy = pos + t;
            } else {
              ox = pos + t;
              oy = i;
            }
            if (ox <= 0 || oy <= 0 || ox >= map.cols - 1 || oy >= map.rows - 1) continue;
            if (i >= gapStart && i <= gapEnd) continue;
            const node = nextGrid.find((n) => n.ox === ox && n.oy === oy);
            if (!node) continue;
            if (stations && (node.name === stations[0].node.name || node.name === stations[1].node.name)) continue;
            node.state = "wall";
            node.weight = Infinity;
          }
        }
      }
      setStatus("Randomized bottleneck corridor created.");
    } else if (preset === "open") {
      // obstacles based on complexity
      const density = 0.06 + (level - 1) * 0.2; // 0.06, 0.26, 0.46
      const sandChance = Math.max(0, Math.min(0.2, density * 0.2));
      nextGrid.forEach((node) => {
        if (node.ox === 0 || node.oy === 0 || node.ox === map.cols - 1 || node.oy === map.rows - 1) return;
        if (stations && (node.name === stations[0].node.name || node.name === stations[1].node.name)) return;
        const r = Math.random();
        if (r < density) {
          node.state = "wall";
          node.weight = Infinity;
        } else if (r < density + sandChance) {
          node.state = "sand";
          node.weight = 3;
        } else {
          node.state = "regular";
          node.weight = 1;
        }
      });
      setStatus(level >= 3 ? "Dense obstacles placed across the map." : "Sparse obstacles placed across the map.");
    }

    setGrid([...nextGrid]);
  };

  const randMaze = async () => {
    if (isRunning) return;
    setComparison(null);
    const nextGrid = genMaze(nameGrid, [...grid], stations, map, setGrid, complexity);
    setGrid([...nextGrid]);
    setStatus(`Random maze generated at complexity level ${complexity}.`);
  };

  const reset = () => {
    if (isRunning) return;
    setComparison(null);
    const nextGrid = [...grid];
    nextGrid.forEach((n) => {
      n.visited = false;
      n.distFromStart = Infinity;
      n.previous = null;
      n.color = "darkgray";
      n.weight = 1;
      n.state = "regular";
    });
    setGrid([...nextGrid]);
    if (distRef.current) distRef.current.textContent = "Unknown";
    setStats({ distance: "Unknown", visited: 0, pathLength: 0 });
    setStatus("Map reset. Design a new scenario and run the simulator.");
  };

  return (
    <div className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Interactive pathfinding experience</p>
          <h1>Hide & Seek</h1>
          <p className="hero-text">
            This personal project turns graph search into an interactive study: place obstacles, generate mazes,
            and watch Dijkstra or BFS navigate the map in real time.
          </p>
          <ul className="feature-list">
            <li>Dynamic terrain and obstacle placement</li>
            <li>Live visualization of visited nodes and route discovery</li>
            <li>A clean way to compare how different algorithms respond to the same space</li>
          </ul>
        </div>

        <div className="hero-card">
          <h2>A focused exploration space</h2>
          <p>Explore how pathfinding strategies behave under changing terrain and constraints.</p>
          <div className="metric-grid">
            <div className="metric">
              <span>Algorithm</span>
              <strong>{algorithm}</strong>
            </div>
            <div className="metric">
              <span>Route Cost</span>
              <strong ref={distRef}>Unknown</strong>
            </div>
            <div className="metric">
              <span>Path Steps</span>
              <strong>{stats.pathLength}</strong>
            </div>
            <div className="metric">
              <span>Visited Cells</span>
              <strong>{stats.visited}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-grid">
        <div className="maze-panel">
          <div className="maze">
            <main>
              <svg viewBox={`0 0 ${map.width} ${map.height}`} preserveAspectRatio="xMidYMid meet">
                <g className="map">
                  <g className="terrain">
                    {grid.map((node) => <Cell key={node.name} node={node} cellSize={cellSize} cellClick={cellClick} locked={isRunning} />)}
                  </g>
                  <g className="post">
                    {stations.map((sta) => (
                      <Sta key={sta.name} station={sta} map={map} cellSize={cellSize} nodesArr={grid} locked={isRunning} onLayoutChange={() => setComparison(null)} />
                    ))}
                  </g>
                  <g className="visited">
                    {grid.map((node) => {
                      const nodeName = node.name;
                      if (node.visited && nodeName !== stations[0].node.name) {
                        return <Bubble key={node.name} node={node} cellSize={cellSize}></Bubble>;
                      }
                      return null;
                    })}
                  </g>
                </g>
              </svg>
            </main>
          </div>
        </div>

        <div className="side-panel-stack">
          <Panel
            run={run}
            randMaze={randMaze}
            reset={reset}
            applyPreset={applyPreset}
            compareAll={compareAll}
            algorithm={algorithm}
            setAlgorithm={selectAlgorithm}
            status={status}
            complexity={complexity}
            setComplexity={setComplexity}
            isRunning={isRunning}
          />

          <section className="learning-panel">
            <div className="learning-card">
              <h3>{algoInfo.title}</h3>
              <p>{algoInfo.summary}</p>
              <div className="learning-lists">
                <div>
                  <h4>Pros</h4>
                  <ul>{algoInfo.pros.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h4>Cons</h4>
                  <ul>{algoInfo.cons.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h4>Best suited for</h4>
                  <ul>{algoInfo.scenes.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="learning-card">
              <h3>How it thinks step by step</h3>
              <ol className="insight-list" ref={insightsRef}>
                {insights.length > 0 ? insights.map((item, index) => <li key={`${item}-${index}`}>{item}</li>) : <li>Select an algorithm and press run to see its reasoning unfold.</li>}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {/* Floating tab to open/close the comparison drawer (hidden while the drawer is open). */}
      <button
        className={`compare-tab${showCompare ? " hidden" : ""}`}
        onClick={toggleCompare}
        disabled={isRunning}
        aria-label="Show algorithm comparison"
        title="Compare algorithms"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" />
          <rect x="10" y="7" width="4" height="13" rx="1" fill="currentColor" />
          <rect x="17" y="3" width="4" height="17" rx="1" fill="currentColor" />
        </svg>
        <span className="compare-tab-label">Compare</span>
      </button>

      {/* Slide-out comparison drawer, overlaid on top of the right-hand panels. */}
      <aside className={`compare-drawer${showCompare ? " open" : ""}`} aria-hidden={!showCompare}>
        <div className="compare-drawer-head">
          <span>Algorithm comparison</span>
          <button className="compare-close" onClick={() => setShowCompare(false)} aria-label="Close comparison">✕</button>
        </div>
        <div className="compare-drawer-body">
          {comparison
            ? <CompareChart rows={comparison} />
            : <p className="compare-empty">Press “Compare All” to rank every algorithm on the current map.</p>}
        </div>
      </aside>
    </div>
  );
}

export default Page;
