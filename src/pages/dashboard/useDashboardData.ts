import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import funcUrls from "../../../backend/func2url.json";
import { UserData } from "./DashboardShared";

export function useDashboardData() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserData | null>(() => {
    try {
      const cached = localStorage.getItem("lk_user");
      return cached ? (JSON.parse(cached) as UserData) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("lk_user");
    } catch {
      return true;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const fetchRef = useRef<((initial: boolean) => void) | null>(null);

  useEffect(() => {
    const credsStr = localStorage.getItem("lk_creds");
    if (!credsStr) {
      navigate("/login");
      return;
    }

    let creds: { login: string; password: string };
    try {
      creds = JSON.parse(decodeURIComponent(escape(atob(credsStr))));
    } catch {
      navigate("/login");
      return;
    }

    const url = funcUrls["mikrobill-scraper"];
    let cancelled = false;

    const fetchUserData = (initial: boolean) => {
      const ts = Date.now();
      const auth = `login=${encodeURIComponent(creds.login)}&password=${encodeURIComponent(creds.password)}`;

      // 1) Базовая инфа (быстро) — показываем сразу
      fetch(`${url}?action=user_info&${auth}&_=${ts}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setUserData((prev) => {
            // Сохраняем уже подгруженные платежи/трафик при обновлении базы
            const merged = {
              ...data,
              payments: data?.payments || prev?.payments,
              traffic_summary: data?.traffic_summary ?? prev?.traffic_summary,
            };
            try {
              localStorage.setItem("lk_user", JSON.stringify(merged));
            } catch {
              /* ignore */
            }
            return merged;
          });
          if (initial) setLoading(false);
          setRefreshing(false);
        })
        .catch(() => {
          if (initial && !cancelled) setLoading(false);
          setRefreshing(false);
        });

      // 2) Платежи (параллельно)
      fetch(`${url}?action=payments&${auth}&_=${ts}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !data?.payments) return;
          setUserData((prev) => {
            const merged = { ...(prev || {}), payments: data.payments };
            try {
              localStorage.setItem("lk_user", JSON.stringify(merged));
            } catch {
              /* ignore */
            }
            return merged as UserData;
          });
        })
        .catch(() => undefined);

      // 3) Трафик (параллельно — самый медленный запрос)
      fetch(`${url}?action=traffic&${auth}&_=${ts}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !data?.traffic_summary) return;
          setUserData((prev) => {
            const merged = { ...(prev || {}), traffic_summary: data.traffic_summary };
            try {
              localStorage.setItem("lk_user", JSON.stringify(merged));
            } catch {
              /* ignore */
            }
            return merged as UserData;
          });
        })
        .catch(() => undefined);
    };

    fetchRef.current = fetchUserData;
    fetchUserData(true);

    let lastFetch = Date.now();
    const MIN_GAP_MS = 30_000;
    const safeFetch = () => {
      const now = Date.now();
      if (now - lastFetch < MIN_GAP_MS) return;
      lastFetch = now;
      fetchUserData(false);
    };

    const intervalId = window.setInterval(safeFetch, 60_000);
    const onFocus = () => safeFetch();
    const onVisibility = () => {
      if (document.visibilityState === "visible") safeFetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [navigate]);

  const user: UserData = userData || JSON.parse(localStorage.getItem("lk_user") || '{"login":"","name":"","balance":"","tariff":"","speed":"","status":"","account":"","address":"","phone":"","email":"","credit":"","ip":"","mac":"","group":"","work_until":""}');

  const isBlocked = (user.status || "").toLowerCase().includes("блок");

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchRef.current?.(false);
    toast.info("Обновляю данные с биллинга...");
  };

  const handleLogout = () => {
    localStorage.removeItem("lk_user");
    localStorage.removeItem("lk_creds");
    navigate("/login");
  };

  return {
    userData,
    user,
    loading,
    refreshing,
    isBlocked,
    handleRefresh,
    handleLogout,
  };
}

export default useDashboardData;
