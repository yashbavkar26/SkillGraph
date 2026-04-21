import { useEffect, useRef } from 'react';

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorIndex: number;
  pulse: number;
};

const COLORS = [
  { h: 195, s: 98, l: 64 },
  { h: 274, s: 92, l: 70 },
  { h: 320, s: 92, l: 68 },
];

const HeroGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let nodes: Node[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(72, Math.max(36, Math.floor((width * height) / 22000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        radius: 1.2 + Math.random() * 2.4,
        colorIndex: Math.floor(Math.random() * COLORS.length),
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = event.clientY - rect.top;
      pointerRef.current.active = true;
    };

    const onLeave = () => {
      pointerRef.current.active = false;
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    const linkDistance = 150;

    const draw = () => {
      context.clearRect(0, 0, width, height);

      const backgroundGlow = context.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.6
      );
      backgroundGlow.addColorStop(0, 'rgba(98, 110, 255, 0.12)');
      backgroundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = backgroundGlow;
      context.fillRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) {
          node.vx *= -1;
        }
        if (node.y <= 0 || node.y >= height) {
          node.vy *= -1;
        }

        if (pointerRef.current.active) {
          const dx = node.x - pointerRef.current.x;
          const dy = node.y - pointerRef.current.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < 175 * 175) {
            const distance = Math.sqrt(distanceSquared || 1);
            const push = (1 - distance / 175) * 0.55;
            node.x += (dx / distance) * push;
            node.y += (dy / distance) * push;
          }
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < linkDistance) {
            const opacity = (1 - distance / linkDistance) * 0.32;
            const from = COLORS[a.colorIndex];
            const to = COLORS[b.colorIndex];
            const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `hsla(${from.h}, ${from.s}%, ${from.l}%, ${opacity})`);
            gradient.addColorStop(1, `hsla(${to.h}, ${to.s}%, ${to.l}%, ${opacity})`);
            context.strokeStyle = gradient;
            context.lineWidth = 0.7;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        node.pulse += 0.04;
        const pulse = 0.5 + 0.5 * Math.sin(node.pulse);
        const color = COLORS[node.colorIndex];
        const radius = node.radius + pulse * 1.15;

        const halo = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 5.8);
        halo.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.45 * pulse + 0.25})`);
        halo.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`);
        context.fillStyle = halo;
        context.beginPath();
        context.arc(node.x, node.y, radius * 5.8, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-hero__canvas" aria-hidden="true" />;
};

export default HeroGraph;
