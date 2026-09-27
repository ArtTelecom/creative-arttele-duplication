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

export type Social = {
  id?: number;
  name: string;
  src: string;
  bg: string;
  url: string;
};

const TTL_MS = 30 * 60 * 1000;
const stamps: Record<string, number> = {};
const inFlight: Record<string, Promise<unknown> | undefined> = {};

const isFresh = (action: string) => Date.now() - (stamps[action] || 0) < TTL_MS;

const post = (action: string) => {
  const running = inFlight[action];
  if (running) return running as Promise<{ [k: string]: unknown } | null>;
  const req = fetch(`${BASE}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .finally(() => {
      inFlight[action] = undefined;
    });
  inFlight[action] = req;
  return req;
};

let tvCache: TvTariff[] | null = null;
export function useTvTariffs(fallback: TvTariff[]) {
  const [tv, setTv] = useState<TvTariff[]>(tvCache || fallback);
  useEffect(() => {
    if (tvCache && isFresh("list_tv")) return;
    let alive = true;
    post("list_tv")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.tv) || !j.tv.length) return;
        tvCache = j.tv;
        stamps["list_tv"] = Date.now();
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
    if (svcCache && isFresh("list_services")) return;
    let alive = true;
    post("list_services")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.services) || !j.services.length) return;
        svcCache = j.services;
        stamps["list_services"] = Date.now();
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
    if (setCache && isFresh("list_settings")) return;
    let alive = true;
    post("list_settings")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.settings)) return;
        const map: SiteSettings = { ...fallback };
        j.settings.forEach((s: { key: string; value: string }) => (map[s.key] = s.value));
        setCache = map;
        stamps["list_settings"] = Date.now();
        setSettings(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return settings;
}

let socialCache: Social[] | null = null;
export function useSocials(fallback: Social[]) {
  const [socials, setSocials] = useState<Social[]>(socialCache || fallback);
  useEffect(() => {
    if (socialCache && isFresh("list_socials")) return;
    let alive = true;
    post("list_socials")
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.socials) || !j.socials.length) return;
        socialCache = j.socials;
        stamps["list_socials"] = Date.now();
        setSocials(j.socials);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return socials;
}