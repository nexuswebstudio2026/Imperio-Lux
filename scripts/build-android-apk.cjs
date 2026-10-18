const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : './gradlew';
const args = isWindows ? ['/d', '/s', '/c', 'gradlew.bat assembleDebug'] : ['assembleDebug'];
const result = spawnSync(command, args, {
  cwd: androidDir,
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const source = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const outputDir = path.join(root, 'release', 'android');
const output = path.join(outputDir, 'Imperio-Lux-Android.apk');

fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(source, output);
console.log(`APK listo: ${output}`);
