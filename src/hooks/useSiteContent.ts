import { useEffect, useState } from "react";

const BASE = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

export type TvTariff = {
  id?: number;
  name: string;
  internet: string;
  price: string;
  channels: string;
  color: "blue" | "green" | "purple";
  popular: boolean;
  promo: string;
  features: string[];
};

export type Service = {
  id?: number;
  icon: string;
  title: string;
  descr: string;
  tag: string;
  color: string;
};

export type SiteSettings = Record<string, string>;

const post = (action: string) =>
  fetch(`${BASE}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  }).then((r) => (r.ok ? r.json() : null));

let tvCache: TvTariff[] | null = null;
export function useTvTariffs(fallback: TvTariff[]) {
  const [tv, setTv] = useState<TvTariff[]>(tvCache || fallback);
  useEffect(() => {
    let alive = true;
    post("list_tv")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.tv) || !j.tv.length) return;
        tvCache = j.tv;
        setTv(j.tv);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return tv;
}

let svcCache: Service[] | null = null;
export function useServices(fallback: Service[]) {
  const [services, setServices] = useState<Service[]>(svcCache || fallback);
  useEffect(() => {
    let alive = true;
    post("list_services")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.services) || !j.services.length) return;
        svcCache = j.services;
        setServices(j.services);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return services;
}

let setCache: SiteSettings | null = null;
export function useSiteSettings(fallback: SiteSettings) {
  const [settings, setSettings] = useState<SiteSettings>(setCache || fallback);
  useEffect(() => {
    let alive = true;
    post("list_settings")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.settings)) return;
        const map: SiteSettings = { ...fallback };
        j.settings.forEach((s: { key: string; value: string }) => (map[s.key] = s.value));
        setCache = map;
        setSettings(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return settings;
}
