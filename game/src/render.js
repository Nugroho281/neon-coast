// Canvas rendering: city, cars, player, HUD, minimap, touch controls, screens.
import { WORLD, VIEW } from './config.js';

export function drawCar(ctx, car, cam) {
  const x = car.x - cam.x, y = car.y - cam.y;
  if (x < -60 || y < -60 || x > VIEW.w + 60 || y > VIEW.h + 60) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(car.a || 0);
  ctx.fillStyle = car.police ? '#f5f6fa' : car.c;
  ctx.fillRect(-20, -11, 40, 22);
  ctx.fillStyle = car.police ? '#273c75' : 'rgba(0,0,0,0.35)';
  ctx.fillRect(-7, -9, 16, 18);
  if (car.police) { ctx.fillStyle = '#e84118'; ctx.fillRect(-3, -11, 6, 5); ctx.fillStyle = '#0097e6'; ctx.fillRect(-3, 6, 6, 5); }
  ctx.fillStyle = '#111'; ctx.fillRect(-16, -13, 8, 4); ctx.fillRect(8, -13, 8, 4); ctx.fillRect(-16, 9, 8, 4); ctx.fillRect(8, 9, 8, 4);
  ctx.restore();
}
export function render(ctx, g, input) {
  const cam = { x: Math.max(0, Math.min(WORLD.w - VIEW.w, g.player.x - VIEW.w / 2)), y: Math.max(0, Math.min(WORLD.h - VIEW.h, g.player.y - VIEW.h / 2)) };
  // Ground: grass/blocks, roads, beach, water
  ctx.fillStyle = '#7f9c5a'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#4a4a52';
  const m = g.world.block, rw = g.world.roadW;
  for (let x = -((cam.x % m)) - m; x < VIEW.w + m; x += m) ctx.fillRect(x, 0, rw, VIEW.h);
  for (let y = -((cam.y % m)) - m; y < VIEW.h + m; y += m) ctx.fillRect(0, y, VIEW.w, rw);
  ctx.fillStyle = '#e8d28a'; ctx.fillRect(g.world.beachX - cam.x, 0, g.world.waterX - g.world.beachX, VIEW.h);
  ctx.fillStyle = '#2a7fbf'; ctx.fillRect(g.world.waterX - cam.x, 0, VIEW.w, VIEW.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([18, 22]); ctx.lineWidth = 3;
  for (let x = -((cam.x % m)) - m + rw / 2; x < VIEW.w + m; x += m) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.h); ctx.stroke(); }
  ctx.setLineDash([]);
  for (const p of g.world.palms) { const x = p.x - cam.x, y = p.y - cam.y; if (x < -20 || y < -20 || x > VIEW.w + 20 || y > VIEW.h + 20) continue; ctx.fillStyle = '#6d4c2f'; ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(x, y - 8, 11, 0, 7); ctx.fill(); }
  for (const b of g.world.buildings) { const x = b.x - cam.x, y = b.y - cam.y; if (x + b.w < 0 || y + b.h < 0 || x > VIEW.w || y > VIEW.h) continue; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 6, y + 8, b.w, b.h); ctx.fillStyle = b.c; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = '#ffeaa7'; for (let wy = y + 12; wy < y + b.h - 10; wy += 24) for (let wx = x + 12; wx < x + b.w - 10; wx += 26) ctx.fillRect(wx, wy, 10, 8); }
  // Mission marker
  const t = g.currentTarget();
  if (t && g.state === 'playing') { const x = t.x - cam.x, y = t.y - cam.y; ctx.strokeStyle = '#ffd32a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 26 + Math.sin(g.tick / 12) * 5, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.name, x, y - 36); }
  for (const c of g.cars) drawCar(ctx, c, cam);
  // Player (on foot)
  if (!g.driving) { const x = g.player.x - cam.x, y = g.player.y - cam.y; ctx.fillStyle = '#ff6b81'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(x, y - 3, 6, 0, 7); ctx.fill(); }
  drawHUD(ctx, g);
  drawMinimap(ctx, g);
  if (input.touch.active && g.state === 'playing') drawTouch(ctx, input);
  if (g.state === 'title') screen(ctx, 'NEON COAST', ['An original open-city driving adventure.', 'Complete 6 missions. Outrun the heat. Rule the coast.', '', 'WASD / Arrows — move & drive    E — enter / exit car', 'P — pause    Touch: joystick + buttons', '', 'Press ENTER or tap to start']);
  if (g.state === 'paused') screen(ctx, 'PAUSED', ['Press P to resume']);
  if (g.state === 'over') screen(ctx, 'BUSTED / WRECKED', ['Your run is over. Cash $' + g.cash + '  Score ' + g.score, 'Press ENTER to restart']);
  if (g.state === 'win') screen(ctx, 'CAMPAIGN COMPLETE!', ['You finished all 6 missions of Neon Coast.', 'Final cash $' + g.cash + '   Score ' + g.score, 'Free roam or press ENTER to play again']);
}
function drawHUD(ctx, g) {
  ctx.fillStyle = 'rgba(5,10,25,0.72)'; ctx.fillRect(0, 0, VIEW.w, 54);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('NEON COAST', 12, 22);
  ctx.font = '14px sans-serif';
  ctx.fillText('Health ' + Math.max(0, Math.round(g.player.hp)), 12, 44);
  ctx.fillText('Cash $' + g.cash, 140, 44); ctx.fillText('Score ' + g.score, 260, 44);
  ctx.fillStyle = '#ffd32a'; ctx.font = '18px sans-serif'; ctx.fillText('★'.repeat(g.heat) + '☆'.repeat(Math.max(0, 5 - g.heat)), 400, 44);
  ctx.fillStyle = '#aee9ff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(g.state === 'playing' ? (g.currentMission() ? ('Mission ' + (g.missionIdx + 1) + '/6: ' + g.currentMission().title) : 'Free roam') : '', VIEW.w - 12, 22);
  ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.fillText(g.message || '', VIEW.w - 12, 44);
}
function drawMinimap(ctx, g) {
  const mw = 150, mh = 100, ox = VIEW.w - mw - 10, oy = 64, sx = mw / WORLD.w, sy = mh / WORLD.h;
  ctx.fillStyle = 'rgba(5,10,25,0.8)'; ctx.fillRect(ox - 3, oy - 3, mw + 6, mh + 6);
  ctx.fillStyle = '#4a4a52'; ctx.fillRect(ox, oy, mw, mh);
  ctx.fillStyle = '#2a7fbf'; ctx.fillRect(ox + g.world.waterX * sx, oy, mw - g.world.waterX * sx, mh);
  ctx.fillStyle = '#ffd32a'; const t = g.currentTarget(); if (t) ctx.fillRect(ox + t.x * sx - 3, oy + t.y * sy - 3, 6, 6);
  ctx.fillStyle = '#ff4757'; for (const c of g.cars) if (c.police) ctx.fillRect(ox + c.x * sx - 2, oy + c.y * sy - 2, 4, 4);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + g.player.x * sx, oy + g.player.y * sy, 3.5, 0, 7); ctx.fill();
}
function drawTouch(ctx, input) {
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(85, VIEW.h - 85, 52, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(85 + input.touch.jx * 30, VIEW.h - 85 + input.touch.jy * 30, 24, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,209,42,0.55)'; ctx.beginPath(); ctx.arc(VIEW.w - 70, VIEW.h - 80, 32, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E', VIEW.w - 70, VIEW.h - 75);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(VIEW.w - 70, 80, 22, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('II', VIEW.w - 70, 85);
}
function screen(ctx, title, lines) {
  ctx.fillStyle = 'rgba(4,8,20,0.78)'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, VIEW.w / 2, 190);
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, VIEW.w / 2, 250 + i * 28));
}
