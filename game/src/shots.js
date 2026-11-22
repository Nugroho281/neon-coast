// Deterministic screenshot scenes for ?shot=start|play|end&seed=N
export function parseShot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  const seed = parseInt(q.get('seed') || '1', 10) || 1;
  const debug = q.get('debug') === '1';
  return { shot, seed, debug };
}
export function applyShot(game, shot) {
  if (!shot) return;
  if (shot === 'start') { game.state = 'title'; }
  if (shot === 'play') {
    game.startGame();
    game.player.x = 520; game.player.y = 880;
    const car = game.cars[0]; if (car) { game.enterCar(car); }
    game.missionIdx = 1; game.heat = 2; game.cash = 400; game.score = 1250;
    game.spawnPolice(); game.spawnPolice();
    game.message = 'Mission 2: Cafe Drop — deliver the parcel!';
  }
  if (shot === 'end') {
    game.startGame();
    game.missionIdx = 6; game.campaignDone = true; game.state = 'win';
    game.cash = 2900; game.score = 9800; game.heat = 0;
  }
}
