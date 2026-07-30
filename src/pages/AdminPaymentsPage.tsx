import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import TariffsEditor from "@/components/admin/TariffsEditor";
import LocationsEditor from "@/components/admin/LocationsEditor";
import TvTariffsEditor from "@/components/admin/TvTariffsEditor";
import ServicesEditor from "@/components/admin/ServicesEditor";
import ContactsEditor from "@/components/admin/ContactsEditor";
import SocialsEditor from "@/components/admin/SocialsEditor";

const API_URL = "https://functions.poehali.dev/8df3bbb2-ef10-420a-95ca-13829e20eae1";
const CREDS_KEY = "art_pay_admin";

type Payment = {
  id: number;
  order_id: string;
  login: string;
  account: string;
  fio: string;
  amount: number;
  bank_status: string;
  credited: boolean;
  balance_before: string;
  balance_after: string;
  error: string;
  created_at: string;
};

type Summary = { total: number; total_sum: number; failed: number };

const AdminPaymentsPage = () => {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(CREDS_KEY) || "null");
    } catch {
      return null;
    }
  })();

  const [login, setLogin] = useState(saved?.login || "");
  const [password, setPassword] = useState(saved?.password || "");
  const [authed, setAuthed] = useState(!!saved);
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [creditingId, setCreditingId] = useState<number | null>(null);
  const [section, setSection] = useState<
    "payments" | "tariffs" | "locations" | "tv" | "services" | "contacts" | "socials"
  >("payments");

  const manualCredit = async (p: Payment) => {
    if (!confirm(`Зачислить ${p.amount.toFixed(2)} ₽ абоненту ${p.fio || p.login}?`)) return;
    setCreditingId(p.id);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Login": login,
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ action: "manual_credit", id: p.id }),
      });
      const data = await res.json();
      if (data.ok) {
        await load(login, password);
      } else {
        setError(data.error || "Не удалось зачислить");
      }
    } catch {
      setError("Не удалось подключиться");
    } finally {
      setCreditingId(null);
    }
  };

  const load = async (l: string, p: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        headers: { "X-Admin-Login": l, "X-Admin-Password": p },
      });
      if (res.status === 401) {
        setError("Неверный логин или пароль");
        localStorage.removeItem(CREDS_KEY);
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        setError("Ошибка загрузки");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
      setAuthed(true);
      localStorage.setItem(CREDS_KEY, JSON.stringify({ login: l, password: p }));
    } catch {
      setError("Не удалось подключиться");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saved?.login && saved?.password) load(saved.login, saved.password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem(CREDS_KEY);
    setAuthed(false);
    setItems([]);
    setSummary(null);
    setPassword("");
  };

  const filtered = items.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.login || "").toLowerCase().includes(q) ||
      (p.fio || "").toLowerCase().includes(q) ||
      (p.account || "").toLowerCase().includes(q) ||
      (p.order_id || "").toLowerCase().includes(q)
    );
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur relative z-10">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600">
                <Icon name="TerminalSquare" size={22} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Developer Portal</CardTitle>
                <p className="text-xs text-slate-400">Служебный доступ для разработчиков</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs leading-relaxed text-slate-400">
                <Icon name="ShieldAlert" size={13} className="inline mr-1 -mt-0.5 text-amber-400" />
                Технический раздел для интеграции приложений и API. Доступ только для
                авторизованных разработчиков. Все действия журналируются.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">API Login</Label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Secret Key</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ключ доступа"
                autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && load(login, password)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button className="w-full" onClick={() => load(login, password)} disabled={loading}>
              <Icon name="LogIn" size={16} className="mr-2" />
              {loading ? "Проверка доступа..." : "Авторизоваться"}
            </Button>
            <p className="text-center text-[11px] text-slate-600">
              Developer API v1 · protected environment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon name="TerminalSquare" size={22} className="text-sky-400" /> Developer Console
          </h1>
          <Button variant="outline" onClick={logout}>
            <Icon name="LogOut" size={16} className="mr-2" /> Выйти
          </Button>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-800 p-1 w-fit flex-wrap">
          {([
            ["payments", "Платежи"],
            ["tariffs", "Тарифы"],
            ["locations", "Районы и акции"],
            ["tv", "ТВ-тарифы"],
            ["services", "Услуги"],
            ["socials", "Соцсети"],
            ["contacts", "Контакты"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                section === key ? "bg-slate-600 text-white" : "text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "tariffs" && <TariffsEditor login={login} password={password} />}
        {section === "locations" && <LocationsEditor login={login} password={password} />}
        {section === "tv" && <TvTariffsEditor login={login} password={password} />}
        {section === "services" && <ServicesEditor login={login} password={password} />}
        {section === "socials" && <SocialsEditor login={login} password={password} />}
        {section === "contacts" && <ContactsEditor login={login} password={password} />}

        {section === "payments" && summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400">Всего платежей</p>
                <p className="text-2xl font-bold text-white">{summary.total}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400">Зачислено, ₽</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {summary.total_sum.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400">Не зачислено</p>
                <p className={`text-2xl font-bold ${summary.failed ? "text-red-400" : "text-slate-500"}`}>
                  {summary.failed}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {section === "payments" && (
        <>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Поиск: логин, ФИО, договор, заказ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => load(login, password)} disabled={loading}>
            <Icon name="RefreshCw" size={16} className="mr-2" /> Обновить
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="p-3">Дата</th>
                  <th className="p-3">Абонент</th>
                  <th className="p-3">Договор</th>
                  <th className="p-3">Сумма</th>
                  <th className="p-3">Статус банка</th>
                  <th className="p-3">Зачислено</th>
                  <th className="p-3">Баланс</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 text-slate-200">
                    <td className="p-3 whitespace-nowrap">{p.created_at}</td>
                    <td className="p-3">
                      <div className="font-medium">{p.fio || p.login}</div>
                      <div className="text-xs text-slate-500">{p.login}</div>
                    </td>
                    <td className="p-3 text-slate-400">{p.account}</td>
                    <td className="p-3 whitespace-nowrap font-medium">{p.amount.toFixed(2)} ₽</td>
                    <td className="p-3">{p.bank_status}</td>
                    <td className="p-3">
                      {p.credited ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <Icon name="Check" size={14} /> Да
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400" title={p.error}>
                          <Icon name="X" size={14} /> Нет
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                      {p.balance_before} → {p.balance_after || "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {!p.credited && (
                        <Button
                          size="sm"
                          onClick={() => manualCredit(p)}
                          disabled={creditingId === p.id}
                        >
                          {creditingId === p.id ? "..." : "Зачислить"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {loading ? "Загрузка..." : "Платежей пока нет"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;