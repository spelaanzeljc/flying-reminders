# Flying Reminders

A tiny menu-bar / system-tray app for macOS and Windows. You pick the days
and time you want to be reminded, and at that time a character flies across
your screen towing a banner that prompts you to log your hours. Click it to
open your timesheet link; dismiss it with the × if you're not ready.

Inspired by [justinwlin/meeting-reminder](https://github.com/justinwlin/meeting-reminder),
but with no calendar integration — you set the schedule yourself, and you can
have as many reminders as you want.

## How to install (no coding needed)

1. Go to the [Releases page](https://github.com/spelaanzeljc/flying-reminders/releases/latest)
   and download the file for your computer:
   - **Mac**: `Flying Reminders-1.0.0-arm64.dmg`
   - **Windows**: `Flying Reminders Setup 1.0.0.exe`
2. Open the downloaded file and install it like any other app.
3. The first time you open it, your computer will warn you it's from an
   "unidentified developer" — that's expected, this app isn't signed. Here's
   how to get past it:
   - **Mac**: don't double-click it. Instead, **right-click the app → Open**,
     then click **Open** again in the popup.
   - **Windows**: click **More info**, then **Run anyway**.
4. Look for a small icon (a cat, dog, or UFO) in your menu bar (Mac, top
   right) or system tray (Windows, bottom right). Click it to set up your
   first reminder.

## Features

- Click the tray icon and everything opens right there in one panel — no
  separate "Manage Reminders" window to dig into
- Add any number of reminders, each with its own label, days of week, time,
  and link
- Pick which character flies the banner: a cat rollerskating left→right, a
  dog skateboarding right→left, or a UFO that drops in from the top,
  unfurls the banner out of its tractor beam, hovers, then pulls it back up
  — the tray icon updates to match whichever one is selected
- Clicking the flying banner opens that reminder's link; the × dismisses it
- Enable/disable or edit reminders inline from the same panel
- "Banner speed" (Slow/Normal/Fast) controls how fast it flies
- Optional "Launch at Login" toggle
- "Test Flying" to preview instantly with the current character

## Run in development

```bash
npm install
npm start
```

This opens the app in your menu bar / system tray — look for the character
icon. Click it to open the panel and add your first reminder.

## Build installers

```bash
npm run build:mac   # produces dist/Flying Reminders-<version>-arm64.dmg
npm run build:win   # produces dist/Flying Reminders Setup <version>.exe
npm run build       # both
```

Builds are unsigned (no Apple Developer ID / Windows code-signing
certificate is configured), the same approach as the reference project. On
first launch:

- **macOS**: right-click the app → Open, then confirm, since it's from an
  unidentified developer.
- **Windows**: click "More info" → "Run anyway" on the SmartScreen prompt.

## How it works

- `src/main/store.js` — persists reminders and settings (including the
  selected character) as JSON in the OS's app-data folder
- `src/main/scheduler.js` — checks every 20 seconds whether any enabled
  reminder matches the current day/time, and fires it at most once per day
- `src/main/windows.js` — flies the banner window across the primary
  display using a hand-tuned easing curve (rush in → brake/overshoot →
  hold → exit for the cat/dog; drop in → hover → retract for the alien),
  and shows/hides the tray-anchored popover panel
- `src/main/tray.js` — the tray icon (swapped per selected character);
  left-click toggles the popover panel, right-click gives a minimal native
  "Quit" fallback
- `src/renderer/settings` — the popover panel (reminders list, add/edit
  form, Launch at Login, Banner speed, Character picker, Test Flying,
  Quit), styled as a dark menu attached to the tray icon
- `src/renderer/banner` — builds the flying scene per character (character
  image + towed banner + rope for cat/dog; ship + tractor-beam banner for
  the alien) from the artwork in `src/assets/characters/`, with the
  "legs moving" read created by a whole-body wobble/rock animation plus
  trailing dust puffs, not literal limb articulation (the source art is a
  single static pose per character)
- `src/assets/characters/` — the character and banner artwork (provided,
  not generated)

## Limitations

- Reminders are local to the machine you set them up on
- If the app isn't running (and not set to launch at login), scheduled times
  are silently skipped — nothing queues up for when you next open it
