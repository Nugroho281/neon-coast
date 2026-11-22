// Neon Coast — a wholly original open-city action game. Vanilla JS + Canvas, no assets, offline.
import { WORLD, MISSIONS } from './config.js';
import { buildWorld, collide } from './world.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { parseShot, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const { shot, seed, debug } = parseShot();
const input = createInput(); input.bind(canvas);

const game = {
  state: 'title', tick: 0, world: buildWorld(seed), player: { x: 500, y: 900, hp: 100, a: 0 },
  cars: [], driving: null, heat: 0, cash: 0, score: 0, missionIdx: 0, campaignDone: false,
  message: '', carrying: false, invuln: 0,
  currentMission() { return MISSIONS[this.missionIdx] || null; },
  currentTarget() {
    const m = this.currentMission(); if (!m || this.state !== 'playing' && this.state !== 'title') { /* still show in play shot */ }
    if (!m) return this.world.spots.find(s => s.name === 'Pier');
    // Target sequence: goto/deliver/escape each resolve to a named spot, in order.
    const order = ['Marina', 'Cafe', 'Lighthouse Point', 'Garage', 'Safehouse', 'Pier'];
    if (m.type === 'deliver' && this.missionIdx === 2 && !this.carrying) return this.world.spots.find(s => s.name === 'Depot');
    return this.world.spots.find(s => s.name === order[this.missionIdx]) || this.world.spots[0];
  },
  startGame() {
    this.world = buildWorld(seed);
    this.cars = [...this.world.parked.map(c => ({ ...c })), ...this.world.traffic.map(c => ({ ...c }))];
    this.player = { x: 500, y: 900, hp: 100, a: 0 }; this.driving = null;
    this.heat = 0; this.cash = 0; this.score = 0; this.missionIdx = 0; this.campaignDone = false; this.carrying = false;
    this.state = 'playing'; this.message = 'Mission 1: ' + MISSIONS[0].text;
  },
  enterCar(car) { this.driving = car; this.player.x = car.x; this.player.y = car.y; },
  exitCar() { if (this.driving) { this.player.x = this.driving.x + 30; this.player.y = this.driving.y + 30; this.driving = null; } },
  nearestCar() { let best = null, bd = 60; for (const c of this.cars) { const d = Math.hypot(c.x - this.player.x, c.y - this.player.y); if (d < bd) { bd = d; best = c; } } return best; },
  spawnPolice() {
    const a = Math.random() * Math.PI * 2;
    this.cars.push({ x: this.player.x + Math.cos(a) * 520, y: this.player.y + Math.sin(a) * 520, a: 0, c: '#fff', speed: 0, police: true, traffic: false, hp: 100 });
  },
  addHeat(n) { this.heat = Math.max(0, Math.min(5, this.heat + n)); },
  completeMission() {
    const m = this.currentMission(); if (!m) return;
    this.cash += m.reward; this.score += m.reward * 2; this.carrying = false;
    this.missionIdx++;
    if (this.missionIdx >= MISSIONS.length) { this.campaignDone = true; this.state = 'win'; this.message = 'Campaign complete!'; }
    else { const nm = this.currentMission(); this.addHeat(nm.heat - this.heat > 0 ? nm.heat - this.heat : 0); if (nm.heat > this.heat) this.heat = nm.heat; this.message = 'Mission ' + (this.missionIdx + 1) + ': ' + nm.text; for (let i = 0; i < this.heat; i++) this.spawnPolice(); }
  },
  update() {
    this.tick++;
    if (this.state === 'title' && input.startPressed()) { this.startGame(); input.clearClick(); return; }
    if ((this.state === 'over' || this.state === 'win') && input.startPressed()) { this.startGame(); input.clearClick(); return; }
    if (input.pausePressed() && (this.state === 'playing' || this.state === 'paused')) { this.state = this.state === 'playing' ? 'paused' : 'playing'; input.clearClick(); input.keys['p'] = false; input.keys['escape'] = false; }
    if (this.state !== 'playing') return;
    const ax = input.axis();
    // Enter / exit
    if (input.enterPressed()) {
      if (this.driving) this.exitCar(); else { const c = this.nearestCar(); if (c) { this.enterCar(c); if (c.police) this.addHeat(1); } }
      input.keys['e'] = false; input.touch.enter = false;
    }
    if (this.driving) {
      const car = this.driving;
      const turn = ax.x * 0.055, accel = -ax.y;
      car.a += turn * (car.speed !== 0 ? Math.sign(car.speed) : 0);
      car.speed = Math.max(-3.2, Math.min(6.2, (car.speed || 0) + accel * 0.22));
      if (!accel) car.speed *= 0.96;
      const nx = car.x + Math.cos(car.a) * car.speed, ny = car.y + Math.sin(car.a) * car.speed;
      if (!collide(nx, ny, 18, this.world)) { car.x = nx; car.y = ny; } else { car.speed *= -0.3; this.player.hp -= 1.5; }
      this.player.x = car.x; this.player.y = car.y;
      // Hitting traffic raises heat
      for (const o of this.cars) if (o !== car && Math.hypot(o.x - car.x, o.y - car.y) < 34 && Math.abs(car.speed) > 3) { this.addHeat(0); o.hp -= 4; }
    } else {
      const sp = 3.1, nx = this.player.x + ax.x * sp, ny = this.player.y + ax.y * sp;
      if (!collide(nx, this.player.y, 11, this.world)) this.player.x = nx;
      if (!collide(this.player.x, ny, 11, this.world)) this.player.y = ny;
    }
    // Traffic patrol
    for (const c of this.cars) {
      if (c.police) {
        const dx = this.player.x - c.x, dy = this.player.y - c.y, d = Math.hypot(dx, dy) || 1;
        const sp = 3.4 + this.heat * 0.25;
        const nx = c.x + dx / d * sp, ny = c.y + dy / d * sp;
        if (!collide(nx, ny, 17, this.world)) { c.x = nx; c.y = ny; c.a = Math.atan2(dy, dx); }
        if (d < 36) { this.player.hp -= 0.45; if (this.driving) this.driving.speed *= 0.985; }
      } else if (c.traffic) {
        const nx = c.x + Math.cos(c.a) * c.speed, ny = c.y + Math.sin(c.a) * c.speed;
        if (collide(nx, ny, 17, this.world) || nx < 60 || ny < 60 || nx > 1900 || ny > WORLD.h - 60) c.a += Math.PI / 2; else { c.x = nx; c.y = ny; }
      }
    }
    // Police spawn pressure while heated
    if (this.heat > 0 && this.tick % 420 === 0 && this.cars.filter(c => c.police).length < this.heat + 1) this.spawnPolice();
    if (this.heat === 0) this.cars = this.cars.filter(c => !c.police || Math.hypot(c.x - this.player.x, c.y - this.player.y) < 900);
    // Mission target check
    const t = this.currentTarget(), m = this.currentMission();
    if (m && t && Math.hypot(t.x - this.player.x, t.y - this.player.y) < 46) {
      if (m.type === 'deliver' && this.missionIdx === 2 && !this.carrying) { this.carrying = true; this.message = 'Case picked up! Reach the Lighthouse Point.'; }
      else this.completeMission();
    }
    // Side delivery jobs in free roam: reaching pier pays a bonus fare
    if (!m && Math.hypot(2000 - this.player.x, 820 - this.player.y) < 40 && this.tick % 300 === 0) { this.cash += 25; this.score += 50; }
    if (this.invuln > 0) this.invuln--;
    if (this.player.hp <= 0) { this.state = 'over'; }
    this.score += this.driving && Math.abs(this.driving.speed) > 1 ? 1 : 0;
  },
};
// Debug / simulation hooks (harmless): ?debug=1 exposes the game for smoke tests.
game.startGame(); game.state = shot ? game.state : 'title'; if (!shot) game.state = 'title';
applyShot(game, shot);
if (debug) window.__neonCoast = game;
window.__neonCoastState = () => ({ state: game.state, mission: game.missionIdx, cash: game.cash, x: game.player.x, y: game.player.y, driving: !!game.driving });
function loop() { game.update(); render(ctx, game, input); requestAnimationFrame(loop); }
loop();
