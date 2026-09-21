import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import concurrently from 'concurrently';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

function resolvePythonPath() {
  const isWin = process.platform === 'win32';
  const candidates = [
    path.join(repoRoot, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python'),
    path.join(repoRoot, 'venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to system python
  return isWin ? 'python.exe' : 'python3';
}

const pythonPath = resolvePythonPath();
console.log(`[dev:all] Using Python executable: ${pythonPath}`);
console.log(`[dev:all] Repo root: ${repoRoot}`);

const { result } = concurrently(
  [
    {
      command: `"${pythonPath}" -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload`,
      name: 'backend',
      prefixColor: 'blue',
      cwd: repoRoot,
    },
    {
      command: 'vite',
      name: 'frontend',
      prefixColor: 'green',
      cwd: path.resolve(__dirname, '..'),
    },
  ],
  {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 0,
  }
);

result.then(
  () => console.log('[dev:all] All servers stopped.'),
  (err) => console.error('[dev:all] Error running servers:', err)
);
