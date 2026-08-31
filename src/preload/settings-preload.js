'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getReminders: () => ipcRenderer.invoke('reminders:get'),
  saveReminder: (reminder) => ipcRenderer.invoke('reminders:save', reminder),
  deleteReminder: (id) => ipcRenderer.invoke('reminders:delete', id),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setLaunchAtLogin: (value) => ipcRenderer.invoke('settings:setLaunchAtLogin', value),
  setBannerSpeed: (value) => ipcRenderer.invoke('settings:setBannerSpeed', value),
  setCharacter: (value) => ipcRenderer.invoke('settings:setCharacter', value),
  testBanner: (reminder) => ipcRenderer.invoke('banner:test', reminder),
  hidePopover: () => ipcRenderer.invoke('popover:hide'),
  quit: () => ipcRenderer.invoke('app:quit')
});
