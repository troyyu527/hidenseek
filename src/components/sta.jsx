import React,{useRef} from "react";
function Sta({station,map,cellSize,nodesArr,locked,onLayoutChange}) {
  const ref = useRef(null);
  let isDragging=false

  const handleMouseDown = (event) => {
    // The map is locked while an algorithm is running; ignore drags.
    if (locked) return;
    const element = ref.current;
    const svg = element.ownerSVGElement;
    // Convert a screen (client) point into the SVG's own viewBox coordinates so
    // the drag stays glued to the cursor no matter how the SVG is scaled to fit.
    const toSvg = (evt) => {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    // Where inside the icon the user grabbed (in SVG units), so it doesn't jump.
    const startPt = toSvg(event);
    const grabX = startPt.x - station.x;
    const grabY = startPt.y - station.y;
    isDragging=true
    element.setAttribute('cursor', `grabbing`);
    const handleMouseMove = (event) => {
      if (!isDragging) {
        return;
      }
      const p = toSvg(event);
      const posX =Math.max(0,Math.min(map.width-cellSize.spacingX,p.x-grabX))
      const posY =Math.max(0,Math.min(map.height-cellSize.spacingY,p.y-grabY))
      station.x = posX;
      station.y = posY;
      element.setAttribute('transform', `translate(${station.x},${station.y})`);
      element.setAttribute('cursor', `grabbing`);
    };

    const handleMouseUp = (event) => {
      const visualX = station.x
      const visualY = station.y
      let matched=false
      for(let i=0;i<nodesArr.length;i++){
        if((Math.abs(visualX-nodesArr[i].x+(cellSize.spacingX/2))<cellSize.spacingX) 
        && (Math.abs(visualY-nodesArr[i].y+(cellSize.spacingY/2))<cellSize.spacingY)){
          if(nodesArr[i].state==="wall") break
          station.node=nodesArr[i]
          station.x=nodesArr[i].x
          station.y=nodesArr[i].y
          station.preX=nodesArr[i].x
          station.preY=nodesArr[i].y
          element.setAttribute('transform', `translate(${station.x},${station.y})`);
          matched=true
          break
        }
      }
      if(!matched){
        station.x=station.preX
        station.y=station.preY
        element.setAttribute('transform', `translate(${station.x},${station.y})`);
      }
      isDragging=false
      element.setAttribute('cursor', `grab`);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Moving Start/Goal changes the layout, so any cached comparison is stale.
      if (onLayoutChange) onLayoutChange();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  return (
    <g 
      ref={ref}
      transform={`translate(${station.x},${station.y})`}
      onMouseDown={handleMouseDown}
      style={{ pointerEvents: locked ? "none" : "auto" }}
      cursor={locked ? "not-allowed" : "grab"}
    >
      <image 
        className={station.name}
        width={cellSize.spacingX}
        height={cellSize.spacingY}
        href={station.ref}
      >
      </image>
    </g>
  )
}

export default Sta