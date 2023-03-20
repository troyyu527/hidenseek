import React,{useState,useRef} from "react";
import Panel from "../components/control"
import Cell from "../components/cell";
import Sta from "../components/sta";
import Bubble from "../components/bubble";
import {Graph,MinHeap} from "../components/Dijkstra"
import {initialMap,initialSta,Dijkstra, shortestPath,genMaze} from "../components/algo"

const map ={}
map.width = 800;
map.height = 400;
map.rows = 20;
map.cols = 40;

const dataModel = new Graph();
const MH = new MinHeap()
const cellSize = initialMap(dataModel, map);
const stations = initialSta(dataModel);
const nameGrid = cellSize.arr


function Page(){
  const distRef=useRef(null)
  const [grid, setGrid] = useState(dataModel.nodes)
  
  
  const run = async() =>{
    const svg= document.querySelector("svg")
    const buttons = document.querySelectorAll("button")
    
    svg.setAttribute("pointer-events","none")
    buttons.forEach((btn)=>btn.disabled=true)
    const result = await Dijkstra(grid,MH,stations[0],stations[1],setGrid)
    await shortestPath(result,setGrid,distRef)
    
    svg.setAttribute("pointer-events","auto")
    buttons.forEach((btn)=>btn.disabled=false)
  }




  const cellClick = (e) =>{
    const nodeName = e.currentTarget.getAttribute("class")
    const obs = document.querySelector("#obstacle option:checked")
    const action = obs.getAttribute("class");
    let newGrid = [...grid]
    let newNode
    newGrid.forEach(n=>{if(n.name===nodeName) newNode=n})
    if (action === "wall") {
      if(newNode.state==="sand" || newNode.state==="regular"){
        newNode.state = "wall";
        newNode.weight=Infinity
      }else if(newNode.state==="wall"){
        newNode.state = "regular";
        newNode.weight=1
      }
    } else if (action === "sand") {
      if(newNode.state==="wall" || newNode.state==="regular"){
        newNode.state = "sand";
        newNode.weight=3
      }else if(newNode.state==="sand"){
        newNode.state = "regular";
        newNode.weight=1
      }
    }
    newNode.color="darkgray"
    setGrid(newGrid)
  }
  const randMaze = () =>{
    let newGrid = genMaze(nameGrid,grid,stations,map)
    setGrid([...newGrid])
  }

  const reset = () =>{
    grid.forEach(n=>{
      n.visited=false;
      n.distFromStart=Infinity;
      n.previous=null;
      n.color="darkgray"
      n.weight= 1
      n.state="regular"
    })
    setGrid([...grid])
    distRef.current.textContent = "Unknown"
  }

  return (
    <div>
      <h1>Hide & Seek</h1>
        <Panel run={run} randMaze={randMaze} reset={reset}/>
        <h3>The shortest distance is <b ref={distRef}>Unknown</b></h3>
        <div className="maze">
          <main>
            <svg width={map.width} height={map.height}>
              <g className="map">
                <g className="terrain">
                  {grid.map((node) => <Cell key={node.name} node={node} cellSize={cellSize} cellClick={cellClick}/>)}
                </g>
                <g className="post">
                  {stations.map((sta) =>{
                    return <Sta key={sta.name} station={sta} map={map} cellSize={cellSize} nodesArr={grid}/>
                  })}
                </g> 
                <g className="visited">
                  {grid.map((node)=>{
                    const nodeName=node.name
                    if(node.visited && nodeName!==stations[0].node.name){
                      return <Bubble key={node.name} node={node} cellSize={cellSize}></Bubble>
                    }else{
                      return null
                    } 
                    })} 
                </g>
              </g>
            </svg>
          </main>
        </div>
        
      
    </div>
  )
}


export default Page