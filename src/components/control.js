import React from "react";
// import {MinHeap} from "./Dijkstra"
// import {Dijkstra} from "./algo"
function Panel({run,randMaze,reset}){
 
  return (
    <div className="control">
      <button className="go" onClick={run}>Go</button>
      <button className="random" onClick={randMaze}>Generate Random Maze</button>
      <button className="clear" onClick={reset}>Reset</button>
      <div className="select-group">
        <label htmlFor="obstacle">Switch Obstacle</label>
        <select className="obstacle" id="obstacle" defaultValue="wall">
          <option className="sand" value="sand"> Sand(-3)</option>
          <option className="wall" value="wall"> Wall(X)</option>
        </select>
      </div>
      <div id="notice">
        Notice: Drag Start/Goal icon to desired position. Click cell to toggle obstacle. Each cell weight=1. Sand weight=3, Wall is diable for passing.
      </div>
    </div>
  )

}

export default Panel