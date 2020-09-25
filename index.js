const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth - 10;
const height = window.innerHeight - 20;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: { wireframes: false, width, height },
});
Render.run(render);
Runner.run(Runner.create(), engine);

//walls

const walls = [
  Bodies.rectangle(width / 2, 0, width, 5, { isStatic: true, label: "wall" }),
  Bodies.rectangle(width / 2, height, width, 5, {
    isStatic: true,
    label: "wall",
  }),
  Bodies.rectangle(0, height / 2, 5, height, { isStatic: true, label: "wall" }),
  Bodies.rectangle(width, height / 2, 5, height, {
    isStatic: true,
    label: "wall",
  }),
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

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startCol = Math.floor(Math.random() * cellsHorizontal);

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
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextCol < 0 ||
      nextCol >= cellsHorizontal
    ) {
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
      colIdx * unitLengthX + unitLengthX / 2,
      rowIdx * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
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
      colIdx * unitLengthX + unitLengthX,
      rowIdx * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

//goal to reach

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "green",
    },
  }
);
World.add(world, goal);

//ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthX / 2, ballRadius, {
  label: "ball",
  render: {
    fillStyle: "blue",
  },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  if (event.key === "ArrowUp") {
    Body.setVelocity(ball, { x, y: y - 4 });
  }
  if (event.key === "ArrowDown") {
    Body.setVelocity(ball, { x, y: y + 4 });
  }
  if (event.key === "ArrowRight") {
    Body.setVelocity(ball, { x: x + 4, y });
  }
  if (event.key === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - 4, y });
  }
});

//condition of winning, win animation

Events.on(engine, "collisionStart", (ev) => {
  ev.pairs.forEach((collision) => {
    const labels1 = ["ball", "goal"];
    const labels2 = ["ball", "wall"];
    if (
      labels1.includes(collision.bodyA.label) &&
      labels1.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
    if (
      labels2.includes(collision.bodyA.label) &&
      labels2.includes(collision.bodyB.label)
    ) {
      Body.setVelocity(ball, { x: 0, y: 0 });
    }
  });
});
