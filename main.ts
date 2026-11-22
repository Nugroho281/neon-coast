// A working gta6-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. Only the plumbing, not an open world: Block
// Dodger, a plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a
// title screen, score, lives and levels, game over and restart, flat colours and no sound. Build
// your own open-world crime game in its place (three.js or any library you vendor under game/),
// put your 3 or 4 PNG or JPEG screenshots in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, DOSSIER_MAX_BYTES, DOSSIER_SCHEMA } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Preflight: fail here, with a message that names what is wrong, when this file is not run from the
// entry's root. Without it the copies below die inside cpSync with a bare ENOENT that says nothing
// about the actual problem (a checkout missing game/, or main.ts copied somewhere on its own).
for (const needed of ['game', join('game', 'index.html')]) {
  if (!existsSync(join(here, needed))) {
    console.error(`main: cannot hand in: ${needed} is missing beside main.ts — run \`node main.ts\` from the entry's root, with game/ and screenshots/ beside it.`);
    process.exit(1);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossierBytes = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossierBytes);

// Self-check: read the dossier back off disk and hold it to the schema the judge reads (the vendored
// library's DOSSIER_SCHEMA), so a hand-in that ever writes the wrong shape fails here, loudly and
// before grading, instead of scoring as a broken entry. This only reads: the bytes on disk are the
// bytes buildDossier wrote, untouched.
const written = readFileSync(join(out, 'dossier.json'));
const dossier = JSON.parse(written.toString('utf8'));
const problems = [];
if (dossier.schema !== DOSSIER_SCHEMA) problems.push(`schema is ${JSON.stringify(dossier.schema)}, not ${DOSSIER_SCHEMA}`);
if (!Array.isArray(dossier.images) || dossier.images.length < 1 || dossier.images.length > 4) {
  problems.push('images must hold 1 to 4 screenshots');
} else if (dossier.images.some((img) => typeof img.name !== 'string' || img.name === '')) {
  problems.push('a screenshot in images has no name');
}
if (!Number.isInteger(dossier.cover) || dossier.cover < 0 || dossier.cover >= (Array.isArray(dossier.images) ? dossier.images.length : 0)) {
  problems.push(`cover (${JSON.stringify(dossier.cover)}) does not index a screenshot`);
}
if (typeof dossier.text !== 'string' || !dossier.text.startsWith('## Game\n')) problems.push('text does not open with the ## Game block');
if (written.length > DOSSIER_MAX_BYTES) problems.push(`the dossier is ${written.length} bytes, over the ${DOSSIER_MAX_BYTES} a dossier may hold`);
if (problems.length > 0) {
  console.error(`main: dossier self-check failed: ${problems.join('; ')}`);
  process.exit(1);
}
console.log(
  `main: handed in ${dossier.images.length} screenshots (cover: ${dossier.images[dossier.cover].name}), ` +
    `dossier ${written.length} bytes with ${Buffer.byteLength(dossier.text, 'utf8')} bytes of game text.`,
);
