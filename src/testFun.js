import { useState, useEffect, useRef, useCallback } from 'react';
export function useDraggable(station, width, height) {
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef({ x: station.x, y: station.y });

  const handleMouseDown = useCallback((event) => {
    setIsDragging(true);
    const diffX = event.clientX - positionRef.current.x;
    const diffY = event.clientY - positionRef.current.y;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((event) => {
    const posX = event.clientX - station.diffx;
    const posY = event.clientY - station.diffy;
    positionRef.current.x = posX;
    positionRef.current.y = posY;
    document.querySelector(`.${station.name}`).parentElement.setAttribute('transform', `translate(${posX},${posY})`);
  }, [station]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return {
    isDragging,
    handleMouseDown,
  };
}