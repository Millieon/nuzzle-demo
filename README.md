# Nuzzle Demo

Interactive app demo for the Nuzzle landing page — React + Three.js (React Three Fiber).

## Setup in 3 steps

### 1. Install

```bash
npm install
```

### 2. Add your 3D cat

Copy your GLB file to:

```
public/cat.glb
```

That's it. The app will pick it up automatically.

> **If your file isn't GLB:**
> - `.blend` → Blender: File → Export → glTF 2.0 → tick "Apply Modifiers" → save as `.glb`
> - `.fbx` → In Blender: import FBX, then export as GLB
> - `.obj` → Same: import in Blender, export as GLB

### 3. Run

```bash
npm run dev
```

Open http://localhost:5173

---

## Embed on your landing page

After `npm run build`, you'll have a `dist/` folder. Options:

**Option A — iframe**
```html
<iframe
  src="/demo/index.html"
  style="width:390px; height:844px; border:none; border-radius:44px; box-shadow: 0 32px 100px rgba(0,0,0,0.13)"
></iframe>
```

**Option B — same-origin mount**  
Import `App.jsx` directly into your landing page if it's also a React app:
```jsx
import NuzzleDemo from './nuzzle-demo/src/App'
// ...
<NuzzleDemo />
```

**Option C — Vercel / Netlify**  
Deploy the `dist/` folder as a standalone URL, then iframe it.

---

## File structure

```
src/
  App.jsx                    ← Screen router with framer-motion transitions
  index.css                  ← Phone shell CSS + global vars
  components/
    CatModel.jsx             ← Three.js cat (loads public/cat.glb)
    UI.jsx                   ← Shared buttons, chips, choice lists
    UI.module.css
  screens/
    WelcomeScreen.jsx        ← Landing screen with 3D cat
    Screens.jsx              ← Goal, Schedule, Past, Motivation, Tone, Companion, Confirm, Sounds
    GenScreen.jsx            ← Ring assembly animation
    ChatScreen.jsx           ← Pet asks questions (6 goal-focused Qs)
    HomeScreen.jsx           ← Immersive 3D room + task banner
    *.module.css             ← Per-screen styles
public/
  cat.glb                    ← ← ← YOUR FILE GOES HERE
```

---

## Adjusting the 3D cat

All props are in `CatModel.jsx`:

| Prop | Default | What it does |
|------|---------|--------------|
| `scale` | `1.8` | Size of the model |
| `position` | `[0,-1.2,0]` | x/y/z position in scene |
| `cameraPosition` | `[0,0.5,4]` | Where the camera sits |
| `mood` | `'idle'` | `'idle'` / `'happy'` / `'thinking'` |
| `showShadow` | `true` | Contact shadow under model |
| `enableOrbit` | `false` | Set to `true` to mouse-drag rotate while testing |

Quick test — add `enableOrbit` to the home screen's `<RoomCat>` call to drag-rotate and find the perfect angle for your model.

---

## Customising questions

Edit the `QUESTIONS` array in `src/screens/ChatScreen.jsx`:

```js
const QUESTIONS = [
  { q: "Hi! I'm so happy to meet you. What's your name?", type: 'name' },
  { q: "Let's start with one goal today...",               type: 'goal' },
  // add or remove questions here
]
```

The progress bar and dot counter update automatically.
# nuzzle-demo
