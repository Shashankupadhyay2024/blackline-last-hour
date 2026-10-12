// BLACKLINE: LAST HOUR — desktop shell. Loads the offline game in a fullscreen window.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
app.setName('BLACKLINE');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let win;
function create() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 540, backgroundColor: '#000000', title: 'BLACKLINE: LAST HOUR', show: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false, spellcheck: false }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => { win.show(); win.setFullScreen(true); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // keep every navigation inside the game file (chapters load as index.html?m=N)
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.meta && input.control && input.key.toLowerCase() === 'f'))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}
const menu = Menu.buildFromTemplate([
  { label: 'BLACKLINE', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit', label: 'Quit BLACKLINE' }] },
  { label: 'View', submenu: [{ role: 'togglefullscreen' }, { role: 'resetZoom' }] },
  { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] }
]);
app.whenReady().then(() => { Menu.setApplicationMenu(menu); create(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); }); });
app.on('window-all-closed', () => app.quit());
