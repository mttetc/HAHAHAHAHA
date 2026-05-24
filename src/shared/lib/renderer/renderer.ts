import type { GameState, Note } from "@/shared/model";
import { DROP_DURATION_MS, HIT_ZONE_RATIO, GOOD_WINDOW_MS, MAX_HEALTH } from "@/shared/model";
import type { PlayerState } from "@/shared/model";

const W = window.innerWidth;
const H = window.innerHeight;
const NOTE_X = W / 2;
const HIT_Y = H * HIT_ZONE_RATIO;
const NOTE_R = 26;


export function getCanvasSize() {
  return { width: W, height: H };
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opponent: PlayerState | null,
  elapsedMs: number
) {
  drawBackground(ctx);
  if (!state.failed) drawMissFlash(ctx, state, elapsedMs);
  drawLane(ctx);
  if (!state.done && state.multiplier > 1) drawFlames(ctx, state, elapsedMs);
  drawHitZone(ctx, state, elapsedMs);
  if (!state.done) drawNotes(ctx, state.notes, elapsedMs);
  if (!state.done) drawHitBurst(ctx, state, elapsedMs);
  if (!state.done) drawHitParticles(ctx, state, elapsedMs);
  drawScorePop(ctx, state, elapsedMs);
  drawScore(ctx, state);
  if (!state.done && state.multiplier > 1) drawMultiplierBadge(ctx, state, elapsedMs);
  drawHealthBar(ctx, state.health);
  if (!state.done) drawJudgment(ctx, state, elapsedMs);
  if (opponent) drawOpponent(ctx, opponent);
  if (state.failed) drawGameOver(ctx, elapsedMs);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
}

function drawLane(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(100, 80, 200, 0.15)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(NOTE_X, 0);
  ctx.lineTo(NOTE_X, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawFlames(ctx: CanvasRenderingContext2D, state: GameState, t: number) {
  const { multiplier } = state;
  const intensity = (multiplier - 1) / 3; // 0.33 at x2, 0.67 at x3, 1.0 at x4
  const flameCount = multiplier === 4 ? 12 : multiplier === 3 ? 8 : 5;
  const maxH = NOTE_R * (1.2 + intensity * 2.5);

  for (let i = 0; i < flameCount; i++) {
    const seed = i * 137.508;
    const angle = (i / flameCount) * Math.PI * 2;
    const wave = Math.sin(t / 120 + seed) * 0.4 + Math.sin(t / 80 + seed * 2) * 0.3;
    const h = maxH * (0.6 + wave * 0.4);
    const wobble = Math.sin(t / 90 + seed) * NOTE_R * 0.35 * intensity;

    const baseX = NOTE_X + Math.cos(angle) * (NOTE_R + 2);
    const baseY = HIT_Y + Math.sin(angle) * (NOTE_R + 2);
    const tipX = NOTE_X + Math.cos(angle) * (NOTE_R + h) + wobble;
    const tipY = HIT_Y + Math.sin(angle) * (NOTE_R + h);

    const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
    if (multiplier === 4) {
      grad.addColorStop(0, `rgba(255, 80, 0, ${0.9 * intensity})`);
      grad.addColorStop(0.4, `rgba(255, 200, 0, ${0.7 * intensity})`);
      grad.addColorStop(1, "rgba(255, 255, 180, 0)");
    } else if (multiplier === 3) {
      grad.addColorStop(0, `rgba(255, 120, 0, ${0.75 * intensity})`);
      grad.addColorStop(0.5, `rgba(255, 220, 50, ${0.5 * intensity})`);
      grad.addColorStop(1, "rgba(255, 255, 100, 0)");
    } else {
      grad.addColorStop(0, `rgba(200, 150, 255, 0.5)`);
      grad.addColorStop(1, "rgba(150, 80, 255, 0)");
    }

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(
      NOTE_X + Math.cos(angle + 0.4) * (NOTE_R + h * 0.5) + wobble * 0.5,
      HIT_Y + Math.sin(angle + 0.4) * (NOTE_R + h * 0.5),
      tipX, tipY
    );
    ctx.lineWidth = 3 + intensity * 3;
    ctx.strokeStyle = grad;
    ctx.stroke();
  }
}

function drawMultiplierBadge(ctx: CanvasRenderingContext2D, state: GameState, t: number) {
  const { multiplier, lastMultiplierMs } = state;
  const age = t - lastMultiplierMs;

  // Pop-in scale animation on change (first 400ms)
  const popScale = age < 400 ? 1 + Math.sin((age / 400) * Math.PI) * 0.5 : 1;

  // Continuous pulse at x4
  const pulse = multiplier === 4 ? 1 + 0.08 * Math.sin(t / 150) : 1;
  const scale = popScale * pulse;

  const colors: Record<number, string> = { 2: "#cc88ff", 3: "#ff9900", 4: "#ff3300" };
  const color = colors[multiplier] ?? "#fff";
  const label = `×${multiplier}`;

  // Position: below hit zone, above combo text
  const x = NOTE_X;
  const y = HIT_Y + NOTE_R + 50;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = multiplier === 4 ? 24 : 12;

  ctx.fillStyle = color;
  ctx.font = `bold ${multiplier === 4 ? 32 : 26}px monospace`;
  ctx.fillText(label, 0, 0);

  // "!" flash on multiplier change
  if (age < 600) {
    const flashAlpha = Math.max(0, 1 - age / 600);
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.font = `bold 14px monospace`;
    ctx.fillText("STREAK UP!", 0, multiplier === 4 ? -30 : -26);
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHitZone(ctx: CanvasRenderingContext2D, state: GameState, t: number) {
  const pulse = 0.7 + 0.3 * Math.sin(t / 300);

  // React to last hit: flash the ring color briefly
  const hitAge = t - state.lastHitMs;
  const missAge = t - state.lastMissMs;
  let ringR = 130, ringG = 180, ringB = 255;
  if (hitAge < 200) {
    const f = 1 - hitAge / 200;
    if (state.lastHit === "perfect") { ringR = Math.round(130 + f * (0 - 130)); ringG = Math.round(180 + f * (255 - 180)); ringB = Math.round(255 + f * (153 - 255)); }
    else { ringR = Math.round(130 + f * (170 - 130)); ringG = Math.round(180 + f * (255 - 180)); ringB = Math.round(255 + f * (0 - 255)); }
  } else if (missAge < 200) {
    const f = 1 - missAge / 200;
    ringR = Math.round(130 + f * (255 - 130)); ringG = Math.round(180 + f * (51 - 180)); ringB = Math.round(255 + f * (51 - 255));
  }

  const grad = ctx.createRadialGradient(NOTE_X, HIT_Y, NOTE_R * 0.5, NOTE_X, HIT_Y, NOTE_R * 2);
  grad.addColorStop(0, `rgba(${ringR}, ${ringG}, ${ringB}, ${0.3 * pulse})`);
  grad.addColorStop(1, `rgba(${ringR}, ${ringG}, ${ringB}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(NOTE_X, HIT_Y, NOTE_R * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, ${0.6 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(NOTE_X, HIT_Y, NOTE_R + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, 0.4)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(NOTE_X, HIT_Y, NOTE_R + 12, 0, Math.PI * 2);
  ctx.stroke();
}

function noteColor(note: Note): string {
  switch (note.status) {
    case "hit-perfect": return "#00ff99";
    case "hit-good": return "#aaff00";
    case "missed": return "#ff3333";
    default: return "#ffd700";
  }
}

function drawNotes(ctx: CanvasRenderingContext2D, notes: Note[], elapsedMs: number) {
  notes.forEach((note) => {
    const appearsAt = note.timingMs - DROP_DURATION_MS;
    if (elapsedMs < appearsAt) return;

    const progress = (elapsedMs - appearsAt) / DROP_DURATION_MS;
    const y = progress * HIT_Y;

    let alpha = 1;
    if (note.status === "missed") {
      const age = elapsedMs - (note.timingMs + GOOD_WINDOW_MS);
      alpha = Math.max(0, 1 - age / 400);
    } else if (note.status === "hit-perfect" || note.status === "hit-good") {
      const age = elapsedMs - note.timingMs;
      alpha = Math.max(0, 1 - age / 300);
    }

    if (alpha <= 0) return;

    const color = noteColor(note);
    ctx.globalAlpha = alpha;

    const glow = ctx.createRadialGradient(NOTE_X, y, NOTE_R * 0.3, NOTE_X, y, NOTE_R * 1.8);
    glow.addColorStop(0, color + "88");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(NOTE_X, y, NOTE_R * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(NOTE_X, y, NOTE_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HA", NOTE_X, y);

    if (note.status === "pending") {
      const timeToHit = note.timingMs - elapsedMs;
      if (timeToHit < DROP_DURATION_MS && timeToHit > 0) {
        const nearness = 1 - timeToHit / DROP_DURATION_MS;
        ctx.strokeStyle = `rgba(255, 255, 255, ${nearness * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(NOTE_X, y, NOTE_R - 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  });
}

function drawScorePop(ctx: CanvasRenderingContext2D, state: GameState, elapsedMs: number) {
  const age = elapsedMs - state.lastScoreDeltaMs;
  if (!state.lastScoreDeltaMs || age > 700) return;

  const t = age / 700;
  const alpha = Math.max(0, 1 - t);
  const x = NOTE_X + 60;
  const y = HIT_Y - NOTE_R - 10 - t * 55;
  const isPositive = state.lastScoreDelta > 0;
  const color = isPositive
    ? (state.lastHit === "perfect" ? "#00ff99" : "#aaff00")
    : "#ff4444";
  const label = isPositive ? `+${state.lastScoreDelta}` : `${state.lastScoreDelta} HP`;

  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + (1 - t) * 0.3, 1 + (1 - t) * 0.3);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${isPositive ? 22 : 18}px monospace`;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillText(label, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHitBurst(ctx: CanvasRenderingContext2D, state: GameState, elapsedMs: number) {
  if (!state.lastHit) return;
  const age = elapsedMs - state.lastHitMs;
  if (age > 400) return;

  const color = state.lastHit === "perfect" ? "#00ff99" : "#aaff00";
  const alpha = Math.max(0, 1 - age / 400);

  for (let i = 0; i < 3; i++) {
    const progress = (age / 400) + i * 0.12;
    if (progress > 1) continue;
    const radius = NOTE_R + progress * NOTE_R * 2.5;
    ctx.globalAlpha = alpha * (1 - i * 0.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 - i * 0.5;
    ctx.beginPath();
    ctx.arc(NOTE_X, HIT_Y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawHitParticles(ctx: CanvasRenderingContext2D, state: GameState, elapsedMs: number) {
  if (!state.lastHit) return;
  const age = elapsedMs - state.lastHitMs;
  if (age > 500) return;

  const color = state.lastHit === "perfect" ? "#00ff99" : "#aaff00";
  const t = age / 500;
  const seed = Math.floor(state.lastHitMs);

  ctx.globalAlpha = Math.max(0, 1 - t);
  ctx.fillStyle = color;

  for (let i = 0; i < 8; i++) {
    // deterministic pseudo-random from seed + i
    const a = ((seed * 1664525 + i * 22695477) & 0xffff) / 0xffff;
    const angle = a * Math.PI * 2;
    const speed = 40 + ((seed * i * 6364136) & 0xff) / 255 * 40;
    const x = NOTE_X + Math.cos(angle) * speed * t;
    const y = HIT_Y + Math.sin(angle) * speed * t + 60 * t * t; // gravity
    const r = 3 * (1 - t);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMissFlash(ctx: CanvasRenderingContext2D, state: GameState, elapsedMs: number) {
  const age = elapsedMs - state.lastMissMs;
  if (!state.lastMissMs || age > 400) return;

  const alpha = Math.max(0, (1 - age / 400) * 0.35);
  const grad = ctx.createRadialGradient(NOTE_X, HIT_Y, 0, NOTE_X, HIT_Y, W * 0.9);
  grad.addColorStop(0, `rgba(255, 40, 40, ${alpha})`);
  grad.addColorStop(1, "rgba(255, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(state.score).padStart(7, "0"), 16, 16);

  if (state.combo > 1) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`× ${state.combo}`, NOTE_X, HIT_Y + NOTE_R + 14);
  }
}

function drawHealthBar(ctx: CanvasRenderingContext2D, health: number) {
  const barW = 200;
  const barH = 12;
  const panelPad = 8;
  const labelW = 28;
  const valueW = 36;
  const panelW = labelW + barW + valueW + panelPad * 2 + 8;
  const panelH = barH + panelPad * 2;
  const panelX = W / 2 - panelW / 2;
  const panelY = 32;
  const barX = panelX + panelPad + labelW + 4;
  const barY = panelY + panelPad;
  const pct = Math.max(0, health / MAX_HEALTH);

  // FF-style dark backdrop with double border
  ctx.fillStyle = "rgba(0, 4, 20, 0.82)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(80, 160, 220, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(20, 60, 100, 0.8)";
  ctx.strokeRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);

  // "HP" label (FF teal)
  ctx.fillStyle = "#5cf0e0";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("HP", panelX + panelPad, barY + barH / 2);

  // Bar track
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = "rgba(60, 120, 160, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  if (pct > 0) {
    // FF color: teal (full) → yellow (half) → red (critical)
    let fillColor: string;
    if (pct > 0.5)      fillColor = `hsl(${174 + (pct - 0.5) * 2 * (-174 + 174)}, 90%, 58%)`;
    else if (pct > 0.25) fillColor = `hsl(${50 - (0.5 - pct) * 4 * 50}, 100%, 55%)`;
    else                 fillColor = `hsl(${Math.max(0, 10 - (0.25 - pct) * 40)}, 100%, 50%)`;

    const fillW = barW * pct;

    // Main fill
    const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(0.5, fillColor);
    grad.addColorStop(1, `rgba(0,0,0,0.3)`);
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillW, barH);

    // Highlight stripe (FF sheen)
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(barX, barY, fillW, barH * 0.4);

    // Glow
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = pct < 0.25 ? 12 : 6;
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, fillW, barH);
    ctx.shadowBlur = 0;

    // Segment ticks (every 10%)
    ctx.fillStyle = "rgba(0, 4, 20, 0.4)";
    for (let i = 1; i < 10; i++) {
      const tx = barX + barW * (i / 10);
      if (tx < barX + fillW) ctx.fillRect(tx - 0.5, barY, 1, barH);
    }
  }

  // HP value (right-aligned, FF style)
  ctx.shadowBlur = 0;
  ctx.fillStyle = pct < 0.25 ? "#ff6060" : pct < 0.5 ? "#ffdd44" : "#ffffff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(String(health), barX + barW + valueW, barY + barH / 2);
}

function drawJudgment(ctx: CanvasRenderingContext2D, state: GameState, elapsedMs: number) {
  if (!state.lastHit) return;
  const age = elapsedMs - state.lastHitMs;
  if (age > 600) return;

  const alpha = Math.max(0, 1 - age / 600);
  const scale = 1 + (1 - age / 600) * 0.3;

  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(NOTE_X, HIT_Y - NOTE_R - 30);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (state.lastHit === "perfect") {
    ctx.fillStyle = "#00ff99";
    ctx.font = "bold 20px monospace";
    ctx.fillText("PERFECT!", 0, 0);
  } else {
    ctx.fillStyle = "#aaff00";
    ctx.font = "bold 18px monospace";
    ctx.fillText("GOOD!", 0, 0);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx: CanvasRenderingContext2D, elapsedMs: number) {
  const scale = 1 + 0.05 * Math.sin(elapsedMs / 200);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 42px monospace";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 20;
  ctx.fillText("GAME OVER", 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px monospace";
  ctx.fillText("you couldn't keep laughing", 0, 40);
  ctx.restore();
}

function drawOpponent(ctx: CanvasRenderingContext2D, opp: PlayerState) {
  const x = W - 12;
  const y = 12;

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px monospace";
  ctx.fillText(opp.name, x, y);
  ctx.fillStyle = "rgba(255, 200, 100, 0.7)";
  ctx.font = "bold 16px monospace";
  ctx.fillText(String(opp.score).padStart(7, "0"), x, y + 16);
  if (opp.combo > 1) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px monospace";
    ctx.fillText(`× ${opp.combo}`, x, y + 35);
  }
}
