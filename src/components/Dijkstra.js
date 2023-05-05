class Node{
  constructor(name,x=null,y=null,ox=null,oy=null){
    this.name=name
    this.visited=false
    this.neighbor=[]
    this.distFromStart=Infinity;
    this.previous = null;
    this.state="regular"
    this.color="darkgray"
    this.isVisit=false
    this.weight=1
    this.ox=ox
    this.oy=oy
    this.x=x
    this.y=y
  }
  addLink(link){
    this.neighbor.push(link)
  }
}
class Link{
  constructor(source,target){
    this.source=source
    this.target=target
  }
  
}
export class Graph{
  constructor(){
    this.nodes = [];
    this.links = [];
  }
  addNode(data,x=null,y=null,ox,oy){
    let node = new Node(data,x,y,ox,oy)
    this.nodes.push(node)
  }
  addLink(sName,tName){
    if(sName!==tName){
      let sNode,tNode
      this.nodes.forEach(n=>{
        if(n.name===sName) sNode=n
        if(n.name===tName) tNode=n
      })
      if(sNode && tNode){
        let link = new Link(sName,tName)
        this.links.push(link);
        if(sNode.neighbor.indexOf(tNode)===-1){
          sNode.neighbor.push(tNode)
        }
        if(tNode.neighbor.indexOf(sNode)===-1){
          tNode.neighbor.push(sNode)
        }
      }
    }
  }
}

export class MinHeap {
  constructor() {
    this.values = [];
  }
  enqueue(node) {
    // check if the priority queue is empty
    if (this.values.length === 0) {
      this.values.push(node);
      return true;
    }
    this.values.push(node);
    this.siftUp(node)
  }
  dequeue() {
    if (this.values.length === 0) {
      return null;
    }
    if (this.values.length === 1) {
      let removedNode = this.values.pop();
      return removedNode;
    }
    // extract first node and move last node to the fist of the list
    [this.values[0],this.values[this.values.length-1]]=[this.values[this.values.length-1],this.values[0]]
    let removedNode = this.values.pop();
    this.siftDown(0);
    return removedNode;
  }
 siftDown(i) {
    let smallest;
    let l = i * 2 + 1;
    let r = i * 2 + 2;
    if (
      l <= this.values.length - 1 &&
      this.values[l].distFromStart <
        this.values[i].distFromStart
    ) {
      smallest = l;
    } else {
      smallest = i;
    }

    if (
      r <= this.values.length - 1 &&
      this.values[r].distFromStart <
        this.values[smallest].distFromStart
    ) {
      smallest = r;
    }

    if (smallest !== i) {
      // swap
      [this.values[i],this.values[smallest]]=[this.values[smallest],this.values[i]]
      this.siftDown(smallest);
    }
  }
  siftUp(node) {
    let newIndex = this.values.indexOf(node);
    let parentIndex = Math.floor((newIndex - 1) / 2);
    while (
      parentIndex >= 0 &&
      this.values[newIndex].distFromStart <
        this.values[parentIndex].distFromStart
    ) {
      // swap node and its parent node
      [this.values[parentIndex],this.values[newIndex]]=[this.values[newIndex],this.values[parentIndex]]
      // update index number
      newIndex = parentIndex;
      parentIndex = Math.floor((newIndex - 1) / 2);
    }
  }
}
