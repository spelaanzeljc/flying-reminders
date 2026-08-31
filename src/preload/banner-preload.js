'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bannerApi', {
  onInit: (callback) => ipcRenderer.on('banner:init', (_event, data) => callback(data)),
  click: () => ipcRenderer.send('banner:click'),
  dismiss: () => ipcRenderer.send('banner:dismiss')
});
