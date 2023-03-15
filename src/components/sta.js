import React,{useRef} from "react";
function Sta({station,map,cellSize,nodesArr}) {
  const ref = useRef(null);
  let isDragging=false

  const handleMouseDown = (event) => {
    const element = ref.current;
    const diffX = event.clientX - station.x;
    const diffY = event.clientY - station.y;
    isDragging=true
    element.setAttribute('cursor', `grab`);
    const handleMouseMove = (event) => {
      if (!isDragging) {
        return;
      }
      const posX =Math.max(0,Math.min(map.width-cellSize.spacingX,event.clientX-diffX))
      const posY =Math.max(0,Math.min(map.height-cellSize.spacingY,event.clientY-diffY))
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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  return (
    <g 
      ref={ref}
      transform={`translate(${station.x},${station.y})`}
      onMouseDown={handleMouseDown}
      cursor="grab"
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