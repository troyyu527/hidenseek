import React from "react";

function Panel({ run, randMaze, reset, applyPreset, compareAll, algorithm, setAlgorithm, status, complexity, setComplexity, isRunning }) {
  return (
    <div className="control-panel">
      <div className="control-stack">
        <div className="button-row compact-row">
          <button className="panel-button primary" onClick={run} disabled={isRunning}>Run {algorithm}</button>
          <button className="panel-button secondary" onClick={compareAll} disabled={isRunning}>Compare All</button>
          <button className="panel-button ghost" onClick={reset} disabled={isRunning}>Reset</button>
        </div>

        <div className="control-grid compact-grid">
          <div className="select-group">
            <label htmlFor="algorithm">Algorithm</label>
            <select className="control-select" id="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} disabled={isRunning}>
              <option value="Dijkstra">Dijkstra</option>
              <option value="BFS">Breadth-First Search</option>
              <option value="AStar">A*</option>
              <option value="GreedyBestFirst">Greedy Best-First</option>
              <option value="BidirectionalBFS">Bidirectional BFS</option>
              <option value="DFS">Depth-First Search</option>
            </select>
          </div>

          <div className="select-group">
            <label htmlFor="obstacle">Terrain Tool</label>
            <select className="control-select obstacle" id="obstacle" defaultValue="wall" disabled={isRunning}>
              <option className="sand" value="sand">Sand (-3)</option>
              <option className="wall" value="wall">Wall (X)</option>
            </select>
          </div>
        </div>

        <div className="preset-row compact-row">
          <button className="panel-button preset" onClick={() => applyPreset("open")} disabled={isRunning}>Obstacles</button>
          <button className="panel-button preset" onClick={() => applyPreset("bottleneck")} disabled={isRunning}>Bottleneck</button>
          <button className="panel-button secondary" onClick={randMaze} disabled={isRunning}>Maze</button>
        </div>

        <div className="control-grid compact-grid">
          <div className="select-group">
            <label htmlFor="complexity">Complexity</label>
            <input id="complexity" type="range" min="1" max="3" step="1" value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))} disabled={isRunning} />
            <small>Level {complexity}</small>
            <div className="slider-labels">
              <span>Low</span>
              <span>Mid</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      <p className="status-text">{status}</p>
      <p className="hint-text">
        Drag the Start and Goal icons to new positions, or click cells to change terrain in real time.
      </p>
    </div>
  );
}

export default Panel;