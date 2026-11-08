# Inside Ayira's iPhone

A self-contained, interactive fictional iPhone experience for readers of Ayira Ross's story. Built with React, TypeScript and Vite. Inspired by **iOS 18's traditional design**, not newer Liquid Glass / bubble-style system UI.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the address shown in your terminal (usually http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

## What's interactive

- Realistic tall iPhone proportions, standalone phone-only page, Lock screen, four-digit passcode (**0215**), Home Screen, Dock, Dynamic Island-inspired element, search, notification center and Control Center.
- Tap/swipe the Lock Screen to open the passcode keypad. Incorrect entries 1–5 show an error; entry 6 locks for 1 minute, entry 7 for 5 minutes, entry 8 for 15 minutes; after the 15-minute lockout, attempts reset. Lockouts persist across refreshes in that browser.
- Tap the bottom gesture bar or press Home/Escape to return Home **only after unlocking**. On touchscreen, swipe up from the bottom; pull down from top-right for Control Center.
- Messages: read all fictional threads, search, filter, compose, type and send. **Baby** (Mathine Vale / Matt) responds with **scripted, keyword-aware replies**, not AI; other conversations are read/write but do not generate responses.
- Contacts and Phone: look through contacts, use keypad, view recents, simulated calls (no calls leave the browser).
- Photos: original abstract placeholder artwork for the future fictional gallery, saved camera captures, favorite and delete.
- Camera: can use device camera on HTTPS or localhost with permission. Captures remain locally saved.
- Notes: create, edit, delete, auto-save; search notes.
- Calendar: switch months, select dates, add and delete events.
- Reminders: create, complete, delete reminders.
- Clock: world clocks, toggle/create illustrative alarms, stopwatch and timer. Alarms do not generate background OS notifications.
- Calculator works; Safari is a **fictional mini-browser** with an optional external web search; Settings adjusts wallpaper, sounds, brightness; Music, Weather, Maps, Files and Mail include lightweight fictional experiences/placeholders.
- Story messages and avatars are **clearly placeholders** until author content and photos are supplied.
- Home screen icons are original SVG interpretations of classic iOS app artwork, not downloaded or hotlinked Apple assets. The enhanced app zoom-in, sheet, Control Center and keyboard animations are implemented in CSS.
- Browser regression tests cover passcode lockouts, device proportions and sending/receiving a message without a blank screen. Use `npm run test:e2e` after `npm install` and `npx playwright install chromium`.

## Personalize the story

- Edit contact names/initials/colors and the starter conversation scripts in `src/data.ts`.
- Edit `scriptedReply()` in `src/data.ts` to customize Baby's responses.
- Other feature components live in `src/App.tsx`; styling overrides live in `src/polish.css`, icon artwork in `src/IosIcon.tsx`, and lock behavior in `src/LockScreen.tsx`.
- You can reset local demo content from your browser's site storage (keys prefixed `ayira-phone-v1:` and `ayira-phone-v2:`).

## Important details

- This is an iOS-inspired browser simulation, **not an exact Apple iPhone emulator**. It cannot reproduce Apple's proprietary SF Symbols, original system audio, FaceTime, native camera UI, system notifications, real call functionality, or pixel-perfect behavior across devices. Sounds are synthesized original chimes through Web Audio after user interaction; sound availability depends on browser settings.
- The passcode is **a fictional UI gate only**, not secure authentication; its code and the stories are in public source code. Do not put secrets behind it.
- All data stays in this browser's localStorage. There is **no login, server database, cross-device sync, or published media library**. Photos are stored locally and storage space is limited.
- The default Manila weather panel contains no fabricated real-world forecast.
- No Apple-owned imagery or sounds included. This independent fictional project is not affiliated with Apple.
- Use a **new, separate GitHub repository and hosting project**. Never reuse or redeploy any unrelated existing website.

## GitHub repository + hosting

This project lives at `https://github.com/jeilprogress/ayira-iphone`. Changes to the `main` branch trigger the automated Pages deployment after the application build and browser regression checks pass.

For **Railway**, create a **new project** from the new repository. The included `railway.json` sets the build command (`npm run build`) and start command (`npm start`). `server.mjs` serves the compiled site on `$PORT`. Hosting choice does not affect the iOS visual fidelity.

For **GitHub Pages**, this ZIP includes `.github/workflows/deploy.yml`. In the new repository, go to Settings → Pages → Build and deployment → Source → **GitHub Actions**. Pushing to `main` will build and deploy. Your public address will generally be `https://jeilprogress.github.io/ayira-iphone/`. The workflow does not touch any other repository.

For **Cloudflare Pages**: build `npm run build`, output `dist`.

For **Netlify**: build `npm run build`, publish `dist`.
