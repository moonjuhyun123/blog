import { useEffect, useRef } from "react";

export default function MatrixRain({
  fps = 60,
  minSpeed = 1.2,
  maxSpeed = 2.8,
  fontSize = 16,
}: {
  fps?: number;
  minSpeed?: number;
  maxSpeed?: number;
  fontSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let W = 0,
      H = 0;
    let f = Math.max(12, fontSize);
    let cols = 0;
    let drops: { y: number; speed: number; gap: number; resetAt: number }[] =
      [];
    const charset = ["0", "1"];

    const resize = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      W = Math.floor(rect.width);
      H = Math.floor(rect.height);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${f}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

      cols = Math.max(1, Math.floor(W / f));
      drops = new Array(cols).fill(0).map(() => ({
        y: Math.random() * (H / f),
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        gap: 1 + Math.floor(Math.random() * 3),
        resetAt: H / f + Math.random() * 30,
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const frameInterval = 1000 / fps;
    let lastTime = performance.now();

    const drawFrame = (now: number) => {
      if (now - lastTime < frameInterval) {
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      lastTime = now;

      ctx.fillStyle = "rgba(10, 15, 10, 0.08)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < cols; i++) {
        const x = i * f;
        const drop = drops[i];
        ctx.fillStyle = "rgba(0, 255, 128, 0.9)";
        const headChar = charset[(Math.random() * charset.length) | 0];
        ctx.fillText(headChar, x, drop.y * f);

        ctx.fillStyle = "rgba(0, 255, 128, 0.3)";
        const tailLen = 6 + Math.floor(Math.random() * 6);
        for (let t = 1; t < tailLen; t++) {
          const ch = charset[(Math.random() * charset.length) | 0];
          ctx.fillText(ch, x, (drop.y - t * drop.gap) * f);
        }

        drop.y += drop.speed;
        if (drop.y * f > drop.resetAt * f) {
          drop.y = -Math.random() * 20;
          drop.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
          drop.gap = 1 + Math.floor(Math.random() * 3);
          drop.resetAt = H / f + Math.random() * 30;
        }
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [fps, minSpeed, maxSpeed, fontSize]);

  return <canvas className="matrix-canvas" ref={canvasRef} />;
}
