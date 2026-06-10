const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getGames: () => ipcRenderer.invoke('get-games'),
    launchGame: (path) => ipcRenderer.invoke('launch-game', path),
    openFolder: (path) => ipcRenderer.invoke('open-folder', path),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    checkUpdates: () => ipcRenderer.invoke('check-updates'),
    getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),

    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (event, data) => callback(data));
    }
});
