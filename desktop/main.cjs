const { app, BrowserWindow, session, shell } = require('electron');

const siteUrl = process.env.IMPERIO_WEB_URL || 'https://imperiolux.vercel.app';
const siteOrigin = new URL(siteUrl).origin;

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#101827',
    title: 'Imperio Lux',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') && new URL(url).origin !== siteOrigin) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== siteOrigin) event.preventDefault();
  });
  void window.loadURL(siteUrl);
}

app.whenReady().then(() => {
  const permittedOrigins = new Set([siteOrigin]);
  const allowedPermissions = new Set(['media', 'geolocation']);

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();
    let requestingOrigin;
    try {
      requestingOrigin = new URL(requestingUrl).origin;
    } catch {
      callback(false);
      return;
    }

    callback(permittedOrigins.has(requestingOrigin) && allowedPermissions.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return permittedOrigins.has(requestingOrigin) && allowedPermissions.has(permission);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
