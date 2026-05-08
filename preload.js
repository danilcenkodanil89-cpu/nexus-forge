const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getGames: () => ipcRenderer.invoke('get-games'),
  launchGame: (path) => ipcRenderer.invoke('launch-game', path),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Подписка на событие закрытия процесса игры/приложения
  onGameExited: (callback) => ipcRenderer.on('game-exited', (event, path) => callback(path))
});