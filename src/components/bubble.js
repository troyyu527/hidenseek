import React,{useState,useEffect}from "react";
export function Bubble({node,cellSize}){
  const [radius, setRadius] = useState(0);
  const styles = {
    transition:"all 1s",
    fill:"rgba(110, 218, 234, .6)"
  }
  useEffect(()=>setRadius((cellSize.spacingX/2)-2),[])
  return (
    <g 
      className={node.name}
      transform={`translate(${node.x},${node.y})`}
    >
      <circle 
        cx={cellSize.spacingX/2}
        cy={cellSize.spacingY/2}
        r={radius}
        style={styles}
      >
      </circle>
    </g>
  );
}

export default Bubble