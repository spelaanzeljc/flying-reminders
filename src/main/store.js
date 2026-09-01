'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DATA = {
  settings: {
    launchAtLogin: false,
    bannerSpeed: 'normal', // 'slow' | 'normal' | 'fast'
    character: 'cat' // 'cat' | 'dog' | 'alien' | 'raccoon'
  },
  reminders: []
};

class Store {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'flying-reminders-config.json');
    this.data = this._load();
  }

  _load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : []
      };
    } catch (err) {
      return { ...DEFAULT_DATA, settings: { ...DEFAULT_DATA.settings }, reminders: [] };
    }
  }

  _save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  getSettings() {
    return { ...this.data.settings };
  }

  setSettings(partial) {
    this.data.settings = { ...this.data.settings, ...partial };
    this._save();
    return this.getSettings();
  }

  getReminders() {
    return [...this.data.reminders];
  }

  saveReminder(reminder) {
    const clean = {
      id: reminder.id || crypto.randomUUID(),
      label: String(reminder.label || 'Log your hours').trim(),
      days: Array.isArray(reminder.days) ? reminder.days.filter((d) => d >= 0 && d <= 6) : [],
      time: /^\d{2}:\d{2}$/.test(reminder.time) ? reminder.time : '17:00',
      url: String(reminder.url || '').trim(),
      enabled: reminder.enabled !== false
    };
    const idx = this.data.reminders.findIndex((r) => r.id === clean.id);
    if (idx >= 0) {
      this.data.reminders[idx] = clean;
    } else {
      this.data.reminders.push(clean);
    }
    this._save();
    return clean;
  }

  deleteReminder(id) {
    this.data.reminders = this.data.reminders.filter((r) => r.id !== id);
    this._save();
  }
}

module.exports = { Store };
