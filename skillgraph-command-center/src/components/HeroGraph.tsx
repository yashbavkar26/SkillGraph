import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number; // 0=cyan, 1=violet, 2=magenta
  pulse: number;
};

const HUES = [
  { h: 195, s: 100, l: 65 }, // cyan
  { h: 275, s: 90, l: 68 }, // violet
  { h: 320, s: 90, l: 70 }, // magenta
];

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.max(38, Math.floor((width * height) / 22000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 2.6,
        hue: Math.floor(Math.random() * 3),
        pulse: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const LINK_DIST = 160;
    let t = 0;

    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // soft vignette glow
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.6,
      );
      grad.addColorStop(0, "rgba(80, 60, 200, 0.10)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // update nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (mouseRef.current.active) {
          const dx = n.x - mouseRef.current.x;
          const dy = n.y - mouseRef.current.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 180 * 180) {
            const f = (1 - Math.sqrt(d2) / 180) * 0.6;
            n.x += (dx / Math.sqrt(d2 || 1)) * f;
            n.y += (dy / Math.sqrt(d2 || 1)) * f;
          }
        }
      }

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.35;
            const ha = HUES[a.hue];
            const hb = HUES[b.hue];
            const lg = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            lg.addColorStop(0, `hsla(${ha.h}, ${ha.s}%, ${ha.l}%, ${alpha})`);
            lg.addColorStop(1, `hsla(${hb.h}, ${hb.s}%, ${hb.l}%, ${alpha})`);
            ctx.strokeStyle = lg;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        n.pulse += 0.04;
        const pulse = 0.5 + 0.5 * Math.sin(n.pulse);
        const hue = HUES[n.hue];
        const r = n.r + pulse * 1.2;

        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
        halo.addColorStop(0, `hsla(${hue.h}, ${hue.s}%, ${hue.l}%, ${0.5 * pulse + 0.2})`);
        halo.addColorStop(1, `hsla(${hue.h}, ${hue.s}%, ${hue.l}%, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsl(${hue.h}, ${hue.s}%, ${hue.l}%)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
