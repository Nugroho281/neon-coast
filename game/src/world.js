// Original coastal city layout: road grid, solid buildings, beach + water on the east edge.
import { makeRng } from './random.js';
import { WORLD } from './config.js';

export function buildWorld(seed) {
  const rng = makeRng(seed * 7919 + 13);
  const buildings = [];
  const palms = [];
  const roadW = 120;
  const block = 300;
  // Water: east strip x >= 2050. Beach: 1950..2050.
  for (let bx = 60; bx < 1900; bx += block) {
    for (let by = 60; by < WORLD.h - 120; by += block) {
      // Skip blocks that are mostly road intersections; place 1-2 buildings per block.
      const bw = 150 + Math.floor(rng() * 60);
      const bh = 130 + Math.floor(rng() * 60);
      buildings.push({ x: bx + 50, y: by + 40, w: bw, h: bh, c: ['#3b4a6b', '#54406b', '#6b4a3b', '#2f5d5a', '#715c2e'][Math.floor(rng() * 5)], floors: 3 + Math.floor(rng() * 5) });
      if (rng() > 0.45) palms.push({ x: bx + 20 + rng() * 220, y: by + 230 + rng() * 30 });
    }
  }
  for (let i = 0; i < 26; i++) palms.push({ x: 1965 + rng() * 60, y: 40 + rng() * (WORLD.h - 80) });
  const spots = [
    { name: 'Marina', x: 1980, y: 220 }, { name: 'Cafe', x: 420, y: 420 },
    { name: 'Depot', x: 300, y: 1300 }, { name: 'Lighthouse Point', x: 1990, y: 1420 },
    { name: 'Garage', x: 1050, y: 750 }, { name: 'Safehouse', x: 620, y: 180 },
    { name: 'Pier', x: 2000, y: 820 }, { name: 'Start', x: 500, y: 900 },
  ];
  const parked = [];
  const carCols = ['#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#ecf0f1', '#e67e22', '#1abc9c', '#fd79a8'];
  for (let i = 0; i < 14; i++) {
    parked.push({ x: 180 + rng() * 1650, y: 180 + rng() * 1250, a: Math.floor(rng() * 4) * Math.PI / 2, c: carCols[i % carCols.length], speed: 0, police: false, traffic: false, hp: 100 });
  }
  const traffic = [];
  for (let i = 0; i < 6; i++) {
    const horiz = i % 2 === 0;
    traffic.push({ x: 200 + rng() * 1600, y: horiz ? 300 * (1 + Math.floor(rng() * 4)) + 60 : 200 + rng() * 1200, a: horiz ? 0 : Math.PI / 2, c: carCols[(i + 3) % carCols.length], speed: 1.4, police: false, traffic: true, hp: 100, horiz });
  }
  return { buildings, palms, spots, parked, traffic, roadW, block, waterX: 2050, beachX: 1950 };
}
export function isRoad(x, y, world) {
  const m = world.block;
  const rx = ((x % m) + m) % m, ry = ((y % m) + m) % m;
  return rx < world.roadW || ry < world.roadW || x >= world.beachX;
}
export function collide(x, y, r, world) {
  if (x < r || y < r || x > WORLD.w - r || y > WORLD.h - r) return true;
  if (x > world.waterX + 10) return true; // water is not drivable/walkable
  for (const b of world.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}
