const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const extractFileIcon = require('extract-file-icon');
const fs = require('fs');
const Updater = require('./updater/updater');

let mainWindow;
let tray = null;
let updater = null;
const iconCacheDir = path.join(app.getPath('userData'), 'icon-cache');

if (!fs.existsSync(iconCacheDir)) fs.mkdirSync(iconCacheDir, { recursive: true });

const ICON_PATH = path.join(__dirname, 'assets', 'nexus-forge.ico');
const TRAY_ICON_PATH = path.join(__dirname, 'assets', 'tray-icon.png');

const GAMES = [{
        id: 'google-chrome',
        name: 'Google Chrome',
        path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        category: 'action-rpg',
        accent: '#6366f1',
        description: 'Откройте для себя мир свободы'
    },
    {
        id: 'bloodstrike',
        name: 'Blood Strike',
        path: 'C:\\Program Files (x86)\\bloodstrike\\launcher.exe',
        category: 'shooter',
        accent: '#dc2626',
        description: 'Быстрый тактический шутер'
    },
    {
        id: 'escape-backrooms',
        name: 'Escape The Backrooms',
        path: 'C:\\Games\\EscapeTheBackrooms\\Backrooms.exe',
        category: 'horror',
        accent: '#059669',
        description: 'Выживите в бесконечных коридорах'
    },
    {
        id: 'amnezia-vpn',
        name: 'Amnezia VPN',
        path: 'C:\\Program Files\\AmneziaVPN\\AmneziaVPN.exe',
        category: 'utility',
        accent: '#7c3aed',
        description: 'Безопасное VPN-подключение'
    },
    {
        id: 'counter-strike-source',
        name: 'Counter-Strike: Source',
        path: 'C:\\Program Files (x86)\\Counter-Strike Source\\launcher.exe',
        category: 'shooter',
        accent: '#f59e0b',
        description: 'Классический тактический шутер'
    }
];

function createWindow() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();

        return;
    }

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 620,
        minWidth: 1100,
        minHeight: 620,
        maxWidth: 1100,
        maxHeight: 620,
        resizable: false,
        fullscreenable: false,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        icon: ICON_PATH,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        skipTaskbar: false
    });

    mainWindow.setFullScreenable(false);

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' || (input.alt && input.key === 'Enter')) event.preventDefault();
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (updater) updater.startAutoCheck(mainWindow);
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();

            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => mainWindow = null);
}

function createTray() {
    if (tray) {
        tray.destroy();

        tray = null;
    }

    let trayIcon;

    try {
        if (fs.existsSync(TRAY_ICON_PATH)) {
            trayIcon = nativeImage.createFromPath(TRAY_ICON_PATH);

            if (process.platform === 'win32') trayIcon = trayIcon.resize({ width: 16, height: 16 });
        } else trayIcon = nativeImage.createEmpty();
    } catch (e) {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Nexus Forge');

    const contextMenu = Menu.buildFromTemplate([{
            label: 'Развернуть Nexus Forge',
            click: () => {
                createWindow();
            }
        },
        {
            label: 'Проверить обновления',
            click: async () => {
                if (updater) {
                    const result = await updater.checkForUpdates(false);

                    if (!result.hasUpdate) {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Обновления',
                            message: 'У вас установлена последняя версия!',
                            detail: `Текущая версия: ${updater.currentVersion}`
                        });
                    }
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Запустить Wuthering Waves',
            click: () => launchGame(GAMES[0].path)
        },
        {
            label: 'Запустить Blood Strike',
            click: () => launchGame(GAMES[1].path)
        },
        {
            label: 'Запустить CS: Source',
            click: () => launchGame(GAMES[4].path)
        },
        { type: 'separator' },
        {
            label: 'Выход',
            click: () => {
                app.isQuiting = true;

                if (tray) {
                    tray.destroy();

                    tray = null;
                }

                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        createWindow();
    });
}

function launchGame(gamePath) {
    exec(`"${gamePath}"`, (error) => {
        if (error) console.error('Launch error:', error);
    });
}

function getCachePath(exePath) {
    const hash = Buffer.from(exePath).toString('base64').replace(/[/+=]/g, '_');

    return path.join(iconCacheDir, `${hash}.png`);
}

function getCachedIcon(exePath) {
    const cachePath = getCachePath(exePath);

    if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath);
        const age = Date.now() - stats.mtimeMs;

        if (age < 7 * 24 * 60 * 60 * 1000) {
            const buffer = fs.readFileSync(cachePath);

            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
    }
}

function saveIconToCache(exePath, buffer) {
    try {
        const cachePath = getCachePath(exePath);

        fs.writeFileSync(cachePath, buffer);
    } catch (e) {
        console.error('Failed to cache icon:', e);
    }
}

async function extractIconWithRetry(exePath, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const buffer = extractFileIcon(exePath);

            if (buffer && buffer.length > 0) return buffer;
        } catch (e) {
            console.log(`Icon extraction attempt ${i + 1} failed for ${exePath}`);

            if (i < retries - 1) await new Promise(r => setTimeout(r, 100));
        }
    }
}

async function getExeIcon(exePath) {
    const cached = getCachedIcon(exePath);

    if (cached) return cached;

    if (!fs.existsSync(exePath)) {
        console.warn(`Executable not found: ${exePath}`);

        return;
    }

    const buffer = await extractIconWithRetry(exePath);

    if (buffer) {
        saveIconToCache(exePath, buffer);

        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
}

ipcMain.handle('get-games', async () => {
    const gamesWithIcons = await Promise.all(
        GAMES.map(async (game) => {
            const icon = await getExeIcon(game.path);

            return { ...game, icon };
        })
    );

    return gamesWithIcons;
});

ipcMain.handle('launch-game', async (event, gamePath) => {
    return new Promise((resolve, reject) => {
        exec(`"${gamePath}"`, (error) => {
            if (error) {
                console.error('Launch error:', error);

                reject(error.message);
            }

            else resolve({ success: true });
        });
    });
});

ipcMain.handle('open-folder', async (event, gamePath) => {
    const folderPath = path.dirname(gamePath);

    shell.openPath(folderPath);
});

ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.hide();
});

ipcMain.handle('check-updates', async () => {
    if (updater) return await updater.checkForUpdates(false);

    return { hasUpdate: false };
});

ipcMain.handle('get-update-status', () => {
    if (updater) return updater.getUpdateStatus();

    return { updateAvailable: false };
});

app.whenReady().then(() => {
    updater = new Updater();

    createWindow();
    createTray();
});

app.on('activate', () => {
    createWindow();
});

app.on('before-quit', () => {
    app.isQuiting = true;

    if (tray) {
        tray.destroy();

        tray = null;
    }
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
});
