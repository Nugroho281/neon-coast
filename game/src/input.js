// Keyboard, mouse and mandatory touch controls (virtual joystick + buttons).
export function createInput() {
  const keys = {};
  const touch = { active: false, jx: 0, jy: 0, joyId: null, joyCx: 0, joyCy: 0, enter: false, pause: false };
  addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  function bind(canvas) {
    canvas.addEventListener('touchstart', (e) => {
      touch.active = true;
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.45 && touch.joyId === null) { touch.joyId = t.identifier; touch.joyCx = t.clientX; touch.joyCy = t.clientY; touch.jx = 0; touch.jy = 0; }
        else if (t.clientX > innerWidth * 0.78 && t.clientY > innerHeight * 0.62) touch.enter = true;
        else if (t.clientX > innerWidth * 0.78 && t.clientY < innerHeight * 0.3) touch.pause = true;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) if (t.identifier === touch.joyId) {
        touch.jx = Math.max(-1, Math.min(1, (t.clientX - touch.joyCx) / 55));
        touch.jy = Math.max(-1, Math.min(1, (t.clientY - touch.joyCy) / 55));
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === touch.joyId) { touch.joyId = null; touch.jx = 0; touch.jy = 0; } } touch.enter = false; };
    canvas.addEventListener('touchend', end); canvas.addEventListener('touchcancel', end);
    canvas.addEventListener('mousedown', () => { touch.clicked = true; });
  }
  function axis() {
    let x = 0, y = 0;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    if (touch.joyId !== null) { x += touch.jx; y += touch.jy; }
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }
  return { keys, touch, bind, axis,
    enterPressed() { return !!keys['e'] || touch.enter; },
    pausePressed() { return !!keys['p'] || !!keys['escape'] || touch.pause; },
    startPressed() { return !!keys['enter'] || !!keys[' '] || touch.clicked || touch.enter; },
    clearClick() { touch.clicked = false; touch.pause = false; } };
}
