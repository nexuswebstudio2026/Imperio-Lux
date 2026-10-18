import type { CapacitorConfig } from '@capacitor/cli';
import { loadEnv } from 'vite';

const env = loadEnv('native', process.cwd(), 'CAPACITOR_');
const siteUrl = process.env.CAPACITOR_SERVER_URL || env.CAPACITOR_SERVER_URL || 'https://imperiolux.vercel.app/';
const parsedSiteUrl = new URL(siteUrl);

const config: CapacitorConfig = {
  appId: 'com.nexuswebstudio.imperiolux',
  appName: 'Imperio Lux',
  webDir: 'dist',
  server: {
    // Keep mobile installs pointed at the current website. Override with
    // CAPACITOR_SERVER_URL when developing against a local/LAN server.
    url: siteUrl,
    allowNavigation: [parsedSiteUrl.hostname],
    cleartext: parsedSiteUrl.protocol === 'http:',
    androidScheme: 'https',
  },
};

export default config;
