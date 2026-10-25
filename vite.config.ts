import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');

/**
 * Les fichiers de data/ sont lus par le jeu à l'exécution (fetch), pas compilés dans le code.
 * - en dev : servis sous /data/ et la page se recharge quand on les modifie ;
 * - au build : copiés tels quels dans dist/data/ (modifiables après déploiement).
 */
function gameData(): Plugin {
  return {
    name: 'game-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        const file = path.join(dataDir, name);
        if (!file.startsWith(dataDir + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          return next();
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        fs.createReadStream(file).pipe(res);
      });
      server.watcher.add(dataDir);
      server.watcher.on('change', (file) => {
        if (file.startsWith(dataDir)) server.ws.send({ type: 'full-reload' });
      });
    },
    generateBundle() {
      for (const name of fs.readdirSync(dataDir)) {
        if (!name.endsWith('.json')) continue;
        this.emitFile({ type: 'asset', fileName: `data/${name}`, source: fs.readFileSync(path.join(dataDir, name)) });
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [gameData()],
});
