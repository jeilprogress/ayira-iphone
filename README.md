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

- Lock screen, Home screen, Dock, status bar, Dynamic Island-inspired element, search, notification center and Control Center.
- Tap the bottom gesture bar or press Home/Escape to return Home. On touchscreen, swipe up from the bottom; pull down from top-right for Control Center.
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

## Personalize the story

- Edit contact names/initials/colors and the starter conversation scripts in `src/data.ts`.
- Edit `scriptedReply()` in `src/data.ts` to customize Baby's responses.
- Other feature components live in `src/App.tsx` and design in `src/style.css`.
- You can reset local demo content from your browser's site storage (key prefix `ayira-phone-v1:`).

## Important details

- This is an iOS-inspired browser simulation, **not an exact Apple iPhone emulator**. It cannot reproduce Apple's proprietary SF Symbols, original system audio, FaceTime, native camera UI, system notifications, real call functionality, or pixel-perfect behavior across devices. Sounds are synthesized original chimes through Web Audio after user interaction; sound availability depends on browser settings.
- All data stays in this browser's localStorage. There is **no login, server database, cross-device sync, or published media library**. Photos are stored locally and storage space is limited.
- The default Manila weather panel contains no fabricated real-world forecast.
- No Apple-owned imagery or sounds included. This independent fictional project is not affiliated with Apple.
- Use a **new, separate GitHub repository and hosting project**. Never reuse or redeploy any unrelated existing website.

## GitHub repository + hosting

A GitHub repository must already exist before an assistant/connector can upload these project files. Use `https://github.com/new` while signed into **jeilprogress**, name it `ayira-iphone`, then upload the ZIP contents (not the ZIP itself) to the repository or connect it to an assistant with repository write access.

For **Railway**, create a **new project** from the new repository. The included `railway.json` sets the build command (`npm run build`) and start command (`npm start`). `server.mjs` serves the compiled site on `$PORT`. Hosting choice does not affect the iOS visual fidelity.

For **GitHub Pages**, this ZIP includes `.github/workflows/deploy.yml`. In the new repository, go to Settings → Pages → Build and deployment → Source → **GitHub Actions**. Pushing to `main` will build and deploy. Your public address will generally be `https://jeilprogress.github.io/ayira-iphone/`. The workflow does not touch any other repository.

For **Cloudflare Pages**: build `npm run build`, output `dist`.

For **Netlify**: build `npm run build`, publish `dist`.
