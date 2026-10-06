import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Vibe } from '../types/api';
import { vibeLabelColors } from '../utils/vibeTheme';

/* ---------- player geometry (local units, scaled by k) ---------- */
const LW = 1000;
const LH = 800;
const PC = { x: 400, y: 410 }; // platter center
const PLATTER_D = 660;
const REC_D = 620;
const PIVOT = { x: 865, y: 130 };
const ARM_LEN = 540;
const ARM = { rest: 0, over: 26, down: 34 } as const;
type ArmPos = keyof typeof ARM;
const M = 10;

/*
 * DESKTOP: hand-composed record placement (fractions of the stage).
 * back = sits BEHIND the turntable body, front = overlaps it.
 * dir  = which side the vinyl slides out of the sleeve (1 right, -1 left).
 */
const SLOTS = [
  { fx: 0.3, fy: 0.11, tilt: -7, s: 1.0, dir: 1, back: true },
  { fx: 0.64, fy: 0.08, tilt: 6, s: 0.95, dir: 1, back: true },
  { fx: 0.76, fy: 0.8, tilt: -8, s: 1.12, dir: 1, back: false },
  { fx: 0.93, fy: 0.42, tilt: 10, s: 0.9, dir: -1, back: true },
  { fx: 0.1, fy: 0.98, tilt: -12, s: 1.05, dir: 1, back: false },
  { fx: 0.48, fy: 1.03, tilt: 5, s: 0.95, dir: -1, back: false },
] as const;

/*
 * MOBILE: the crate. Sleeves run left to right (scrollable), staggered up/down.
 * dy   = vertical offset (x sleeve size)
 * vx,vy= where the vinyl center sits relative to the sleeve center (x sleeve size)
 *        vy < 0 makes the disc peek out of the top-right corner.
 */
const CRATE_SLOTS = [
  { dy: -0.1, tilt: -5, s: 1.0, vx: 0.52, vy: 0.0 },
  { dy: 0.12, tilt: 4, s: 0.95, vx: 0.44, vy: -0.26 },
  { dy: -0.04, tilt: -3, s: 1.03, vx: 0.52, vy: 0.06 },
  { dy: 0.14, tilt: 6, s: 0.96, vx: 0.42, vy: -0.28 },
  { dy: -0.12, tilt: -6, s: 1.0, vx: 0.52, vy: 0.02 },
  { dy: 0.06, tilt: 3, s: 0.97, vx: 0.44, vy: -0.24 },
] as const;

const Z = { backBase: 2, body: 200, frontBase: 300, loaded: 400, arm: 500, ui: 600, drag: 1000 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const rot = (x: number, y: number, deg: number) => {
  const t = (deg * Math.PI) / 180;
  return { x: x * Math.cos(t) - y * Math.sin(t), y: x * Math.sin(t) + y * Math.cos(t) };
};

/* ---------- Record (the spinning vinyl) ---------- */
function Record({
  vibe,
  spinning,
  rpm,
  d,
}: {
  vibe: Vibe;
  spinning: boolean;
  rpm: 33 | 45;
  d: number;
}) {
  const discRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const speed = useRef(0); // deg per ms
  const spinningRef = useRef(spinning);
  const rpmRef = useRef(rpm);
  spinningRef.current = spinning;
  rpmRef.current = rpm;
  const { dark, accent, light } = vibeLabelColors(vibe.id);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const target = spinningRef.current ? (rpmRef.current === 45 ? 0.27 : 0.2) : 0;
      speed.current += (target - speed.current) * Math.min(1, dt / 500);
      angle.current = (angle.current + speed.current * dt) % 360;
      if (discRef.current) discRef.current.style.transform = `rotate(${angle.current}deg)`;
      if (target === 0 && speed.current < 0.001) {
        speed.current = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    if (spinning || speed.current > 0) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning]);

  return (
    <div className="relative w-full h-full rounded-full">
      <div
        ref={discRef}
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'repeating-radial-gradient(circle at center, #0b0b0c 0px, #0b0b0c 2px, #17171a 3px, #0b0b0c 4px)',
          boxShadow: 'inset 0 0 0 4px #050505, inset 0 0 0 7px rgba(255,255,255,.04)',
        }}
      >
        <div
          className="absolute rounded-full flex items-center justify-center text-center"
          style={{
            left: '50%',
            top: '50%',
            width: '36%',
            height: '36%',
            transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, ${light} 0%, ${accent} 60%, ${dark} 100%)`,
          }}
        >
          <span
            className="font-serif text-[#fbf9f4] font-bold leading-tight px-2"
            style={{ fontSize: Math.max(8, d * 0.04) }}
          >
            {vibe.name}
          </span>
          <span className="absolute w-[7%] h-[7%] rounded-full bg-[#1a1208]" />
        </div>
      </div>
      {/* light sheen (does not rotate) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'conic-gradient(from 20deg, transparent 0deg, rgba(255,255,255,.16) 25deg, transparent 60deg, transparent 180deg, rgba(255,255,255,.11) 205deg, transparent 240deg)',
        }}
      />
    </div>
  );
}

/* ---------- Turntable ---------- */
interface Props {
  vibes: Vibe[];
  onChange: (vibeId: string | null) => void;
}

export default function Turntable({ vibes, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [loadedId, setLoadedIdState] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);
  const [settled, setSettled] = useState(true);
  const [arm, setArm] = useState<ArmPos>('rest');
  const [spinning, setSpinning] = useState(false);
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; near: number } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // mobile crate scrolling
  const [scrollX, setScrollX] = useState(0);
  // true while scrolling / resizing -> records follow instantly instead of easing
  const [moving, setMoving] = useState(false);
  const movingTimer = useRef<number | undefined>(undefined);
  const bump = () => {
    setMoving(true);
    window.clearTimeout(movingTimer.current);
    movingTimer.current = window.setTimeout(() => setMoving(false), 160);
  };

  const n = vibes.length;

  const setLoaded = (id: string | null) => {
    loadedRef.current = id;
    setLoadedIdState(id);
  };
  const setBusyBoth = (b: boolean) => {
    busyRef.current = b;
    setBusy(b);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      bump();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(movingTimer.current);
    };
  }, []);

  /* ----- layout ----- */
  const layout = useMemo(() => {
    const { w, h } = size;
    if (!w || !h || n === 0) return null;
    const portrait = w / h < 0.95;

    /* ===================== MOBILE ===================== */
    if (portrait) {
      const ctrlH = 52;
      // sleeve size: big enough to read, ~2.3 sleeves visible
      const S = Math.max(96, Math.min(w * 0.46, h * 0.27));
      const kW = (w * 1.12) / LW; // turntable wider than the screen = cropped
      const kH = (h - 8 - ctrlH - 8 - 56 - S * 1.3) / (0.93 * LH);
      const k = Math.max(0.2, Math.min(kW, kH));
      const bw = LW * k;
      const bh = LH * k;
      const bx = w * 0.4 - PC.x * k; // platter slightly left, hardware bleeds off both sides
      const by = 8;
      const dpx = REC_D * k;
      const pc = { x: bx + PC.x * k, y: by + PC.y * k };

      const platterBottom = by + (PC.y + PLATTER_D / 2) * k;
      const ctrlY = platterBottom + 4;
      const cy = Math.min(ctrlY + ctrlH + 8 + S * 0.62, h - 56 - S * 0.4);
      const plankTop = Math.min(cy + S * 0.4, h - 48);
      const top = cy - S * 0.75;

      const padL = w * 0.07;
      const pitch = S * 1.32;
      const contentW = padL + (n - 1) * pitch + S * 1.55 + w * 0.1;

      const items = vibes.map((_, i) => {
        const p = CRATE_SLOTS[i % CRATE_SLOTS.length];
        const sz = S * p.s;
        const sx = padL + S / 2 + i * pitch;
        const sy = cy + p.dy * S;
        const off = rot(p.vx * sz, p.vy * sz, p.tilt);
        return {
          sx,
          sy,
          dd: sz,
          tilt: p.tilt,
          back: false,
          home: { x: sx + off.x, y: sy + off.y },
          hover: { x: 0, y: 0 },
          hs: (sz * 0.96) / dpx,
        };
      });

      return {
        portrait,
        k,
        bx,
        by,
        bw,
        bh,
        dpx,
        pc,
        snap: dpx * 0.6,
        items,
        crate: { S, ctrlY, cy, top, plankTop, contentW },
      };
    }

    /* ===================== DESKTOP ===================== */
    const sceneH = h;
    const k = Math.min((w * 0.9) / LW, (h * 1.02) / LH);
    const bw = LW * k;
    const bh = LH * k;
    const bx = -bw * 0.08;
    const by = Math.max(M, sceneH - bh * 0.94);
    const dpx = REC_D * k;
    const pc = { x: bx + PC.x * k, y: by + PC.y * k };
    const dd = Math.max(110, Math.min(w, sceneH) * 0.34);

    const items = vibes.map((_, i) => {
      const base = SLOTS[i % SLOTS.length];
      const lap = Math.floor(i / SLOTS.length);
      const sz = dd * base.s;
      const sx = Math.min(w * 0.97, (base.fx + lap * 0.05) * w);
      const sy = (base.fy + lap * 0.04) * sceneH;
      const tilt = base.tilt + lap * 5;
      const off = rot(base.dir * 0.52 * sz, 0.04 * sz, tilt);
      const hov = rot(base.dir * 0.14 * sz, 0, tilt);
      return {
        sx,
        sy,
        dd: sz,
        tilt,
        back: base.back as boolean,
        home: { x: sx + off.x, y: sy + off.y },
        hover: hov,
        hs: (sz * 0.96) / dpx,
      };
    });

    return {
      portrait,
      k,
      bx,
      by,
      bw,
      bh,
      dpx,
      pc,
      snap: dpx * 0.6,
      items,
      crate: { S: 0, ctrlY: 0, cy: 0, top: 0, plankTop: 0, contentW: 0 },
    };
  }, [size, n, vibes]);

  // reset the crate scroll when switching away from the mobile layout
  const isPortrait = layout?.portrait ?? false;
  useEffect(() => {
    if (!isPortrait) setScrollX(0);
  }, [isPortrait]);

  /* ----- sequences ----- */
  async function unload() {
    setArm('over');
    await sleep(500);
    setArm('rest');
    await sleep(900);
    setSpinning(false);
    await sleep(1200);
    onChange(null);
    setSettled(false); // lift off the platter
    await sleep(250);
    setLoaded(null);
    await sleep(900);
  }

  async function place(id: string) {
    if (busyRef.current) return;
    setBusyBoth(true);
    if (loadedRef.current) await unload();
    setSettled(false);
    setLoaded(id);
    await sleep(800);
    setSettled(true); // lowers onto the platter
    await sleep(500);
    setSpinning(true);
    await sleep(600);
    setArm('over');
    await sleep(1100);
    setArm('down');
    await sleep(500);
    onChange(id);
    setBusyBoth(false);
  }

  async function togglePlay() {
    if (busyRef.current || !loadedRef.current) return;
    setBusyBoth(true);
    if (arm === 'down') {
      setArm('over');
      await sleep(400);
      setArm('rest');
      await sleep(600);
      setSpinning(false);
    } else {
      setSpinning(true);
      await sleep(600);
      setArm('over');
      await sleep(1000);
      setArm('down');
      await sleep(400);
    }
    setBusyBoth(false);
  }

  async function eject() {
    if (busyRef.current || !loadedRef.current) return;
    setBusyBoth(true);
    await unload();
    setBusyBoth(false);
  }

  /* ----- drag (or tap) a record ----- */
  function startDrag(e: ReactPointerEvent, id: string) {
    if (!layout || busyRef.current || id === loadedRef.current) return;
    e.preventDefault();
    const { pc, snap } = layout;
    const touch = e.pointerType === 'touch';
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;

    const toStage = (ev: { clientX: number; clientY: number }) => {
      const r = wrapRef.current!.getBoundingClientRect();
      // on touch the record floats above the finger so you can see it
      return { x: ev.clientX - r.left, y: ev.clientY - r.top - (touch ? 72 : 0) };
    };
    const update = (ev: { clientX: number; clientY: number }) => {
      const p = toStage(ev);
      const near = Math.max(0, 1 - dist(p, pc) / (snap * 2.2));
      setDrag({
        id,
        near,
        x: p.x + (pc.x - p.x) * near * 0.5,
        y: p.y + (pc.y - p.y) * near * 0.5,
      });
    };
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      moved = true;
      update(ev);
    };
    const finish = (ev: PointerEvent, cancelled: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      setDrag(null);
      if (cancelled) return;
      if (!moved) return void place(id); // tap = auto-load
      if (dist(toStage(ev), pc) < snap) place(id);
    };
    const up = (ev: PointerEvent) => finish(ev, false);
    const cancel = (ev: PointerEvent) => finish(ev, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }

  /* ----- mobile: find which record was touched inside the scrolling crate ----- */
  function crateDown(e: ReactPointerEvent) {
    if (!layout || busyRef.current) return;
    const r = wrapRef.current!.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    if (py > layout.crate.plankTop) return;
    for (let i = n - 1; i >= 0; i--) {
      const v = vibes[i];
      if (v.id === loadedRef.current) continue;
      const it = layout.items[i];
      const half = it.dd / 2;
      const inSleeve = Math.abs(px - (it.sx - scrollX)) < half && Math.abs(py - it.sy) < half;
      const inDisc = dist({ x: px, y: py }, { x: it.home.x - scrollX, y: it.home.y }) < (layout.dpx * it.hs) / 2;
      if (inSleeve || inDisc) {
        startDrag(e, v.id);
        return;
      }
    }
  }

  /* ----- record (vinyl) transform ----- */
  function discStyle(id: string, i: number) {
    const it = layout!.items[i];
    const { dpx, pc } = layout!;
    let x = it.home.x - scrollX;
    let y = it.home.y;
    let s = it.hs;
    let extra = '';
    let z = (it.back ? Z.backBase : Z.frontBase) + i * 2;
    let transition = moving
      ? 'filter 300ms'
      : 'transform 800ms cubic-bezier(.3,.8,.3,1), filter 300ms';
    let filter = 'drop-shadow(0 3px 4px rgba(0,0,0,.35))';

    if (drag?.id === id) {
      x = drag.x;
      y = drag.y;
      s = it.hs * 1.08 + (1 - it.hs * 1.08) * drag.near;
      extra = ' perspective(900px) rotateX(14deg) rotateZ(-5deg)';
      z = Z.drag;
      transition = 'filter 150ms';
      filter = 'drop-shadow(14px 22px 18px rgba(0,0,0,.45))';
    } else if (loadedId === id) {
      x = pc.x;
      y = pc.y;
      s = settled ? 1 : 1.05;
      z = Z.loaded;
      transition = settled
        ? 'transform 350ms ease-out, filter 350ms'
        : 'transform 800ms cubic-bezier(.3,.8,.3,1), filter 300ms';
      filter = settled
        ? 'drop-shadow(0 2px 3px rgba(0,0,0,.5))'
        : 'drop-shadow(10px 16px 14px rgba(0,0,0,.45))';
    } else if (!layout!.portrait && hoverId === id && !busy) {
      x += it.hover.x;
      y += it.hover.y;
      filter = 'drop-shadow(6px 8px 8px rgba(0,0,0,.4))';
    }
    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: dpx,
      height: dpx,
      zIndex: z,
      transform: `translate(${x - dpx / 2}px, ${y - dpx / 2}px) scale(${s})${extra}`,
      transition,
      filter,
      pointerEvents: layout!.portrait ? ('none' as const) : ('auto' as const),
      cursor: busy || loadedId === id ? 'default' : drag?.id === id ? 'grabbing' : 'grab',
      touchAction: 'none' as const,
    };
  }

  const armShadow =
    arm === 'down' ? '3px 4px 4px rgba(0,0,0,.5)' : '16px 22px 14px rgba(0,0,0,.35)';
  const idle = !loadedId && !drag;

  const btn = {
    background: 'linear-gradient(#e6e6e6,#9a9a9a)',
    boxShadow: '0 3px 0 #4f4f4f, 0 5px 6px rgba(0,0,0,.5)',
  };

  const portrait = layout?.portrait ?? false;
  const plankZ = Math.min(395, Z.frontBase + n * 2 + 2);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 18% 0%, rgba(255,196,130,.32), transparent 55%), radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(0,0,0,.6) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,.015) 0 2px, rgba(0,0,0,.05) 2px 6px)',
        backgroundColor: '#211a15',
      }}
    >
      {layout && (
        <>
          {/* ===== sleeves (artwork in front, vinyl peeks out from behind) ===== */}
          {vibes.map((v, i) => {
            const it = layout.items[i];
            const isLoaded = loadedId === v.id;
            const out = isLoaded || drag?.id === v.id;
            const hovered = !portrait && hoverId === v.id && !busy && !out;
            const { dark, accent, light } = vibeLabelColors(v.id);
            return (
              <div
                key={'sleeve-' + v.id}
                onPointerDown={portrait ? undefined : (e) => startDrag(e, v.id)}
                onPointerEnter={(e) => !portrait && e.pointerType === 'mouse' && setHoverId(v.id)}
                onPointerLeave={() => !portrait && setHoverId(null)}
                style={{
                  position: 'absolute',
                  left: it.sx - scrollX - it.dd / 2,
                  top: it.sy - it.dd / 2,
                  width: it.dd,
                  height: it.dd,
                  transform: `rotate(${it.tilt}deg) translateY(${hovered ? -6 : 0}px)`,
                  transition: 'transform 300ms ease-out, opacity 300ms',
                  zIndex: (it.back ? Z.backBase : Z.frontBase) + i * 2 + 1,
                  borderRadius: it.dd * 0.045,
                  // swap for url(coverUrl) if your Vibe has artwork
                  background: `linear-gradient(150deg, ${light} 0%, ${accent} 55%, ${dark} 100%)`,
                  boxShadow:
                    '0 14px 26px rgba(0,0,0,.5), 0 2px 4px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.14)',
                  overflow: 'hidden',
                  touchAction: 'none',
                  pointerEvents: portrait ? 'none' : 'auto',
                  opacity: out ? 0.85 : 1,
                  cursor: busy || out ? 'default' : 'grab',
                }}
              >
                {portrait ? (
                  <>
                    {/* darken the top so the title is always readable */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.12) 55%, transparent 100%), radial-gradient(circle at 85% 100%, rgba(255,255,255,.28), transparent 55%)',
                      }}
                    />
                    <span
                      className="absolute font-serif font-bold text-white pointer-events-none"
                      style={{
                        right: '5%',
                        bottom: '-10%',
                        fontSize: it.dd * 0.62,
                        lineHeight: 1,
                        opacity: 0.16,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="absolute uppercase tracking-[0.22em] font-semibold text-white/85"
                      style={{ left: '8%', top: '7%', fontSize: Math.max(9, it.dd * 0.065) }}
                    >
                      No. {String(i + 1).padStart(2, '0')}
                    </p>
                    <p
                      className="absolute font-serif font-bold leading-[1.05] text-white"
                      style={{
                        left: '8%',
                        right: '8%',
                        top: '21%',
                        fontSize: Math.max(15, it.dd * 0.175),
                        textShadow: '0 2px 10px rgba(0,0,0,.55)',
                      }}
                    >
                      {v.name}
                    </p>
                    {isLoaded && (
                      <span
                        className="absolute font-mono uppercase rounded-full text-[#1a1208]"
                        style={{
                          right: '6%',
                          top: '6%',
                          fontSize: Math.max(8, it.dd * 0.055),
                          padding: '2px 7px',
                          letterSpacing: '0.15em',
                          background: '#ffb347',
                        }}
                      >
                        On deck
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at 18% 12%, rgba(255,255,255,.5), transparent 45%), linear-gradient(180deg, transparent 45%, rgba(0,0,0,.55) 100%)',
                      }}
                    />
                    <p
                      className="absolute uppercase tracking-[0.2em] font-medium text-white/85"
                      style={{ left: '8%', top: '7%', fontSize: Math.max(9, it.dd * 0.06) }}
                    >
                      No. {String(i + 1).padStart(2, '0')}
                    </p>
                    <p
                      className="absolute font-serif font-bold leading-[1.05] text-white"
                      style={{
                        left: '8%',
                        right: '8%',
                        bottom: '7%',
                        fontSize: Math.max(14, it.dd * 0.15),
                        textShadow: '0 2px 8px rgba(0,0,0,.5)',
                      }}
                    >
                      {v.name}
                    </p>
                  </>
                )}
              </div>
            );
          })}

          {/* ===== vinyl records ===== */}
          {vibes.map((v, i) => (
            <div
              key={'disc-' + v.id}
              style={discStyle(v.id, i)}
              onPointerDown={portrait ? undefined : (e) => startDrag(e, v.id)}
              onPointerEnter={(e) => !portrait && e.pointerType === 'mouse' && setHoverId(v.id)}
              onPointerLeave={() => !portrait && setHoverId(null)}
            >
              <Record vibe={v} spinning={spinning && loadedId === v.id} rpm={rpm} d={layout.dpx} />
            </div>
          ))}

          {/* ===== turntable body (cropped by the viewport) ===== */}
          <div
            style={{
              position: 'absolute',
              left: layout.bx,
              top: layout.by,
              width: layout.bw,
              height: layout.bh,
              zIndex: Z.body,
              borderRadius: 22,
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,.14), transparent 28%), repeating-linear-gradient(92deg, #3b2213 0px, #4a2c19 7px, #351d0e 13px, #46291a 19px)',
              boxShadow:
                '0 40px 60px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.14), inset 0 -5px 12px rgba(0,0,0,.5)',
              border: '2px solid #22120a',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: LW,
                height: LH,
                transform: `scale(${layout.k})`,
                transformOrigin: 'top left',
              }}
            >
              {/* brushed metal plate */}
              <div
                className="absolute"
                style={{
                  left: 40,
                  top: 40,
                  width: 920,
                  height: 720,
                  borderRadius: 40,
                  background:
                    'repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 2px, transparent 2px 5px), linear-gradient(135deg, #bdbdbd 0%, #8c8c8c 40%, #b0b0b0 60%, #7a7a7a 100%)',
                  boxShadow: 'inset 0 0 18px rgba(0,0,0,.4), 0 2px 0 rgba(255,255,255,.2)',
                }}
              />
              {/* screws */}
              {[
                [62, 62],
                [938, 62],
                [62, 738],
                [938, 738],
              ].map(([x, y]) => (
                <span
                  key={`${x}-${y}`}
                  className="absolute rounded-full"
                  style={{
                    left: x - 9,
                    top: y - 9,
                    width: 18,
                    height: 18,
                    background: 'radial-gradient(circle at 35% 30%, #eee, #666)',
                    boxShadow: '0 1px 2px rgba(0,0,0,.5)',
                  }}
                />
              ))}
              {/* brand plate */}
              <div className="absolute" style={{ left: 84, top: 62, color: '#333' }}>
                <p className="font-serif font-bold" style={{ fontSize: 44, letterSpacing: 10 }}>
                  VIBE
                </p>
                <p style={{ fontSize: 15, letterSpacing: 5 }} className="uppercase">
                  Hi-Fi · Model MMXXVI
                </p>
              </div>
              {/* platter with strobe ring */}
              <div
                className="absolute rounded-full"
                style={{
                  left: PC.x - PLATTER_D / 2,
                  top: PC.y - PLATTER_D / 2,
                  width: PLATTER_D,
                  height: PLATTER_D,
                  background: 'repeating-conic-gradient(#b8b8b8 0deg 1.2deg, #2a2a2a 1.2deg 2.4deg)',
                  boxShadow: '0 10px 24px rgba(0,0,0,.6)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: PC.x - 314,
                  top: PC.y - 314,
                  width: 628,
                  height: 628,
                  background: 'radial-gradient(circle, #2c2c2c 0%, #181818 75%, #333 100%)',
                  boxShadow: 'inset 0 0 0 6px #555',
                }}
              />
              {/* drop-zone ring */}
              <div
                className="absolute rounded-full"
                style={{
                  left: PC.x - 310,
                  top: PC.y - 310,
                  width: 620,
                  height: 620,
                  border: '6px dashed #ffb347',
                  opacity: drag ? 0.3 + drag.near * 0.7 : idle ? 0.4 : 0,
                  transition: 'opacity 300ms',
                  animation: idle ? 'vibe-pulse 2s ease-in-out infinite' : undefined,
                }}
              />
              {idle && (
                <p
                  className="absolute text-center uppercase"
                  style={{
                    left: PC.x - 200,
                    top: PC.y + 40,
                    width: 400,
                    fontSize: 30,
                    letterSpacing: 8,
                    color: '#ffb347',
                    opacity: 0.8,
                  }}
                >
                  {portrait ? 'Tap a record' : 'Drop a record'}
                </p>
              )}
              {/* arm rest cradle */}
              <div
                className="absolute"
                style={{
                  left: PIVOT.x - 16,
                  top: 668,
                  width: 32,
                  height: 60,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg,#555,#ccc,#555)',
                  boxShadow: '0 4px 6px rgba(0,0,0,.4)',
                }}
              />
              {/* pitch slider */}
              <div
                className="absolute"
                style={{
                  left: 920,
                  top: 300,
                  width: 14,
                  height: 340,
                  borderRadius: 7,
                  background: '#222',
                  boxShadow: 'inset 0 2px 4px #000',
                }}
              />
              <div
                className="absolute"
                style={{
                  left: 906,
                  top: rpm === 45 ? 330 : 590,
                  width: 42,
                  height: 24,
                  borderRadius: 4,
                  background: 'linear-gradient(#f0f0f0,#8a8a8a)',
                  boxShadow: '0 3px 4px rgba(0,0,0,.5)',
                  transition: 'top 500ms',
                }}
              />
              {/* power lamp */}
              <span
                className="absolute rounded-full"
                style={{
                  left: 880,
                  top: 706,
                  width: 22,
                  height: 22,
                  background: spinning ? '#ffb347' : '#4a3a28',
                  boxShadow: spinning ? '0 0 22px 8px rgba(255,170,60,.7)' : 'inset 0 0 4px #000',
                  transition: 'all 400ms',
                }}
              />
            </div>
          </div>

          {/* ===== arm layer (above the record) ===== */}
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              left: layout.bx,
              top: layout.by,
              width: LW,
              height: LH,
              zIndex: Z.arm,
              transform: `scale(${layout.k})`,
              transformOrigin: 'top left',
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                left: PC.x - 12,
                top: PC.y - 12,
                width: 24,
                height: 24,
                background: 'radial-gradient(circle at 35% 30%, #fff, #777)',
                boxShadow: '0 2px 4px rgba(0,0,0,.6)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                left: PIVOT.x - 56,
                top: PIVOT.y - 56,
                width: 112,
                height: 112,
                background: 'radial-gradient(circle at 35% 30%, #f4f4f4, #7d7d7d 75%)',
                boxShadow: '0 8px 14px rgba(0,0,0,.5)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                left: PIVOT.x - 24,
                top: PIVOT.y - 24,
                width: 48,
                height: 48,
                background: 'radial-gradient(circle at 35% 30%, #666, #1a1a1a)',
              }}
            />
            <div
              className="absolute"
              style={{
                left: PIVOT.x,
                top: PIVOT.y,
                width: 0,
                height: 0,
                transform: `rotate(${ARM[arm]}deg)`,
                transition: 'transform 1000ms cubic-bezier(.45,.05,.25,1)',
              }}
            >
              <div
                className="absolute"
                style={{
                  left: -26,
                  top: -140,
                  width: 52,
                  height: 80,
                  borderRadius: 10,
                  background: 'linear-gradient(90deg,#444,#c8c8c8,#3a3a3a)',
                  boxShadow: armShadow,
                  transition: 'box-shadow 500ms',
                }}
              />
              <div
                className="absolute"
                style={{
                  left: -7,
                  top: -70,
                  width: 14,
                  height: ARM_LEN + 70,
                  borderRadius: 7,
                  background: 'linear-gradient(90deg,#8a8a8a,#f6f6f6,#6a6a6a)',
                  boxShadow: armShadow,
                  transition: 'box-shadow 500ms',
                }}
              />
              <div
                className="absolute"
                style={{
                  left: -22,
                  top: ARM_LEN - 14,
                  width: 44,
                  height: 84,
                  borderRadius: 6,
                  background: 'linear-gradient(90deg,#0e0e0e,#3d3d3d,#0e0e0e)',
                  boxShadow: armShadow,
                  transition: 'box-shadow 500ms',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{ left: -5, top: ARM_LEN + 62, width: 10, height: 10, background: '#e03' }}
              />
            </div>
          </div>

          {/* ===== MOBILE ONLY: wooden crate front + scroll layer ===== */}
          {portrait && (
            <>
              <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{
                  top: layout.crate.plankTop,
                  zIndex: plankZ,
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,.16), transparent 14%), repeating-linear-gradient(92deg, #3b2213 0px, #4a2c19 7px, #351d0e 13px, #46291a 19px)',
                  borderTop: '2px solid #5b3a22',
                  boxShadow: '0 -14px 26px rgba(0,0,0,.55), inset 0 3px 6px rgba(0,0,0,.35)',
                }}
              >
                <div className="flex items-center justify-between px-5 pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffb347]/85">
                  <span>The crate · {n} records</span>
                  <span>{scrollX < 8 ? 'Swipe →' : '← →'}</span>
                </div>
                {layout.crate.contentW > size.w && (
                  <div
                    className="mx-5 mt-3 h-1 rounded-full bg-black/40 relative"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)' }}
                  >
                    {(() => {
                      const track = size.w - 40;
                      const maxScroll = Math.max(1, layout.crate.contentW - size.w);
                      const thumb = Math.max(36, track * (size.w / layout.crate.contentW));
                      const x = Math.min(1, scrollX / maxScroll) * (track - thumb);
                      return (
                        <span
                          className="absolute top-0 h-1 rounded-full bg-[#ffb347]"
                          style={{ width: thumb, left: x }}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              <div
                onPointerDown={crateDown}
                onScroll={(e) => {
                  setScrollX(e.currentTarget.scrollLeft);
                  bump();
                }}
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
                }}
                className="absolute left-0 right-0 bottom-0 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
                style={{
                  top: layout.crate.top,
                  zIndex: Math.min(398, plankZ + 1),
                  touchAction: 'pan-x',
                  overscrollBehaviorX: 'contain',
                  scrollbarWidth: 'none',
                  cursor: 'grab',
                }}
              >
                <div style={{ width: layout.crate.contentW, height: 1 }} />
              </div>
            </>
          )}

          {/* ===== hardware controls ===== */}
          <div
            className="absolute flex items-center gap-2 rounded-xl px-2.5 py-2"
            style={{
              ...(portrait
                ? { top: layout.crate.ctrlY, left: '50%', transform: 'translateX(-50%)' }
                : { top: M, right: M }),
              zIndex: Z.ui,
              background: 'linear-gradient(#2b2724,#171412)',
              boxShadow: '0 10px 24px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.06)',
            }}
          >
            {[
              { label: arm === 'down' ? 'Pause' : 'Play', onClick: togglePlay, off: busy || !loadedId },
              { label: 'Eject', onClick: eject, off: busy || !loadedId },
              { label: `${rpm} rpm`, onClick: () => setRpm((r) => (r === 33 ? 45 : 33)), off: false },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                disabled={b.off}
                className="rounded-md px-3 h-9 min-w-14 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#222] disabled:opacity-40 active:translate-y-0.5 transition-transform"
                style={btn}
              >
                {b.label}
              </button>
            ))}
            <p className="pl-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#ffb347]/80 whitespace-nowrap">
              {loadedId ? (arm === 'down' ? '● Playing' : 'Stopped') : 'Idle'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}