'use strict';

const CHECK_INTERVAL_MS = 20 * 1000;

class Scheduler {
  constructor(store, onFire) {
    this.store = store;
    this.onFire = onFire;
    this.lastFired = new Map(); // reminderId -> "YYYY-MM-DD"
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), CHECK_INTERVAL_MS);
    this._tick();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  _tick() {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const day = now.getDay();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const reminder of this.store.getReminders()) {
      if (!reminder.enabled) continue;
      if (!reminder.days.includes(day)) continue;
      if (reminder.time !== hhmm) continue;
      if (this.lastFired.get(reminder.id) === dateKey) continue;

      this.lastFired.set(reminder.id, dateKey);
      this.onFire(reminder);
    }
  }
}

module.exports = { Scheduler };
