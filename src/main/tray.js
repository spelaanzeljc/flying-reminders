'use strict';
const path = require('path');
const { Tray, Menu, nativeImage, app } = require('electron');

const CHARACTER_ICON_FILE = {
  cat: 'cat-character.png',
  dog: 'dog-character.png',
  alien: 'alien-ship.png'
};

function iconPathFor(character) {
  const file = CHARACTER_ICON_FILE[character] || CHARACTER_ICON_FILE.cat;
  return path.join(__dirname, '..', 'assets', 'characters', file);
}

function createTray({ togglePopover, initialCharacter }) {
  const tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('Flying Reminders');

  const setIcon = (character) => {
    const baseImage = nativeImage.createFromPath(iconPathFor(character));
    const size = process.platform === 'darwin' ? 22 : 16;
    tray.setImage(baseImage.resize({ width: size, height: size }));
  };
  setIcon(initialCharacter);

  tray.on('click', () => togglePopover(tray.getBounds()));

  // Right-click keeps a minimal native fallback in case the popover
  // ever fails to show — always a reliable way to quit.
  tray.on('right-click', () => {
    tray.popUpContextMenu(Menu.buildFromTemplate([
      { label: 'Quit Flying Reminders', click: () => app.quit() }
    ]));
  });

  return { tray, setIcon };
}

module.exports = { createTray };
