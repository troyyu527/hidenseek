
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
      dataModel.addNode(`_${j}_${i}`,moveX,moveY,1)
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
      dataModel.addLink(accm,curr,0)
      return curr
    })
    if(i<arr.length-1){
      for(let j=0;j<arr[i].length;j++){
        dataModel.addLink(arr[i][j],arr[i+1][j],1)
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
  let start={name:"Start",node:startNode,x:startNode.x,y:startNode.y,preX:startNode.x,preY:startNode.y,ref:"%PUBLIC_URL%/img/pain-point.png"}
  let goal={name:"Goal",node:goalNode,x:goalNode.x,y:goalNode.y,preX:goalNode.x,preY:goalNode.y,ref:"%PUBLIC_URL%/img/finish-flag.png"}
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

    MH.enqueue(node)
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
      if (!neighborNode.visited) {
        if (neighborNode.distFromStart > currentNode.distFromStart + neighborNode.weight) {
          neighborNode.distFromStart = currentNode.distFromStart + neighborNode.weight;
          neighborNode.previous = currentNode;
          MH.siftUp(neighborNode);
        }
      }
    });
    currentNode = MH.dequeue();
 
    if(currentNode===endNode) break
    
    currentNode.visited = true;
    count++
    if(count>5*layerCount && count%5===0){
      setGrid([...nodes])
      await delay(0)
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
  let nodes = result[1]
  let travelList=result[0]
  const distance = travelList[travelList.length-1].distFromStart
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
}

export function genMaze(nameGrid,grid,stations,map){
 
  let topList=[],botList=[],leftList=[],rightList=[]
  grid.forEach(n=>{
    n.color="darkgray"
    n.weight= 1
    n.state="regular"
  })
  //Add wall to 4 borders
  //top
  nameGrid[0].forEach(name=>{
    if(name!==stations[0].node.name && name!==stations[1].node.name) {
      grid.forEach((n)=>{
        if(n.name===name){
          n.state="wall"
          n.weight=Infinity
          n.color="darkgray"
        }
      })
      topList.push(name)
    }
  })
  topList.pop()
  topList.unshift()
  //bot
  nameGrid[nameGrid.length-1].forEach(name=>{
    if(name!==stations[0].node.name && name!==stations[1].node.name) {
      grid.forEach((n)=>{
        if(n.name===name){
          n.state="wall"
          n.weight=Infinity
          n.color="darkgray"
        }
      })
      botList.push(name)
    }
  })
  botList.pop()
  botList.unshift()

  //left
  nameGrid.forEach(array=>{
    if( array[0]!==stations[0].node.name && array[0]!==stations[1].node.name) {
      if(array[0]!=="_0_0" && array[0]!==`_0_${map.rows-1}`)
      grid.forEach((n)=>{
        if(n.name===array[0]){
          n.state="wall"
          n.weight=Infinity
          n.color="darkgray"
        }
      })
      leftList.push(array[0])
    } 
  })
  //right
  nameGrid.forEach(array=>{
    if( array[array.length-1]!==stations[0].node.name && array[array.length-1]!==stations[1].node.name) {
      if(array[array.length-1]!==`_${map.cols-1}_0` && array[array.length-1]!==`_${map.cols-1}_${map.rows-1}`)
      grid.forEach((n)=>{
        if(n.name===array[array.length-1]){
          n.state="wall"
          n.weight=Infinity
          n.color="darkgray"
        }
      })
      rightList.push(array[array.length-1])
    } 
  })
  let totalList=[leftList,topList,rightList,botList]
  console.log(totalList)
  grow(totalList,map,stations,grid)
  return grid
}

  


function grow(totalList,map,stations,grid){
  let dirList=["left","top","right","bot"]
    let order,growLength,idxList,list
    while(totalList[0].length>map.rows*0.5 || totalList[1].length>map.cols*0.5){
      for(let dir=0;dir<dirList.length;dir++){
        list=totalList[dir]
        order = Math.floor(Math.random()*list.length)
        if(dir===0){
          growLength = Math.floor(Math.random()*(map.cols*0.5))
          idxList = list[order].split("_")
          list.splice(order,1)
          for(let i=1;i<growLength;i++){
            let obsName = `_${i}_${idxList[2]}`
            if( obsName!==stations[0].node.name && obsName!==stations[1].node.name){
              if(checkNeighborWall(obsName,"left")){
                break
              }else{
                grid.forEach((n)=>{
                  if(n.name===obsName){
                    n.state="wall"
                    n.weight=Infinity
                    n.color="darkgray"
                  }
                })
              }
            }
          } 
        }else if(dir===2){
          growLength = Math.floor(Math.random()*(map.cols*0.5))
          idxList = list[order].split("_")
          list.splice(order,1)
          for(let i=map.cols-2;i>map.cols-growLength;i--){
            let obsName = `_${i}_${idxList[2]}`
            if( obsName!==stations[0].node.name && obsName!==stations[1].node.name){
              if(checkNeighborWall(obsName,"right")){
                break
              }else{
                grid.forEach((n)=>{
                  if(n.name===obsName){
                    n.state="wall"
                    n.weight=Infinity
                    n.color="darkgray"
                  }
                })
              }
            }
          } 
        }else if(dir===1){
          growLength = Math.floor(Math.random()*(map.rows*0.5))
          idxList = list[order].split("_")
          list.splice(order,1)
          for(let i=1;i<growLength;i++){
            let obsName = `_${idxList[1]}_${i}`
            if( obsName!==stations[0].node.name && obsName!==stations[1].node.name){
              if(checkNeighborWall(obsName,"top")){
                break
              }else{
                grid.forEach((n)=>{
                  if(n.name===obsName){
                    n.state="wall"
                    n.weight=Infinity
                    n.color="darkgray"
                  }
                })
              }
            }
          } 
        }else if(dir===3){
          growLength = Math.floor(Math.random()*(map.rows*0.5))
          idxList = list[order].split("_")
          list.splice(order,1)
          for(let i=map.rows-2;i>map.rows-growLength;i--){
            let obsName = `_${idxList[1]}_${i}`
            if( obsName!==stations[0].node.name && obsName!==stations[1].node.name){
              if(checkNeighborWall(obsName,"bot")){
                break
              }else{
                grid.forEach((n)=>{
                  if(n.name===obsName){
                    n.state="wall"
                    n.weight=Infinity
                    n.color="darkgray"
                  }
                })
              }
            }
          } 
        }
      }
    }
  
}

function checkNeighborWall(name,direction,layer=1){
  let idx = name.split("_")
 if(direction==="left"){
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])+layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${Number(idx[2])+layer} img`)) return true
 }else if(direction==="right"){
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])-layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])+layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])-layer}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])-layer}_${Number(idx[2])+layer} img`)) return true
 }else if(direction==="top"){
  if(document.querySelector(`._${Number(idx[1])-layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])+layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${Number(idx[2])+layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])-layer}_${Number(idx[2])+layer} img`)) return true
 }else if(direction==="bot"){
  if(document.querySelector(`._${Number(idx[1])-layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${idx[1]}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${idx[2]} img`)) return true
  if(document.querySelector(`._${Number(idx[1])-layer}_${Number(idx[2])-layer} img`)) return true
  if(document.querySelector(`._${Number(idx[1])+layer}_${Number(idx[2])-layer} img`)) return true
 }
 return false
}
