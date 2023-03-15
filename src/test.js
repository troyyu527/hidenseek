import React from "react";
import { useRef } from 'react';
import { useDraggable } from './testFun';

function Station({ station, width, height }) {
  const svgRef = useRef(null);
  const { isDragging, handleMouseDown } = useDraggable(station, width, height);

  return (
    <svg ref={svgRef}>
      <g
        className={station.name}
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        <circle cx={station.x} cy={station.y} r={10} fill="red" />
      </g>
    </svg>
  );
}

function App() {
  const stations = [
    { name: 'station1', x: 50, y: 50 },
    { name: 'station2', x: 100, y: 100 },
    { name: 'station3', x: 150, y: 150 },
  ];

  return (
    <div>
      {stations.map((station, index) => (
        <Station
          key={index}
          station={station}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      ))}
    </div>
  );
}

function Test() {
  return (
    <div className="Test">
      <App/>
    </div>
  );
}


export default Test;