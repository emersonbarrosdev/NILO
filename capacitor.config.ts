import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emerson.nilo', appName: 'NILO', webDir: 'dist',
  plugins: { SystemBars: { insetsHandling: 'css' } },
  android: { backgroundColor: '#071d14' },
};
export default config;
