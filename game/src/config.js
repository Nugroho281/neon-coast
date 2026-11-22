// Neon Coast — original game configuration.
export const WORLD = { w: 2400, h: 1600, tile: 40 };
export const VIEW = { w: 960, h: 600 };
export const MISSIONS = [
  { id: 1, title: 'First Run', text: 'Drive to the marina marker and pick up the parcel.', type: 'goto', heat: 0, reward: 150 },
  { id: 2, title: 'Cafe Drop', text: 'Deliver the parcel to the cafe on Palm Row.', type: 'deliver', heat: 1, reward: 250 },
  { id: 3, title: 'Night Courier', text: 'Pick up the case at the depot, then reach the lighthouse point.', type: 'deliver', heat: 1, reward: 350 },
  { id: 4, title: 'Hot Wheels', text: 'Take the marked car and bring it to the garage, intact.', type: 'deliver', heat: 2, reward: 500 },
  { id: 5, title: 'Shake the Heat', text: 'Escape: lose the police by reaching the safehouse with heat on you.', type: 'escape', heat: 3, reward: 650 },
  { id: 6, title: 'Coast Finale', text: 'Final run: cross the city to the pier before your health runs out. Finish the campaign!', type: 'goto', heat: 3, reward: 1000 },
];
