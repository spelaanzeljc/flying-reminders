'use strict';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_ABBR = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' };

const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const remindersListEl = document.getElementById('remindersList');
const emptyStateEl = document.getElementById('emptyState');
const launchAtLoginEl = document.getElementById('launchAtLogin');
const bannerSpeedEl = document.getElementById('bannerSpeed');
const characterPickerEl = document.getElementById('characterPicker');

const formTitle = document.getElementById('formTitle');
const fieldLabel = document.getElementById('fieldLabel');
const fieldDays = document.getElementById('fieldDays');
const fieldTime = document.getElementById('fieldTime');
const fieldUrl = document.getElementById('fieldUrl');
const fieldEnabled = document.getElementById('fieldEnabled');
const formError = document.getElementById('formError');
const deleteBtn = document.getElementById('deleteBtn');

let reminders = [];
let editingId = null;

function formatMeta(reminder) {
  const days = DAY_ORDER.filter((d) => reminder.days.includes(d)).map((d) => DAY_ABBR[d]);
  const daysText = days.length === 7 ? 'Every day' : (days.length ? days.join(' ') : 'No days selected');
  return `${daysText} · ${reminder.time}`;
}

function showListView() {
  formView.classList.add('hidden');
  listView.classList.remove('hidden');
  editingId = null;
}

function showFormView() {
  listView.classList.add('hidden');
  formView.classList.remove('hidden');
}

function render() {
  remindersListEl.innerHTML = '';
  emptyStateEl.classList.toggle('hidden', reminders.length > 0);

  for (const reminder of reminders) {
    const row = document.createElement('div');
    row.className = 'reminder-row' + (reminder.enabled ? '' : ' disabled');

    const icon = document.createElement('span');
    icon.className = 'row-icon';
    icon.textContent = '🔔';

    const info = document.createElement('div');
    info.className = 'reminder-info';
    const label = document.createElement('div');
    label.className = 'reminder-label';
    label.textContent = reminder.label;
    const meta = document.createElement('div');
    meta.className = 'reminder-meta';
    meta.textContent = formatMeta(reminder);
    info.appendChild(label);
    info.appendChild(meta);

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'switch';
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = reminder.enabled;
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'slider';
    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleSlider);
    toggleLabel.addEventListener('click', (event) => event.stopPropagation());
    toggleInput.addEventListener('change', async () => {
      await window.api.saveReminder({ ...reminder, enabled: toggleInput.checked });
      await refreshReminders();
    });

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(toggleLabel);
    row.addEventListener('click', () => openForm(reminder));

    remindersListEl.appendChild(row);
  }
}

async function refreshReminders() {
  reminders = await window.api.getReminders();
  render();
}

function openForm(reminder) {
  editingId = reminder ? reminder.id : null;
  formTitle.textContent = reminder ? 'Edit Reminder' : 'Add Reminder';
  fieldLabel.value = reminder ? reminder.label : 'Log your hours';
  fieldTime.value = reminder ? reminder.time : '17:00';
  fieldUrl.value = reminder ? reminder.url : '';
  fieldEnabled.checked = reminder ? reminder.enabled : true;
  deleteBtn.style.display = reminder ? 'inline-block' : 'none';
  formError.classList.add('hidden');

  const selectedDays = new Set(reminder ? reminder.days : [1, 2, 3, 4, 5]);
  for (const btn of fieldDays.querySelectorAll('.day-btn')) {
    const day = Number(btn.dataset.day);
    btn.classList.toggle('selected', selectedDays.has(day));
  }

  showFormView();
  fieldLabel.focus();
}

fieldDays.addEventListener('click', (event) => {
  const btn = event.target.closest('.day-btn');
  if (!btn) return;
  btn.classList.toggle('selected');
});

document.getElementById('addReminderBtn').addEventListener('click', () => openForm(null));
document.getElementById('backBtn').addEventListener('click', showListView);
document.getElementById('cancelBtn').addEventListener('click', showListView);

document.getElementById('saveBtn').addEventListener('click', async () => {
  const days = Array.from(fieldDays.querySelectorAll('.day-btn.selected')).map((b) => Number(b.dataset.day));
  const url = fieldUrl.value.trim();

  if (days.length === 0) {
    formError.textContent = 'Pick at least one day.';
    formError.classList.remove('hidden');
    return;
  }
  if (!fieldTime.value) {
    formError.textContent = 'Pick a time.';
    formError.classList.remove('hidden');
    return;
  }
  if (!url) {
    formError.textContent = 'Add a link to open when the banner is clicked.';
    formError.classList.remove('hidden');
    return;
  }

  await window.api.saveReminder({
    id: editingId,
    label: fieldLabel.value.trim() || 'Log your hours',
    days,
    time: fieldTime.value,
    url,
    enabled: fieldEnabled.checked
  });

  showListView();
  await refreshReminders();
});

deleteBtn.addEventListener('click', async () => {
  if (editingId) {
    await window.api.deleteReminder(editingId);
  }
  showListView();
  await refreshReminders();
});

document.getElementById('testBannerBtn').addEventListener('click', () => {
  window.api.testBanner(reminders[0] || {});
});

document.getElementById('quitBtn').addEventListener('click', () => {
  window.api.quit();
});

launchAtLoginEl.addEventListener('change', () => {
  window.api.setLaunchAtLogin(launchAtLoginEl.checked);
});

bannerSpeedEl.addEventListener('click', (event) => {
  const btn = event.target.closest('.segment');
  if (!btn) return;
  for (const s of bannerSpeedEl.querySelectorAll('.segment')) s.classList.remove('active');
  btn.classList.add('active');
  window.api.setBannerSpeed(btn.dataset.speed);
});

characterPickerEl.addEventListener('click', (event) => {
  const btn = event.target.closest('.char-btn');
  if (!btn) return;
  for (const c of characterPickerEl.querySelectorAll('.char-btn')) c.classList.remove('active');
  btn.classList.add('active');
  window.api.setCharacter(btn.dataset.character);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!formView.classList.contains('hidden')) {
      showListView();
    } else {
      window.api.hidePopover();
    }
  }
});

(async function init() {
  const settings = await window.api.getSettings();
  launchAtLoginEl.checked = !!settings.launchAtLogin;
  const speed = settings.bannerSpeed || 'normal';
  for (const s of bannerSpeedEl.querySelectorAll('.segment')) {
    s.classList.toggle('active', s.dataset.speed === speed);
  }
  const character = settings.character || 'cat';
  for (const c of characterPickerEl.querySelectorAll('.char-btn')) {
    c.classList.toggle('active', c.dataset.character === character);
  }
  await refreshReminders();
})();
