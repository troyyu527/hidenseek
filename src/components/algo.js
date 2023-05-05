import imgS from "../img/pain-point.png"
import imgG from "../img/finish-flag.png"
const delay = ms => new Promise(res => setTimeout(res, ms));
//initial map nodes
export function initialMap(dataModel,map){
  let arr=[]
  let moveX=0
  let moveY=0
  let spacingX=map.width/map.cols
  let spacingY=map.height/map.rows
 
  for(let i=0;i<map.rows;i++){
    let partialArr=[]
    moveX=0
    for(let j=0;j<map.cols;j++){
      partialArr.push(`_${j}_${i}`)
      dataModel.addNode(`_${j}_${i}`,moveX,moveY,j,i)
      moveX+=spacingX
    }
    arr.push(partialArr)
    moveY+=spacingY
  }
  //Add boundary condition(Add links)
  //1.All rows elements connect to it's previous and next neighbor (first add)
  //2.All columns elements connect to it's previous and next neighbor (second add)
  //3.All diagonal connections (third & fouth add)(optional)
  for(let i=0;i<arr.length;i++){
    arr[i].reduce((accm,curr)=>{
      dataModel.addLink(accm,curr)
      return curr
    })
    if(i<arr.length-1){
      for(let j=0;j<arr[i].length;j++){
        dataModel.addLink(arr[i][j],arr[i+1][j])
        //(optional for adding diagonal connection)
        // if(j<arr[i].length-1){
        //   dataModel.addLink(arr[i][j],arr[i+1][j+1],1)
        //   dataModel.addLink(arr[i][j+1],arr[i+1][j],1)
        // } 
        
      }
    }
  }
  return {spacingX,spacingY,arr}
}
export function initialSta(dataModel){
  let startIndex = Math.floor(Math.random()*dataModel.nodes.length)
  let goalIndex = Math.floor(Math.random()*dataModel.nodes.length)
  let startNode = dataModel.nodes[startIndex]
  let goalNode = dataModel.nodes[goalIndex]
  let start={name:"Start",node:startNode,x:startNode.x,y:startNode.y,preX:startNode.x,preY:startNode.y,ref:imgS}
  let goal={name:"Goal",node:goalNode,x:goalNode.x,y:goalNode.y,preX:goalNode.x,preY:goalNode.y,ref:imgG}
  return [start,goal]
}

export async function Dijkstra(nodes,MH,start,end,setGrid){
  let startNode,endNode
  let travelList=[]
  let count=0
  let layerCount=1
  
  //load all nodes into min heap
  nodes.forEach(node=>{
    node.visited=false;
    node.distFromStart=Infinity;
    node.previous=null;
    node.color="darkgray"
    if(node.name===start.node.name){
      startNode = node
      startNode.distFromStart = 0;
      startNode.visited = true;
    } 
    if(node.name===end.node.name) endNode = node
    if(node.state!=="wall") MH.enqueue(node)
  })
  startNode.distFromStart = 0;
  startNode.visited = true;
  //1.Get shortest dist. Node (starting from startNode dist=0)
  let currentNode = MH.dequeue();
  while (MH.values.length > 0) {

    // 2. node => neighborNode
    // 3. neighborNode.distance > currentNode.distance + weight
    // 4. neighborNode.distance = currentNode.distance + weight
    // 5. neighborNode.previous = currentNode, MH decrease neighborNode's priority
    currentNode.neighbor.forEach(neighborNode => {
      if (!neighborNode.visited && neighborNode.state!=="wall") {
        if (neighborNode.distFromStart > currentNode.distFromStart + neighborNode.weight) {
          neighborNode.distFromStart = currentNode.distFromStart + neighborNode.weight;
          neighborNode.previous = currentNode;
          MH.siftUp(neighborNode);
        }
      }
    });
    
    currentNode = MH.dequeue();
    
    if(!currentNode.previous) return [travelList,nodes]
    if(currentNode===endNode) break
    
    currentNode.visited = true;
    count++
    if(count>1*layerCount && count%1===0){
      setGrid([...nodes])
      await delay(100)
      layerCount++
    }
  }
  let current = endNode
  while(current.previous){
    travelList.unshift(current)
    current=current.previous
  }
  travelList.unshift(current)
  
  
  return [travelList,nodes]
}

export async function shortestPath(result,setGrid,distRef){
  let travelList=result[0]
  let nodes = result[1]
  let length =travelList.length
  if(length){
    let distance = travelList[length-1].distFromStart
    nodes.forEach(node=>{
      node.visited=false;
      node.distFromStart=Infinity;
      node.previous=null;
    })
    for(let node of travelList){
      node.color="green"
      setGrid([...nodes])
      await delay(5)
    }
    
    distRef.current.textContent = distance
  }else{
    nodes.forEach(node=>{
      node.visited=false;
      node.distFromStart=Infinity;
      node.previous=null;
    })
    setGrid([...nodes])
    distRef.current.textContent = "Unknown"
  }
  
}

export function genMaze(nameGrid,grid,stations,map,setGrid){
  grid.forEach(node=>{
    node.isVisit=false
    if(wallCheck(node)) {
      node.state="wall"
    }else{
      node.state="regular"
    } 
  })
  //Initial the starting cell and stack
  let currentCell = findCell(1,1)
  currentCell.isVisit=true
  let stack = [currentCell]
  
  //Recursive backtracker algorithm
  while(stack.length>0){
    let neighbors=[];
    let x = currentCell.ox;
    let y = currentCell.oy;
    //check west
    if(x>1 && !findCell(x-2,y).isVisit) neighbors.push(findCell(x-2,y))
    //check north
    if(y>1 && !findCell(x,y-2).isVisit) neighbors.push(findCell(x,y-2))
    //check east
    if(x<map.cols-2 && !findCell(x+2,y).isVisit) neighbors.push(findCell(x+2,y))
    //check south
    if(y<map.rows-2 && !findCell(x,y+2).isVisit) neighbors.push(findCell(x,y+2))
    
    if(neighbors.length>0){
      //choose random neighbor
      let neighbor = neighbors[Math.floor(Math.random() * neighbors.length)]
      //west cell & break wall between them
      if(neighbor.ox<currentCell.ox) findCell(currentCell.ox-1,currentCell.oy).state="regular"
      //east cell & break wall between them
      if(neighbor.ox>currentCell.ox) findCell(currentCell.ox+1,currentCell.oy).state="regular"
      //north cell & break wall between them
      if(neighbor.oy<currentCell.oy) findCell(currentCell.ox,currentCell.oy-1).state="regular"
      //south cell & break wall between them
      if(neighbor.oy>currentCell.oy) findCell(currentCell.ox,currentCell.oy+1).state="regular"
      //mark visit and add the cell to the stack
      neighbor.isVisit=true
      stack.push(neighbor)
      currentCell=neighbor
    }else{
      //backtracking previous cell
      currentCell=stack.pop()
    }
  }
  function findCell(x,y){
    let order = x+y*map.cols
    return grid[order]
  }
  //wall check
  function wallCheck(node){
    return node.ox%2===0 || node.oy%2===0
  }
  //placing stations
  let emptyCells=[]
  grid.forEach(node=>{
    if(node.state=="regular") emptyCells.push(node)
  })
  let startIndex = Math.floor(Math.random() * emptyCells.length)
  let newStart = emptyCells[startIndex]
  emptyCells.splice(startIndex,1)
  let goalIndex = Math.floor(Math.random() * emptyCells.length)
  let newGoal = emptyCells[goalIndex]
  applyStation("Start",newStart)
  applyStation("Goal",newGoal)
  
  function applyStation(name,newNode){
    let index=null
    if(name=="Start"){
      index=0
    }else if(name=="Goal"){
      index=1
    }
    stations[index].node=newNode
    stations[index].x=newNode.x
    stations[index].y=newNode.y
    stations[index].preX=newNode.x
    stations[index].preY=newNode.y
  }

  function stationCheck(node){
    return node.name===stations[0].node.name||
    node.name===stations[1].node.name
  }

  return grid
}

  



