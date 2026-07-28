import { useEffect, useState } from "react";
import background from "@/data/background";

export default function PageBackground() {
  const slides = background.slides ?? [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (background.type !== "slideshow" || slides.length < 2) return;
    const id = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      (background.slideDuration ?? 6) * 1000
    );
    return () => clearInterval(id);
  }, [slides.length]);

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
        <div
          className="fixed inset-0 -z-10"
          style={{ background: `rgba(11,14,23,${background.overlay})` }}
        />
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
