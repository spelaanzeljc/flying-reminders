'use strict';
const path = require('path');
const { BrowserWindow, screen, shell } = require('electron');

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 560;

let popoverWindow = null;

function createPopoverWindow() {
  const win = new BrowserWindow({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    vibrancy: process.platform === 'darwin' ? 'popover' : undefined,
    visualEffectState: 'active',
    icon: path.join(__dirname, '..', 'assets', 'characters', 'cat-character.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'index.html'));
  win.on('blur', () => {
    if (!win.isDestroyed()) win.hide();
  });
  win.on('closed', () => {
    popoverWindow = null;
  });
  return win;
}

function positionPopover(win, trayBounds) {
  const display = screen.getDisplayMatching(trayBounds) || screen.getPrimaryDisplay();
  const { x: waX, y: waY, width: waWidth, height: waHeight } = display.workArea;

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - POPOVER_WIDTH / 2);
  x = Math.max(waX + 8, Math.min(x, waX + waWidth - POPOVER_WIDTH - 8));

  // macOS tray icons sit at the top of the screen, so the popover opens
  // below them; Windows tray icons sit at the bottom, so it opens above.
  const y = process.platform === 'darwin'
    ? trayBounds.y + trayBounds.height + 4
    : Math.max(waY + 8, trayBounds.y - POPOVER_HEIGHT - 4);

  win.setBounds({ x, y, width: POPOVER_WIDTH, height: POPOVER_HEIGHT });
}

function togglePopover(trayBounds) {
  if (!popoverWindow || popoverWindow.isDestroyed()) {
    popoverWindow = createPopoverWindow();
  }
  if (popoverWindow.isVisible()) {
    popoverWindow.hide();
    return popoverWindow;
  }
  positionPopover(popoverWindow, trayBounds);
  popoverWindow.show();
  popoverWindow.focus();
  return popoverWindow;
}

function hidePopover() {
  if (popoverWindow && !popoverWindow.isDestroyed()) popoverWindow.hide();
}

const SPEED_DURATION_MS = { slow: 20000, normal: 9000, fast: 5000 };

// Piecewise-linear interpolation between [t, p] breakpoints (t and p both
// 0..1). Mirrors the timing shape of the reference CSS keyframes: a fast
// rush to the resting spot with a small overshoot/correction "brake", a
// long hold, then the exit.
function ease(breakpoints, t) {
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [t0, p0] = breakpoints[i];
    const [t1, p1] = breakpoints[i + 1];
    if (t >= t0 && t <= t1) {
      const localT = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return p0 + (p1 - p0) * localT;
    }
  }
  return breakpoints[breakpoints.length - 1][1];
}

// Pass-through (cat/dog): rushes in, overshoots slightly past the resting
// (on-screen, readable) spot, corrects, holds, then exits the far side.
const PASS_THROUGH_CURVE = [[0, 0], [0.28, 0.54], [0.34, 0.49], [0.38, 0.5], [0.74, 0.5], [1, 1]];
// There-and-back (alien): drops in, overshoots past hover depth, corrects,
// hovers, then retreats back out the way it came.
const THERE_AND_BACK_CURVE = [[0, 0], [0.24, 1.04], [0.3, 0.97], [0.36, 1], [0.76, 1], [1, 0]];

// 20% smaller than the reference scene's original dimensions (matches the
// SCALE factor applied in the banner renderer).
const RIG = {
  cat: { width: 586, height: 218 },
  dog: { width: 609, height: 218 },
  alien: { width: 415, height: 434 },
  raccoon: { width: 860, height: 218 }
};

const CHARACTERS = ['cat', 'dog', 'alien', 'raccoon'];

function flyBanner(reminder, settings) {
  const character = CHARACTERS.includes(settings && settings.character) ? settings.character : 'cat';
  const durationMs = SPEED_DURATION_MS[settings && settings.speed] || SPEED_DURATION_MS.normal;
  const rig = RIG[character];

  const display = screen.getPrimaryDisplay();
  const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;

  let computePosition;
  if (character === 'alien') {
    const entryY = workY - rig.height;
    const hoverY = workY + Math.round(workHeight * 0.3);
    const x = workX + Math.round((workWidth - rig.width) / 2);
    computePosition = (t) => {
      const p = ease(THERE_AND_BACK_CURVE, t);
      return { x, y: Math.round(entryY + p * (hoverY - entryY)) };
    };
  } else if (character === 'raccoon') {
    // Diagonal, bottom-right off-screen to top-left off-screen, with a
    // perpendicular sine wave layered on top so it swoops like a bird
    // instead of sliding in a straight line.
    const entryX = workX + workWidth + rig.width;
    const entryY = workY + workHeight + rig.height;
    const exitX = workX - rig.width;
    const exitY = workY - rig.height;
    const dx = exitX - entryX;
    const dy = exitY - entryY;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const waveAmplitude = 70;
    const wavePeriodMs = 1100 * (durationMs / 9000);
    computePosition = (t) => {
      const p = ease(PASS_THROUGH_CURVE, t);
      const baseX = entryX + p * dx;
      const baseY = entryY + p * dy;
      const wave = Math.sin(((t * durationMs) / wavePeriodMs) * Math.PI * 2) * waveAmplitude;
      return { x: Math.round(baseX + perpX * wave), y: Math.round(baseY + perpY * wave) };
    };
  } else {
    const goingRight = character === 'cat';
    const entryX = goingRight ? workX - rig.width : workX + workWidth + rig.width;
    const exitX = goingRight ? workX + workWidth + rig.width : workX - rig.width;
    const y = workY + workHeight - rig.height - 24;
    computePosition = (t) => {
      const p = ease(PASS_THROUGH_CURVE, t);
      return { x: Math.round(entryX + p * (exitX - entryX)), y };
    };
  }

  // Start fully off-screen from the moment the window exists — passing x/y
  // here (rather than setting position only after load) rules out any
  // chance of a flash at Electron's default spawn position.
  const start = computePosition(0);

  const win = new BrowserWindow({
    x: start.x,
    y: start.y,
    width: rig.width,
    height: rig.height,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'banner-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  try {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (err) {
    // not supported on this platform; safe to ignore
  }

  win.loadFile(path.join(__dirname, '..', 'renderer', 'banner', 'index.html'));

  let closed = false;
  let timer = null;

  const finish = () => {
    if (closed) return;
    closed = true;
    if (timer) clearInterval(timer);
    if (!win.isDestroyed()) win.close();
  };

  win.webContents.once('did-finish-load', () => {
    win.webContents.send('banner:init', { character, label: reminder.label, hasUrl: !!reminder.url, durationMs });

    const startTime = Date.now();
    win.setPosition(start.x, start.y);
    win.showInactive();

    timer = setInterval(() => {
      const t = (Date.now() - startTime) / durationMs;
      if (t >= 1) {
        finish();
        return;
      }
      const pos = computePosition(t);
      if (!win.isDestroyed()) win.setPosition(pos.x, pos.y);
    }, 16);
  });

  win.webContents.ipc.on('banner:click', () => {
    if (reminder.url) shell.openExternal(reminder.url);
    finish();
  });

  win.webContents.ipc.on('banner:dismiss', () => {
    finish();
  });

  win.on('closed', finish);

  return win;
}

module.exports = { togglePopover, hidePopover, flyBanner };
