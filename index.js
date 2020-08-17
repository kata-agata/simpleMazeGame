const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events
} = Matter;

const cellsHorizontal = 10;
const cellsVertical=8;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width/cellsHorizontal;
const unitLengthY = height/cellsVertical;

const engine = Engine.create();
engine.world.gravity.y=0 //disable gravity
const {
  world
} = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);


const walls = [
  Bodies.rectangle(width/2, 0, width, 1, {
    isStatic: true
  }),
  Bodies.rectangle(width/2, height, width, 1, {
    isStatic: true
  }),
  Bodies.rectangle(0, height/2, 1, height, {
    isStatic: true
  }),
  Bodies.rectangle(width, height/2, 1, height, {
    isStatic: true
  })
]; // borders
World.add(world, walls);

//Maze generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter>0) {
    const index = Math.floor(Math.random()*counter);
    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index]=temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(()=> Array(cellsHorizontal)
    .fill(false));
//can not do .fill([false, false, false]), because in each row there will be the same array, and if we change one array all three will be changed. The reference to the same array. map method will create 3 diffrent arrays

//basic way to do:
// for (let i = 0; i < 3; i++) {
//   grid.push([]);
//   for (let j = 0; j < 3; j++) {
//     grid[i].push(false);
//   }
// }

const verticals = Array(cellsVertical)
  .fill(null)
  .map(()=>Array(cellsHorizontal-1).fill(false));

  const horizontals = Array(cellsVertical-1)
    .fill(null)
    .map(()=>Array(cellsHorizontal).fill(false));


const startRow = Math.floor(Math.random()*cellsVertical);
const startColumn = Math.floor(Math.random()*cellsHorizontal);

const stepThroughCell = (row, column)=>{
  //if I have visited cell at [row,column], then return
  if(grid[row][column]){
    return; //true or false
  }
  //mark this cell as being visited
  grid[row][column] = true;

  //assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row-1,column, 'up'],
    [row, column+1, 'right'],
    [row+1,column, 'down'],
    [row,column-1, 'left']
  ]);

  //for each neighbour
  for (let neighbour of neighbors) {
    const [nextRow, nextColumn, direction] = neighbour;

    //see if that neighbour is out of bounds
    if(nextRow < 0 || nextRow >= cellsVertical ||nextColumn < 0 || nextColumn >= cellsHorizontal){
      continue;
    }

    //if we have visited that neighbour, continue to next neighbour
    if(grid[nextRow][nextColumn]){
      continue;
    }

    //remove a wall from horizontals or verticals
    if(direction === 'left'){
      verticals[row][column-1]=true;
    } else if (direction === 'right'){
      verticals[row][column]=true;
    } else if (direction ==='up') {
      horizontals[row-1][column]=true;
    } else if (direction =='down') {
      horizontals[row][column]=true;
    }

    stepThroughCell(nextRow,nextColumn);
  };

  //vist that next cell


};

stepThroughCell(startRow,startColumn);

horizontals.forEach((row, rowIndex)=>{
  row.forEach((open, columnIndex)=>{
    if(open){
      return ; //if open => draw nothing
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX/2,
      rowIndex*unitLengthY + unitLengthY,
      unitLengthX,
      10,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex)=>{
  row.forEach((open, columnIndex)=>{
    if(open){
      return ;
    }

    const wall = Bodies.rectangle(
      unitLengthX*columnIndex+unitLengthX,
      unitLengthY*rowIndex + unitLengthY/2,
      10,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    );
    World.add(world, wall);
  });
});

//Goal
const goal = Bodies.rectangle(
  width-unitLengthX/2,
  height-unitLengthY/2,
  0.7*unitLengthX,
  0.7*unitLengthY,
  {
    label: 'goal',
    isStatic:true,
    render: {
      fillStyle: 'green'
    }
  }
);
World.add(world,goal);


//ball
const ballRadius = Math.min(unitLengthX, unitLengthY)/4;
const ball = Bodies.circle(
  unitLengthX/2,
  unitLengthY/2,
  ballRadius,
  {
    label: 'ball',
    render: {
      fillStyle: 'lightBlue'
    }
  }
);
World.add(world,ball);

document.addEventListener('keydown', event => {
  const {x, y} = ball.velocity;
  if (event.keyCode === 87){
    console.log('move up');
    Body.setVelocity(ball, {x,y: y-5});
  }
  if (event.keyCode === 68){
    console.log('move right');
    Body.setVelocity(ball, {x: x+5,y});
  }
  if (event.keyCode === 83){
    console.log('move down');
    Body.setVelocity(ball, {x,y: y+5});
  }
  if (event.keyCode === 65){
    console.log('move left');
    Body.setVelocity(ball, {x:x-5,y});
  }
});

//win condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(collision => {
    const labels = ['ball','goal'];
    if(
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ){
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1;
      world.bodies.forEach(body=>{
        if ( body.label === 'wall'){
          Body.setStatic(body, false);
        }
      })
    }
  });
});
