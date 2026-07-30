import { useEffect, useState } from "react";
import localLocations, { Location } from "@/data/locations";

const LOCATIONS_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76?action=list_locations";

export type { Location };

type ApiLocation = {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  promos: Location["promos"];
  tariffs?: Location["tariffs"];
};

let cache: Location[] | null = null;

// Всё берём из базы: название, описание, доступность, акции и тарифы района.
function merge(api: ApiLocation[]): Location[] {
  const bySlug = new Map(localLocations.map((l) => [l.slug, l]));
  return api.map((a) => {
    const base = bySlug.get(a.slug);
    return {
      slug: a.slug,
      name: a.name,
      description: a.description,
      available: a.available,
      promos: a.promos || [],
      tariffs: a.tariffs && a.tariffs.length ? a.tariffs : base ? base.tariffs : [],
    };
  });
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(cache || localLocations);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    fetch(LOCATIONS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive || !json || !Array.isArray(json.locations) || !json.locations.length) return;
        const merged = merge(json.locations);
        cache = merged;
        setLocations(merged);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { locations, loading };
}

export default useLocations;