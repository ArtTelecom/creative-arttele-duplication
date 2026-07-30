import { useEffect, useState } from "react";
import localHomeTariffs, { Tariff } from "@/data/tariffs";
import localBusinessTariffs, { BusinessTariff } from "@/data/business-tariffs";

const TARIFFS_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

export type { Tariff, BusinessTariff };

export interface TariffsData {
  home: Tariff[];
  business: BusinessTariff[];
}

let cache: TariffsData | null = null;

export function useTariffs() {
  const [data, setData] = useState<TariffsData>(
    cache || { home: localHomeTariffs, business: localBusinessTariffs }
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    fetch(TARIFFS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive || !json) return;
        const next: TariffsData = {
          home: Array.isArray(json.home) && json.home.length ? json.home : localHomeTariffs,
          business:
            Array.isArray(json.business) && json.business.length
              ? json.business
              : localBusinessTariffs,
        };
        cache = next;
        setData(next);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { home: data.home, business: data.business, loading };
}

export default useTariffs;
