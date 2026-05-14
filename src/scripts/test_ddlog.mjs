// Test harness to import src/src/utils/doglog.js in Node and trigger ddLog
import path from 'path';
import url from 'url';

// Make a minimal browser-like global for the module
global.window = global.window || {};
// Force local dump of payloads
global.window.__DOGLOG_LOCAL_DUMP__ = true;

// Set an env var gate as well
process.env.REACT_APP_DOGLOG_LOCAL_DUMP = '1';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const doglogPath = path.join(repoRoot, 'src', 'utils', 'doglog.js');
const doglogUrl = url.pathToFileURL(doglogPath).href;

async function run(){
  console.log('Importing doglog from', doglogUrl);
  const mod = await import(doglogUrl);
  const { initDoglog, ddLog } = mod;
  try{ initDoglog(); }catch(e){ console.warn('initDoglog threw', e); }

  // Trigger a sample error log
  const err = new Error('simulated timeout for test ❤');
  ddLog('error', 'Simulated gateway timeout test', { source: 'unit-test', args: ['sample'], error: err });

  // Also trigger a console.warn through the wrapped console
  console.warn('Simulated warning', { detail: 'something odd' });
}

run().then(()=>console.log('done')).catch((e)=>{ console.error('test failed', e); process.exit(1); });
