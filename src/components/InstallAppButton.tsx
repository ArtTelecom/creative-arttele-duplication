import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppButtonProps {
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

export default function InstallAppButton({
  className = "",
  label = "Установить приложение",
  style,
}: InstallAppButtonProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Уже установлено (standalone-режим)?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      // Событие установки недоступно (iOS / уже открыт как приложение) — показываем подсказку
      setShowHelp((v) => !v);
    }
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 font-bold transition-all ${className}`}
        style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", ...style }}
      >
        <Icon name="Download" size={18} />
        {label}
      </button>

      {showHelp && !deferred && (
        <div
          className="absolute z-30 top-full mt-2 left-1/2 -translate-x-1/2 w-64 rounded-2xl p-4 text-sm text-white/80 text-left"
          style={{
            background: "rgba(17,22,36,0.98)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <Icon name="Smartphone" size={15} style={{ color: "var(--neon-blue)" }} />
            Как установить
          </div>
          <p className="mb-1.5">
            <b>Android</b> (Chrome / Яндекс): меню <b>⋮</b> → «Установить приложение».
          </p>
          <p className="mb-1.5">
            <b>iPhone</b> (Safari): «Поделиться» → «На экран «Домой».
          </p>
          <p>
            <b>ПК</b> (Яндекс.Браузер): значок установки в адресной строке справа.
          </p>
        </div>
      )}
    </div>
  );
}