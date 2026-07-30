import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Icon name="Lock" size={20} /> Журнал платежей
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Логин</Label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                onKeyDown={(e) => e.key === "Enter" && load(login, password)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button className="w-full" onClick={() => load(login, password)} disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Журнал платежей</h1>
          <Button variant="outline" onClick={logout}>
            <Icon name="LogOut" size={16} className="mr-2" /> Выйти
          </Button>
        </div>

        {summary && (
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
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {loading ? "Загрузка..." : "Платежей пока нет"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
