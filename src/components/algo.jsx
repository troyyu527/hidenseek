import imgS from "../img/pain-point.png"
import imgG from "../img/finish-flag.png"
const delay = ms => new Promise(res => setTimeout(res, ms));

function resetSearchState(nodes) {
  nodes.forEach((node) => {
    node.visited = false;
    node.distFromStart = Infinity;
    node.previous = null;
    node.color = "darkgray";
  });
}

function heuristic(node, endNode) {
  return Math.abs(node.ox - endNode.ox) + Math.abs(node.oy - endNode.oy);
}

// Walk the `previous` chain back from the goal. A genuine route always traces
// all the way to the start node; if it doesn't, there is no path and we return
// an empty list so callers can report "no path found".
function reconstructPath(endNode, startNode) {
  const travelList = [];
  let current = endNode;
  while (current && current.previous) {
    travelList.unshift(current);
    current = current.previous;
  }
  if (current) travelList.unshift(current);
  if (travelList[0] !== startNode) return [];
  return travelList;
}

// Assign cumulative traversal cost along a finished path so the "distance"
// readout is meaningful even for algorithms that don't track cost while
// searching (Greedy, DFS, Bidirectional BFS).
function assignPathDistances(travelList) {
  let acc = 0;
  for (let i = 0; i < travelList.length; i++) {
    if (i > 0) acc += travelList[i].weight;
    travelList[i].distFromStart = i === 0 ? 0 : acc;
  }
}

// Rebuild a bidirectional route from the meeting node using the two parent
// maps: forward parents lead back to the start, backward parents lead on to
// the goal. The meeting node is included exactly once.
function reconstructBidirectional(meetNode, parentFromStart, parentFromGoal) {
  const path = [];
  let current = meetNode;
  while (current) {
    path.unshift(current);
    current = parentFromStart.get(current.name) || null;
  }
  current = parentFromGoal.get(meetNode.name) || null;
  while (current) {
    path.push(current);
    current = parentFromGoal.get(current.name) || null;
  }
  return path;
}

export function initialMap(dataModel, map) {
  let arr = [];
  let spacingX, spacingY;

  // If a fixed cell size is provided, keep cells that size and distribute remaining space
  // as gutters so the grid evenly fills the visual panel while keeping cells square.
  if (map.cellSize) {
    spacingX = map.cellSize;
    spacingY = map.cellSize;
    const cols = map.cols;
    const rows = map.rows;
    const totalCellsWidth = cols * spacingX;
    const totalCellsHeight = rows * spacingY;
    const extraX = Math.max(0, map.width - totalCellsWidth);
    const extraY = Math.max(0, map.height - totalCellsHeight);
    const gutterX = extraX / (cols + 1);
    const gutterY = extraY / (rows + 1);

    for (let i = 0; i < rows; i++) {
      let partialArr = [];
      for (let j = 0; j < cols; j++) {
        const moveX = gutterX + j * (spacingX + gutterX);
        const moveY = gutterY + i * (spacingY + gutterY);
        partialArr.push(`_${j}_${i}`);
        dataModel.addNode(`_${j}_${i}`, moveX, moveY, j, i);
      }
      arr.push(partialArr);
    }
  } else {
    let moveX = 0;
    let moveY = 0;
    spacingX = map.width / map.cols;
    spacingY = map.height / map.rows;

    for (let i = 0; i < map.rows; i++) {
      let partialArr = [];
      moveX = 0;
      for (let j = 0; j < map.cols; j++) {
        partialArr.push(`_${j}_${i}`);
        dataModel.addNode(`_${j}_${i}`, moveX, moveY, j, i);
        moveX += spacingX;
      }
      arr.push(partialArr);
      moveY += spacingY;
    }
  }

  for (let i = 0; i < arr.length; i++) {
    arr[i].reduce((accm, curr) => {
      dataModel.addLink(accm, curr);
      return curr;
    });
    if (i < arr.length - 1) {
      for (let j = 0; j < arr[i].length; j++) {
        dataModel.addLink(arr[i][j], arr[i + 1][j]);
      }
    }
  }

  return { spacingX, spacingY, arr };
}

export function initialSta(dataModel) {
  let startIndex = Math.floor(Math.random() * dataModel.nodes.length);
  let goalIndex = Math.floor(Math.random() * dataModel.nodes.length);
  let startNode = dataModel.nodes[startIndex];
  let goalNode = dataModel.nodes[goalIndex];
  let start = { name: "Start", node: startNode, x: startNode.x, y: startNode.y, preX: startNode.x, preY: startNode.y, ref: imgS };
  let goal = { name: "Goal", node: goalNode, x: goalNode.x, y: goalNode.y, preX: goalNode.x, preY: goalNode.y, ref: imgG };
  return [start, goal];
}

export async function Dijkstra(nodes, MH, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let travelList = [];
  let count = 0;

  MH.values = [];
  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
      startNode.visited = true;
    }
    if (node.name === end.node.name) endNode = node;
    if (node.state !== "wall") {
      MH.enqueue(node);
    }
  });

  if (pushInsight) pushInsight("Dijkstra begins by assigning zero cost to the start node and treating it as the first frontier point.");

  let currentNode = MH.dequeue();
  while (currentNode) {
    if (currentNode === endNode) break;
    currentNode.visited = true;
    currentNode.neighbor.forEach((neighborNode) => {
      if (!neighborNode.visited && neighborNode.state !== "wall") {
        const tentativeDist = currentNode.distFromStart + neighborNode.weight;
        if (tentativeDist < neighborNode.distFromStart) {
          neighborNode.distFromStart = tentativeDist;
          neighborNode.previous = currentNode;
          MH.enqueue(neighborNode);
        }
      }
    });

    count += 1;
    if (count % 4 === 0) {
      // Narrate in lockstep with the bubble frame: describe the node that was
      // just expanded (and now shows a bubble).
      if (pushInsight) pushInsight(`Expanding ${currentNode.name} with cumulative cost ${currentNode.distFromStart}.`);
      setGrid([...nodes]);
      if (animate) await delay(40);
    }

    currentNode = MH.dequeue();
  }

  travelList = reconstructPath(endNode, startNode);
  assignPathDistances(travelList);
  return [travelList, nodes];
}

export async function BFS(nodes, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let travelList = [];
  let queue = [];
  // Dedup queued nodes separately from `visited` so `visited` stays reserved
  // for nodes actually expanded — this keeps the bubble animation meaning the
  // same thing across every algorithm.
  let enqueued = new Set();
  let count = 0;

  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
    }
    if (node.name === end.node.name) endNode = node;
  });

  if (pushInsight) pushInsight("BFS explores one layer at a time, so every node gets checked before moving deeper.");

  queue.push(startNode);
  enqueued.add(startNode.name);
  let currentNode = queue.shift();

  while (currentNode) {
    if (currentNode === endNode) break;
    currentNode.visited = true;
    currentNode.neighbor.forEach((neighborNode) => {
      if (!enqueued.has(neighborNode.name) && neighborNode.state !== "wall") {
        neighborNode.distFromStart = currentNode.distFromStart + 1;
        neighborNode.previous = currentNode;
        enqueued.add(neighborNode.name);
        queue.push(neighborNode);
      }
    });

    count += 1;
    if (count % 4 === 0) {
      // Narrate in lockstep with the bubble frame.
      if (pushInsight) pushInsight(`Expanding ${currentNode.name} at distance ${currentNode.distFromStart} from the start.`);
      setGrid([...nodes]);
      if (animate) await delay(40);
    }

    currentNode = queue.shift();
  }

  // Report the true traversal cost of the route BFS drew (BFS optimizes hops,
  // not weight, so on sand maps this is >= the cost-optimal Dijkstra/A* result).
  travelList = reconstructPath(endNode, startNode);
  assignPathDistances(travelList);
  return [travelList, nodes];
}

export async function AStar(nodes, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let travelList = [];
  let openSet = [];

  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
      startNode.fScore = heuristic(node, end.node);
    }
    if (node.name === end.node.name) endNode = node;
  });

  if (pushInsight) pushInsight("A* blends distance traveled with a heuristic estimate to goal, so it often reaches the answer faster.");

  openSet.push(startNode);
  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.fScore || 0) - (b.fScore || 0));
    const currentNode = openSet.shift();
    if (!currentNode || currentNode.state === "wall") continue;
    if (currentNode === endNode) break;
    currentNode.visited = true;
    if (pushInsight) pushInsight(`Expanding ${currentNode.name} with estimated total cost ${currentNode.fScore}.`);
    currentNode.neighbor.forEach((neighborNode) => {
      if (neighborNode.state === "wall" || neighborNode.visited) return;
      const tentativeG = currentNode.distFromStart + neighborNode.weight;
      if (tentativeG < neighborNode.distFromStart) {
        neighborNode.distFromStart = tentativeG;
        neighborNode.previous = currentNode;
        neighborNode.fScore = tentativeG + heuristic(neighborNode, endNode);
        if (!openSet.includes(neighborNode)) {
          openSet.push(neighborNode);
        }
      }
    });

    if (animate) setGrid([...nodes]);
    if (animate) await delay(40);
  }

  travelList = reconstructPath(endNode, startNode);
  assignPathDistances(travelList);
  return [travelList, nodes];
}

export async function GreedyBestFirst(nodes, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let travelList = [];
  let frontier = [];

  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
    }
    if (node.name === end.node.name) endNode = node;
  });

  if (pushInsight) pushInsight("Greedy Best-First follows the heuristic aggressively, choosing the node that looks closest to the goal.");

  frontier.push(startNode);
  while (frontier.length > 0) {
    frontier.sort((a, b) => heuristic(a, endNode) - heuristic(b, endNode));
    const currentNode = frontier.shift();
    if (!currentNode || currentNode.state === "wall") continue;
    if (currentNode === endNode) break;
    currentNode.visited = true;
    if (pushInsight) pushInsight(`Greedy choice: expanding ${currentNode.name} because it has the best heuristic value.`);
    currentNode.neighbor.forEach((neighborNode) => {
      if (neighborNode.state === "wall" || neighborNode.visited) return;
      // Greedy only cares about first discovery; the parent that reached a node
      // first defines its route back to the start.
      if (!neighborNode.previous) {
        neighborNode.previous = currentNode;
        frontier.push(neighborNode);
      }
    });

    if (animate) setGrid([...nodes]);
    if (animate) await delay(40);
  }

  travelList = reconstructPath(endNode, startNode);
  assignPathDistances(travelList);
  return [travelList, nodes];
}

export async function BidirectionalBFS(nodes, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let queueStart = [];
  let queueGoal = [];
  let visitedFromStart = new Set();
  let visitedFromGoal = new Set();
  let parentFromStart = new Map();
  let parentFromGoal = new Map();

  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
      visitedFromStart.add(node.name);
      parentFromStart.set(node.name, null);
    }
    if (node.name === end.node.name) {
      endNode = node;
      visitedFromGoal.add(node.name);
      parentFromGoal.set(node.name, null);
    }
  });

  if (pushInsight) pushInsight("Bidirectional BFS searches outward from both the start and goal, then meets in the middle.");

  // Start and goal are the same cell.
  if (startNode === endNode) {
    const travelList = [startNode];
    assignPathDistances(travelList);
    return [travelList, nodes];
  }

  // Build the full route once the frontiers touch, then stop searching.
  const finish = (meetNode) => {
    if (pushInsight) pushInsight(`The two searches meet at ${meetNode.name}.`);
    const travelList = reconstructBidirectional(meetNode, parentFromStart, parentFromGoal);
    assignPathDistances(travelList);
    if (animate) setGrid([...nodes]);
    return [travelList, nodes];
  };

  queueStart.push(startNode);
  queueGoal.push(endNode);

  while (queueStart.length > 0 && queueGoal.length > 0) {
    const currentStart = queueStart.shift();
    if (currentStart && currentStart.state !== "wall") {
      currentStart.visited = true;
      if (pushInsight) pushInsight(`Forward frontier expands ${currentStart.name} from the start side.`);
      for (const neighborNode of currentStart.neighbor) {
        if (neighborNode.state === "wall" || visitedFromStart.has(neighborNode.name)) continue;
        visitedFromStart.add(neighborNode.name);
        parentFromStart.set(neighborNode.name, currentStart);
        queueStart.push(neighborNode);
        if (visitedFromGoal.has(neighborNode.name)) return finish(neighborNode);
      }
    }

    const currentGoal = queueGoal.shift();
    if (currentGoal && currentGoal.state !== "wall") {
      currentGoal.visited = true;
      if (pushInsight) pushInsight(`Backward frontier expands ${currentGoal.name} from the goal side.`);
      for (const neighborNode of currentGoal.neighbor) {
        if (neighborNode.state === "wall" || visitedFromGoal.has(neighborNode.name)) continue;
        visitedFromGoal.add(neighborNode.name);
        parentFromGoal.set(neighborNode.name, currentGoal);
        queueGoal.push(neighborNode);
        if (visitedFromStart.has(neighborNode.name)) return finish(neighborNode);
      }
    }

    if (animate) setGrid([...nodes]);
    if (animate) await delay(40);
  }

  return [[], nodes];
}

export async function DFS(nodes, start, end, setGrid, pushInsight, opts = {}) {
  const animate = opts.animate !== false;
  let startNode, endNode;
  let travelList = [];
  let stack = [];

  resetSearchState(nodes);
  nodes.forEach((node) => {
    if (node.name === start.node.name) {
      startNode = node;
      startNode.distFromStart = 0;
    }
    if (node.name === end.node.name) endNode = node;
  });

  if (pushInsight) pushInsight("DFS goes deep first, pushing one branch as far as it can and then backtracking when needed.");

  stack.push(startNode);
  while (stack.length > 0) {
    const currentNode = stack.pop();
    // A node can be pushed more than once before it is expanded; skip walls and
    // any node already expanded.
    if (!currentNode || currentNode.state === "wall" || currentNode.visited) continue;
    if (currentNode === endNode) break;
    currentNode.visited = true;
    if (pushInsight) pushInsight(`Exploring ${currentNode.name} and following one branch before backtracking.`);
    currentNode.neighbor.slice().reverse().forEach((neighborNode) => {
      if (neighborNode.state === "wall" || neighborNode.visited) return;
      // Keep the first parent that reaches a node so the route stays a valid tree.
      if (!neighborNode.previous) neighborNode.previous = currentNode;
      stack.push(neighborNode);
    });

    if (animate) setGrid([...nodes]);
    if (animate) await delay(40);
  }

  travelList = reconstructPath(endNode, startNode);
  assignPathDistances(travelList);
  return [travelList, nodes];
}

export async function shortestPath(result, setGrid, distRef) {
  let travelList = result[0];
  let nodes = result[1];
  let length = travelList.length;
  if (length) {
    let distance = travelList[length - 1].distFromStart;
    nodes.forEach((node) => {
      node.visited = false;
      node.distFromStart = Infinity;
      node.previous = null;
    });
    for (let node of travelList) {
      node.color = "green";
      setGrid([...nodes]);
      await delay(5);
    }

    distRef.current.textContent = distance;
  } else {
    nodes.forEach((node) => {
      node.visited = false;
      node.distFromStart = Infinity;
      node.previous = null;
    });
    setGrid([...nodes]);
    distRef.current.textContent = "Unknown";
  }
}

export function genMaze(nameGrid, grid, stations, map, setGrid, complexity = 2) {
  // Reset node search/visual state and set all cells to wall initially
  grid.forEach((node) => {
    node.isVisit = false;
    node.visited = false;
    node.distFromStart = Infinity;
    node.previous = null;
    node.color = "darkgray";
    node.weight = 1;
    node.state = "wall";
  });

  // Helper to index into flat grid by (x,y)
  function findCell(x, y) {
    if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) return null;
    const order = x + y * map.cols;
    return grid[order];
  }

  // Start carving from the first odd cell inside the border
  const startX = 1;
  const startY = 1;
  const startCell = findCell(startX, startY);
  if (!startCell) {
    // Grid too small to carve; ensure borders are walls and exit
    setGrid([...grid]);
    return grid;
  }

  // Mark passage cells at odd coordinates and use a stack for randomized DFS (recursive backtracker)
  const stack = [];
  startCell.state = "regular";
  startCell.isVisit = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const cx = current.ox;
    const cy = current.oy;
    const neighbors = [];

    // Directions: up, down, left, right (step by 2)
    const deltas = [
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 }
    ];

    for (const d of deltas) {
      const nx = cx + d.dx;
      const ny = cy + d.dy;
      const neighbor = findCell(nx, ny);
      if (neighbor && !neighbor.isVisit) neighbors.push({ cell: neighbor, nx, ny, dx: d.dx, dy: d.dy });
    }

    if (neighbors.length > 0) {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      const betweenX = cx + pick.dx / 2;
      const betweenY = cy + pick.dy / 2;
      const between = findCell(betweenX, betweenY);
      // Carve passage: mark neighbor and the between cell as regular
      if (between) between.state = "regular";
      pick.cell.state = "regular";
      pick.cell.isVisit = true;
      stack.push(pick.cell);
    } else {
      stack.pop();
    }
  }

  // Ensure outer borders are walls (in case carving touched them)
  for (let x = 0; x < map.cols; x++) {
    const top = findCell(x, 0);
    const bottom = findCell(x, map.rows - 1);
    if (top) top.state = "wall";
    if (bottom) bottom.state = "wall";
  }
  for (let y = 0; y < map.rows; y++) {
    const left = findCell(0, y);
    const right = findCell(map.cols - 1, y);
    if (left) left.state = "wall";
    if (right) right.state = "wall";
  }

  const level = Math.max(1, Math.min(3, Math.round(complexity)));
  if (level === 1) {
    // Easier maze: open more passages to make the space less constrained.
    const walls = grid.filter((node) => node.state === "wall" && node.ox > 0 && node.oy > 0 && node.ox < map.cols - 1 && node.oy < map.rows - 1);
    const openCount = Math.floor(walls.length * 0.35);
    for (let i = 0; i < openCount; i++) {
      const candidate = walls[Math.floor(Math.random() * walls.length)];
      if (!candidate) continue;
      if (stations && (candidate.name === stations[0].node.name || candidate.name === stations[1].node.name)) continue;
      candidate.state = "regular";
      candidate.weight = 1;
    }
  } else if (level === 2) {
    // Standard maze: leave the DFS-generated maze as-is.
  } else if (level === 3) {
    // Harder maze: add extra bottleneck bands and wall clusters.
    const extraBands = 2 + Math.floor(Math.random() * 2);
    const bandThickness = 1 + Math.floor(Math.random() * 2);
    for (let b = 0; b < extraBands; b++) {
      const horizontal = Math.random() < 0.5;
      const bandPos = horizontal
        ? 2 + Math.floor(Math.random() * Math.max(1, map.rows - 4))
        : 2 + Math.floor(Math.random() * Math.max(1, map.cols - 4));
      const gapCenter = horizontal
        ? 1 + Math.floor(Math.random() * Math.max(1, map.cols - 3))
        : 1 + Math.floor(Math.random() * Math.max(1, map.rows - 3));
      const gapWidth = 1;
      for (let t = 0; t < bandThickness; t++) {
        for (let i = 1; i < (horizontal ? map.cols : map.rows) - 1; i++) {
          if (i >= gapCenter && i < gapCenter + gapWidth) continue;
          const ox = horizontal ? i : bandPos + t;
          const oy = horizontal ? bandPos + t : i;
          const node = findCell(ox, oy);
          if (!node) continue;
          if (stations && (node.name === stations[0].node.name || node.name === stations[1].node.name)) continue;
          node.state = "wall";
          node.weight = Infinity;
        }
      }
    }

    // Add a small cluster of walls in the interior to create tighter choke points.
    const clusterCount = 3;
    for (let c = 0; c < clusterCount; c++) {
      const centerX = 2 + Math.floor(Math.random() * Math.max(1, map.cols - 4));
      const centerY = 2 + Math.floor(Math.random() * Math.max(1, map.rows - 4));
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const node = findCell(centerX + dx, centerY + dy);
          if (!node) continue;
          if (stations && (node.name === stations[0].node.name || node.name === stations[1].node.name)) continue;
          if (node.ox === 0 || node.oy === 0 || node.ox === map.cols - 1 || node.oy === map.rows - 1) continue;
          node.state = "wall";
          node.weight = Infinity;
        }
      }
    }
  }

  // Collect empty cells (passages) and place start/goal
  const emptyCells = grid.filter((node) => node.state === "regular");
  if (emptyCells.length >= 2) {
    // Build connected components among passage cells to ensure Start and Goal are connected
    const nodeIndex = new Map();
    emptyCells.forEach((n, i) => nodeIndex.set(n.name, i));
    const adj = new Array(emptyCells.length).fill(0).map(() => []);
    const dirs = [ {dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1} ];
    for (let i = 0; i < emptyCells.length; i++) {
      const n = emptyCells[i];
      for (const d of dirs) {
        const nx = n.ox + d.dx;
        const ny = n.oy + d.dy;
        const neighbor = findCell(nx, ny);
        if (neighbor && neighbor.state === "regular") {
          const j = nodeIndex.get(neighbor.name);
          if (j !== undefined) adj[i].push(j);
        }
      }
    }

    // Find largest connected component via BFS
    const seen = new Array(emptyCells.length).fill(false);
    let largestComp = [];
    for (let i = 0; i < emptyCells.length; i++) {
      if (seen[i]) continue;
      const comp = [];
      const q = [i];
      seen[i] = true;
      while (q.length) {
        const u = q.shift();
        comp.push(u);
        for (const v of adj[u]) {
          if (!seen[v]) {
            seen[v] = true;
            q.push(v);
          }
        }
      }
      if (comp.length > largestComp.length) largestComp = comp;
    }

    if (largestComp.length >= 2) {
      // pick two distinct random nodes from largest component
      const pickIndex = Math.floor(Math.random() * largestComp.length);
      let pickIndex2 = Math.floor(Math.random() * largestComp.length);
      if (pickIndex2 === pickIndex) pickIndex2 = (pickIndex2 + 1) % largestComp.length;
      const newStart = emptyCells[largestComp[pickIndex]];
      const newGoal = emptyCells[largestComp[pickIndex2]];
      applyStation("Start", newStart);
      applyStation("Goal", newGoal);
    } else {
      // fallback: choose any two distinct passage cells
      const startIndex = Math.floor(Math.random() * emptyCells.length);
      let goalIndex = Math.floor(Math.random() * (emptyCells.length - 1));
      if (goalIndex >= startIndex) goalIndex += 1;
      applyStation("Start", emptyCells[startIndex]);
      applyStation("Goal", emptyCells[goalIndex]);
    }
  }

  function applyStation(name, newNode) {
    let index = null;
    if (name === "Start") {
      index = 0;
    } else if (name === "Goal") {
      index = 1;
    }
    stations[index].node = newNode;
    stations[index].x = newNode.x;
    stations[index].y = newNode.y;
    stations[index].preX = newNode.x;
    stations[index].preY = newNode.y;
  }

  setGrid([...grid]);
  return grid;
}
