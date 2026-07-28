import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import background from "@/data/background";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PageBackground() {
  // Случайный порядок фото, зафиксированный на время визита
  const [slides] = useState<string[]>(() => shuffle(background.slides ?? []));
  const [current, setCurrent] = useState(0);
  const location = useLocation();

  // Смена фото каждые slideDuration секунд
  useEffect(() => {
    if (background.type !== "slideshow" || slides.length < 2) return;
    const id = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      (background.slideDuration ?? 60) * 1000
    );
    return () => clearInterval(id);
  }, [slides.length]);

  // Смена фото при переходе на другую страницу
  useEffect(() => {
    if (background.type !== "slideshow" || slides.length < 2) return;
    setCurrent((c) => (c + 1) % slides.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (background.type === "slideshow" && slides.length > 0) {
    return (
      <>
        {slides.map((src, i) => (
          <div
            key={src}
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
            style={{ backgroundImage: `url(${src})`, opacity: i === current ? 1 : 0 }}
          />
        ))}
        {background.overlay > 0 && (
          <div
            className="fixed inset-0 -z-10"
            style={{ background: `rgba(11,14,23,${background.overlay})` }}
          />
        )}
      </>
    );
  }

  if (background.type === "image" && background.src) {
    return (
      <>
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${background.src})` }}
        />
        <div
          className="fixed inset-0 -z-10"
          style={{ background: `rgba(11,14,23,${background.overlay})` }}
        />
      </>
    );
  }

  if (background.type === "video" && background.src) {
    return (
      <>
        <video
          className="fixed inset-0 -z-10 w-full h-full object-cover"
          src={background.src}
          autoPlay
          loop
          muted
          playsInline
        />
        <div
          className="fixed inset-0 -z-10"
          style={{ background: `rgba(11,14,23,${background.overlay})` }}
        />
      </>
    );
  }

  // type === "gradient" — стандартный фон из CSS
  return null;
}