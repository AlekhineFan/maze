const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cells = 3;
const width = 600;
const height = 600;
const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: { wireframes: true, width, height },
});
Render.run(render);
Runner.run(Runner.create(), engine);

//walls

const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];
World.add(world, walls);

//maze generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const idx = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[idx];
    arr[idx] = temp;
  }
  return arr;
};

const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startCol = Math.floor(Math.random() * cells);

console.log(startRow, startCol);

const stepCell = (row, col) => {
  //if I have visited the sell at [row, col] return
  if (grid[row][col]) {
    return;
  }
  //Mark current cell visited
  grid[row][col] = true;

  //Assemble randomly ordered list of neigbours
  const neighbours = shuffle([
    [row - 1, col, "up"],
    [row, col + 1, "right"],
    [row + 1, col, "down"],
    [row, col - 1, "left"],
  ]);

  //for each neighbour
  for (let neighbour of neighbours) {
    //See if that neighbour is out of bounds
    const [nextRow, nextCol, direction] = neighbour;
    if (nextRow < 0 || nextRow >= cells || nextCol < 0 || nextCol >= cells) {
      continue;
    }
    //if we have visited that neighbour, continue to next neighbour
    if (grid[nextRow][nextCol]) {
      continue;
    }

    //remove a wall from the vertical or the horizontal array
    if (direction === "left") {
      verticals[row][col - 1] = true;
    } else if (direction === "right") {
      verticals[row][col] = true;
    } else if (direction == "up") {
      horizontals[row - 1][col] = true;
    } else if (direction == "down") {
      horizontals[row][col] = true;
    }
    stepCell(nextRow, nextCol);
  }
  //visit that next cell
};

stepCell(startRow, startCol);

horizontals.forEach((row, rowIdx) => {
  row.forEach((open, colIdx) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      colIdx * unitLength + unitLength / 2,
      rowIdx * unitLength + unitLength,
      unitLength,
      5,
      {
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIdx) => {
  row.forEach((open, colIdx) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      colIdx * unitLength + unitLength,
      rowIdx * unitLength + unitLength / 2,
      5,
      unitLength,
      {
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

//goal to reach

const goal = Bodies.rectangle(
  width - unitLength / 2,
  height - unitLength / 2,
  unitLength * 0.7,
  unitLength * 0.7,
  {
    label: "goal",
    isStatic: true,
  }
);
World.add(world, goal);

//ball

const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength / 4, {
  label: "ball",
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  if (event.key === "ArrowUp") {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  if (event.key === "ArrowDown") {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.key === "ArrowRight") {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  if (event.key === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

//condition of winning

Events.on(engine, "collisionStart", (ev) => {
  ev.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      console.log("User won!");
    }
  });
});
