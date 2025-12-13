import { useEffect, useRef } from "react";
import StatsImpl from "stats.js";

export const ExtendedStats = ({ maxFps = 120, rolling = 10 }) => {
  const statsRef = useRef<StatsImpl | null>(null);
  const avgPanelRef = useRef<StatsImpl.Panel | null>(null);
  const samples = useRef<number[]>([]);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const stats = new StatsImpl();
    document.body.appendChild(stats.dom);

    const avgPanel = stats.addPanel(new StatsImpl.Panel("AVG", "#ff0", "#002"));
    avgPanelRef.current = avgPanel;
    statsRef.current = stats;

    stats.showPanel(0);

    return () => {
      document.body.removeChild(stats.dom);
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      const stats = statsRef.current;
      const avgPanel = avgPanelRef.current;
      if (!stats || !avgPanel) return;

      stats.begin();

      const now = performance.now();
      const delta = now - lastTime.current;
      lastTime.current = now;

      const fps = 1000 / delta;
      samples.current.push(fps);

      let timeAcc = 0;
      const filtered: number[] = [];
      for (let i = samples.current.length - 1; i >= 0; i--) {
        const dt = 1000 / samples.current[i];
        if (timeAcc + dt > rolling * 1000) break;
        timeAcc += dt;
        filtered.push(samples.current[i]);
      }
      samples.current = filtered.reverse();

      const avg =
        samples.current.reduce((a, b) => a + b, 0) /
        (samples.current.length || 1);
      avgPanel.update(avg, maxFps);

      stats.end();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [maxFps, rolling]);

  return null;
};
