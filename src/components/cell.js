import React from "react";
import wall from "../img/wall.png"
import sand from "../img/sand.png"

function Cell({node,cellSize,cellClick}){
 
  return (
    <g 
      className="node-group"
      transform={`translate(${node.x},${node.y})`}
    >
      <g
        className={node.name}
        onClick={cellClick}
      >
        <rect
          className="node"
          width={cellSize.spacingX}
          height={cellSize.spacingY}
          fill={node.color}
          stroke="black"
          strokeWidth={0.2}
        >
        </rect>
        {node.state==="wall" && (
          <image 
            className="wall"
            width={cellSize.spacingX}
            height={cellSize.spacingY}
            href={wall}
            
          >
          </image>
        )}
        {node.state==="sand" && (
          <image 
            className="sand"
            width={cellSize.spacingX}
            height={cellSize.spacingY}
            href={sand}
          
          >
          </image>
        )}
      </g>
    </g>
  )
}

export default Cell