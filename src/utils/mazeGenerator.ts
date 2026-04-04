export const SHAPE_NAMES: Record<number, string[]> = {
  1: ["티라노사우루스", "프테라노돈", "브라키오사우루스", "안킬로사우루스", "트리케라톱스"],
  2: ["세단", "트럭", "버스", "스포츠카", "F1 머신"],
  3: ["주택", "마천루", "성", "공장", "텐트"],
  4: ["사과", "햄버거", "아이스크림", "피자", "사탕"],
  5: ["열쇠", "스마트폰", "머그컵", "가위", "책"],
  6: ["강아지", "고양이", "토끼", "새", "물고기"],
  7: ["로켓", "별", "행성", "UFO", "달"],
  8: ["파도", "나무", "구름", "태양", "산"],
  9: ["꽃", "나뭇잎", "선인장", "버섯", "나무"],
  10: ["마법 지팡이", "마법 모자", "물약", "별", "크리스탈"]
};

export function getShapeName(conceptId: number, level: number) {
  const names = SHAPE_NAMES[conceptId] || SHAPE_NAMES[5];
  return names[(level - 1) % names.length];
}

export function generateShapedMaze(conceptId: number, level: number) {
  const MASKS: Record<number, string[][]> = {
    1: [ // Dinosaur
      ["001111", "001111", "001111", "101111", "111111", "111110", "010010"], // T-Rex
      ["0001000", "1101011", "0111110", "0011100", "0001000"], // Pteranodon
      ["000011", "000011", "000110", "001100", "111110", "111110", "100010"], // Brachiosaurus
      ["0011100", "0111110", "1111111", "0101010"], // Ankylosaurus
      ["101000", "111110", "111111", "011110", "010010"] // Triceratops
    ],
    2: [ // Car
      ["00111100", "01111110", "11111111", "01000010"], // Sedan
      ["0000011", "1111111", "1111111", "0100010"], // Truck
      ["1111111", "1111111", "1111111", "0101010"], // Bus
      ["0001100", "0111110", "1111111", "0100010"], // Sports Car
      ["0001000", "0111110", "1111111", "0101010"] // F1
    ],
    3: [ // Building
      ["001100", "011110", "111111", "111111", "110011"], // House
      ["0110", "0110", "0110", "0110", "1111"], // Skyscraper
      ["10101", "11111", "11111", "11111"], // Castle
      ["010100", "010100", "111111", "111111"], // Factory
      ["00100", "01110", "11111", "11011"] // Tent
    ],
    4: [ // Food
      ["00100", "01110", "11111", "11111", "01110"], // Apple
      ["01110", "11111", "11111", "01110"], // Burger
      ["01110", "11111", "01110", "00100"], // Ice Cream
      ["11111", "01110", "00100"], // Pizza
      ["10001", "01110", "01110", "10001"] // Candy
    ],
    5: [ // Object
      ["110000", "111111", "110101"], // Key
      ["111", "111", "111", "111"], // Phone
      ["1111", "1111", "0110"], // Cup
      ["10001", "01010", "00100", "01010", "10001"], // Scissors
      ["11111", "11111", "11111"] // Book
    ],
    6: [ // Animal
      ["010010", "011110", "111111", "011110", "010010"], // Dog
      ["10001", "11111", "11111", "01110"], // Cat
      ["1010", "1010", "1111", "1111", "0110"], // Rabbit
      ["0010", "0111", "1111", "0110"], // Bird
      ["00100", "11111", "11111", "00100"] // Fish
    ],
    7: [ // Space
      ["00100", "01110", "01110", "11111", "10101"], // Rocket
      ["00100", "11111", "01110", "10001"], // Star
      ["01110", "11111", "11111", "01110"], // Planet
      ["001100", "011110", "111111", "001100"], // UFO
      ["011", "110", "110", "011"] // Moon
    ],
    8: [ // Nature
      ["000110", "011111", "111100", "011111", "000110"], // Wave
      ["00100", "01110", "11111", "00100", "00100"], // Tree
      ["001100", "011110", "111111"], // Cloud
      ["10101", "01110", "11111", "01110", "10101"], // Sun
      ["00100", "01110", "11111"] // Mountain
    ],
    9: [ // Plant
      ["01010", "11111", "01110", "00100", "00100"], // Flower
      ["0010", "0111", "1110", "1000"], // Leaf
      ["01010", "11111", "00100", "00100"], // Cactus
      ["01110", "11111", "00100", "00100"], // Mushroom
      ["01110", "11111", "00100", "00100"] // Tree
    ],
    10: [ // Magic
      ["0001", "0010", "0100", "1000"], // Wand
      ["00100", "01110", "11111"], // Hat
      ["0110", "0110", "1111", "1111"], // Potion
      ["00100", "11111", "01110", "10101"], // Star
      ["010", "111", "111", "010"] // Crystal
    ]
  };

  const conceptMasks = MASKS[conceptId] || MASKS[5];
  const baseMask = conceptMasks[(level - 1) % conceptMasks.length];
  // Scale increases every 5 levels to make it harder and larger
  const scale = 1 + Math.floor((level - 1) / 5); 
  
  const maskHeight = baseMask.length * scale;
  const maskWidth = baseMask[0].length * scale;
  const mask = Array.from({ length: maskHeight }, () => Array(maskWidth).fill(false));
  
  for (let y = 0; y < baseMask.length; y++) {
    for (let x = 0; x < baseMask[y].length; x++) {
      if (baseMask[y][x] === '1') {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            mask[y * scale + sy][x * scale + sx] = true;
          }
        }
      }
    }
  }

  const gridWidth = maskWidth * 2 + 1;
  const gridHeight = maskHeight * 2 + 1;
  const maze = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(-1));

  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {
      if (mask[y][x]) {
        for (let dy = 0; dy <= 2; dy++) {
          for (let dx = 0; dx <= 2; dx++) {
            maze[y * 2 + dy][x * 2 + dx] = 1;
          }
        }
      }
    }
  }

  let startX = -1, startY = -1;
  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {
      if (mask[y][x]) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  function carve(x: number, y: number) {
    maze[y * 2 + 1][x * 2 + 1] = 0;
    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < maskWidth && ny >= 0 && ny < maskHeight && mask[ny][nx] && maze[ny * 2 + 1][nx * 2 + 1] === 1) {
        maze[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0;
        carve(nx, ny);
      }
    }
  }

  if (startX !== -1) {
    carve(startX, startY);
  }

  let validCells: [number, number][] = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (maze[y][x] === 0) {
        validCells.push([x, y]);
      }
    }
  }

  let startPos = validCells[0] ? { x: validCells[0][0], y: validCells[0][1] } : { x: 1, y: 1 };
  
  // Find the furthest point from startPos using BFS
  let endPos = { ...startPos };
  if (validCells.length > 0) {
    const queue = [[startPos.x, startPos.y]];
    const visited = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));
    visited[startPos.y][startPos.x] = true;
    
    let furthestNode = [startPos.x, startPos.y];
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      furthestNode = [x, y];
      
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && maze[ny][nx] === 0 && !visited[ny][nx]) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
    endPos = { x: furthestNode[0], y: furthestNode[1] };
  }

  return { 
    maze, 
    startPos, 
    endPos 
  };
}

export function findShortestPath(maze: number[][], startX: number, startY: number, endX: number, endY: number) {
  const queue = [[startX, startY]];
  const visited = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(false));
  const parent = new Map();

  visited[startY][startX] = true;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    if (x === endX && y === endY) {
      const path = [];
      let curr = `${x},${y}`;
      while (curr) {
        const [cx, cy] = curr.split(',').map(Number);
        path.push([cx, cy]);
        curr = parent.get(curr);
      }
      return path.reverse();
    }

    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length && maze[ny][nx] === 0 && !visited[ny][nx]) {
        visited[ny][nx] = true;
        parent.set(`${nx},${ny}`, `${x},${y}`);
        queue.push([nx, ny]);
      }
    }
  }
  return [];
}
