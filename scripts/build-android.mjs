import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const env = { ...process.env };
const sdk = env.ANDROID_HOME || path.join(env.LOCALAPPDATA || '', 'Android', 'Sdk');
if (!fs.existsSync(sdk)) throw new Error('Configure ANDROID_HOME com o Android SDK 36.');
env.ANDROID_HOME = sdk;
const jdkRoot = 'C:/Program Files/Microsoft';
if (!env.JAVA_HOME && fs.existsSync(jdkRoot)) {
  const jdk = fs.readdirSync(jdkRoot).find(name => name.startsWith('jdk-21'));
  if (jdk) env.JAVA_HOME = path.join(jdkRoot, jdk);
}
const result = spawnSync(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug', '--no-daemon'], {
  cwd: 'android', env, shell: process.platform === 'win32', stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status || 1);
fs.mkdirSync('release', { recursive: true });
const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const apkPath = path.join('release', `NILO-${version}-debug.apk`);
fs.copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', apkPath);
console.log(`APK de teste: ${apkPath}`);
