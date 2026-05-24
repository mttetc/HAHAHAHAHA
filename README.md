# HA HA HA HA HA HA HA

> A multiplayer rhythm game where your only job is to laugh like an idiot.

![tidus laughing](https://media1.tenor.com/m/QLpHOHkctmMAAAAd/tidus-laughing.gif)

---

## What is this

You know the scene. Lake Macalania. Tidus laughs out of nowhere for 30 seconds straight. Yuna stares at him like he's broken. You watched it in 2001 and you never recovered.

This is that, but competitive.

Hit **SPACE** (or tap) in sync with the HAs. Don't die. Beat your friends.

---

## How to play

1. Enter your name (or get blessed with a random FF character)
2. Wait for the countdown
3. **SPACE** or **tap** on every HA
4. Survive all 5 loops
5. Check the Hall of Laughs

Miss too many → health drops → audio gets muffled → you lose.  
Hit perfects → multiplier stacks → flames appear → you ascend.

---

## Multiplayer

Rooms auto-start when someone joins. Late joiners sync to the current game. Top 10 scores persist on the leaderboard between sessions (PartyKit Durable Objects).

---

## Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript |
| Rendering | HTML5 Canvas |
| Audio | Web Audio API |
| Realtime | PartyKit (Cloudflare Workers) |
| Persistence | Cloudflare Durable Objects |
| Build | Vite 5 |
| Architecture | Feature-Sliced Design |
| Linting | OxLint |
| Arch validation | Steiger |

---

## Dev

```bash
pnpm install
pnpm dev        # starts Vite + PartyKit local server
pnpm lint       # oxlint
pnpm lint:arch  # steiger FSD check
pnpm build      # production build
pnpm deploy     # build + partykit deploy
```

---

## Why

Because Tidus didn't deserve the hate. The laugh was on purpose. He was trying to cheer her up.

You were the cringe one for not getting it.

---

*Non-commercial fan project · Assets © Square Enix · Not affiliated with Square Enix*
