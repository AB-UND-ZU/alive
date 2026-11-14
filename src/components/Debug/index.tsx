import { useFrame } from "@react-three/fiber";
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
    stats.dom.id = "stats";

    return () => {
      document.body.removeChild(stats.dom);
    };
  }, []);

  useFrame(() => {
    const stats = statsRef.current;
    const avgPanel = avgPanelRef.current;
    if (!stats || !avgPanel) return;
    stats.begin();
    const now = performance.now();
    samples.current.push(now - lastTime.current);
    lastTime.current = now;
    let duration = samples.current.reduce((total, delta) => total + delta, 0);
    while (samples.current.length > 1 && duration > rolling * 1000)
      duration -= samples.current.shift()!;
    avgPanel.update(
      duration > 0 ? (samples.current.length * 1000) / duration : 0,
      maxFps
    );
    stats.end();
  });

  return null;
};
