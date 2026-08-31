'use strict';
const { app, ipcMain } = require('electron');
const { Store } = require('./store');
const { Scheduler } = require('./scheduler');
const { createTray } = require('./tray');
const { togglePopover, hidePopover, flyBanner } = require('./windows');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let store;
  let scheduler;
  let trayHandle;

  const bannerSettings = () => {
    const s = store.getSettings();
    return { character: s.character, speed: s.bannerSpeed };
  };

  const testBanner = (reminder) => {
    const sample = reminder && reminder.label
      ? reminder
      : (store.getReminders()[0] || { label: 'Log your hours', url: '' });
    flyBanner(sample, bannerSettings());
  };

  app.whenReady().then(() => {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.hide();
    }

    store = new Store(app.getPath('userData'));

    // Keep the OS login-item state in sync with the persisted setting.
    // This can fail for unsigned/unpackaged dev builds — non-fatal.
    try {
      app.setLoginItemSettings({ openAtLogin: store.getSettings().launchAtLogin });
    } catch (err) {
      console.warn('Could not sync login item setting:', err.message);
    }

    trayHandle = createTray({ togglePopover, initialCharacter: store.getSettings().character });

    scheduler = new Scheduler(store, (reminder) => flyBanner(reminder, bannerSettings()));
    scheduler.start();

    ipcMain.handle('reminders:get', () => store.getReminders());

    ipcMain.handle('reminders:save', (_event, reminder) => store.saveReminder(reminder));

    ipcMain.handle('reminders:delete', (_event, id) => {
      store.deleteReminder(id);
      return true;
    });

    ipcMain.handle('settings:get', () => store.getSettings());

    ipcMain.handle('settings:setLaunchAtLogin', (_event, value) => {
      const updated = store.setSettings({ launchAtLogin: !!value });
      try {
        app.setLoginItemSettings({ openAtLogin: !!value });
      } catch (err) {
        console.warn('Could not update login item setting:', err.message);
      }
      return updated;
    });

    ipcMain.handle('settings:setBannerSpeed', (_event, value) => {
      const speed = ['slow', 'normal', 'fast'].includes(value) ? value : 'normal';
      return store.setSettings({ bannerSpeed: speed });
    });

    ipcMain.handle('settings:setCharacter', (_event, value) => {
      const character = ['cat', 'dog', 'alien'].includes(value) ? value : 'cat';
      const updated = store.setSettings({ character });
      trayHandle.setIcon(character);
      return updated;
    });

    ipcMain.handle('banner:test', (_event, reminder) => {
      testBanner(reminder);
      return true;
    });

    ipcMain.handle('popover:hide', () => {
      hidePopover();
      return true;
    });

    ipcMain.handle('app:quit', () => {
      app.quit();
      return true;
    });
  });

  // Tray-only app: never quit just because a window closed.
  app.on('window-all-closed', (event) => {
    event.preventDefault();
  });

  app.on('before-quit', () => {
    if (scheduler) scheduler.stop();
  });
}
