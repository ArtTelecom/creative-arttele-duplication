import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const REQUESTS_URL = "https://functions.poehali.dev/ed7a47a4-a9fc-4023-aeb0-1e4993e1ca2e";
const TOKEN_KEY = "art_admin_token";

type RequestItem = {
  id: number;
  name: string;
  phone: string;
  topic: string;
  city: string;
  address: string;
  message: string;
  telegram_sent: boolean;
  email_sent: boolean;
  delivery_error: string;
  created_at: string;
};

const AdminRequestsPage = () => {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [inputToken, setInputToken] = useState("");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = async (t: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${REQUESTS_URL}?action=journal&limit=200`, {
        headers: { "X-Auth-Token": t },
      });
      if (res.status === 403) {
        setError("Неверный токен");
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        return;
      }
      if (!res.ok) {
        setError("Ошибка загрузки");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadRequests(token);
  }, [token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    localStorage.setItem(TOKEN_KEY, inputToken.trim());
    setToken(inputToken.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setItems([]);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Lock" size={20} />
              Журнал заявок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="token">Токен доступа</Label>
                <Input
                  id="token"
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Введите ADMIN_TOKEN"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const last = items[0];
  const failed = items.filter((i) => !i.telegram_sent && !i.email_sent).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Журнал заявок</h1>
            <p className="text-gray-500 text-sm">
              Все обращения с сайта сохраняются здесь, даже если уведомление не дошло
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadRequests(token)} disabled={loading}>
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {loading && <p className="text-gray-500">Загрузка...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {last && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 font-normal flex items-center gap-2">
                <Icon name="Clock" size={16} />
                Последняя заявка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-bold">
                {last.name} — <a href={`tel:${last.phone}`} className="text-primary">{last.phone}</a>
              </p>
              <p className="text-sm text-gray-600">
                {last.created_at} · {last.topic || "Без темы"}
                {last.city ? ` · ${last.city}` : ""}
              </p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${last.telegram_sent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  Telegram: {last.telegram_sent ? "доставлено" : "не дошло"}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${last.email_sent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  Почта: {last.email_sent ? "доставлено" : "не дошло"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">Всего заявок</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{items.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">Не доставлено</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${failed ? "text-red-600" : "text-green-600"}`}>
                {failed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">Последняя</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{last ? last.created_at : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Все заявки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 whitespace-nowrap">Когда</th>
                      <th className="py-2 pr-4">Имя</th>
                      <th className="py-2 pr-4">Телефон</th>
                      <th className="py-2 pr-4">Тема</th>
                      <th className="py-2 pr-4">Адрес</th>
                      <th className="py-2 pr-4">Доставка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`border-b hover:bg-gray-50 ${idx === 0 ? "bg-primary/5" : ""}`}
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">{r.created_at}</td>
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          <a href={`tel:${r.phone}`} className="text-primary">{r.phone}</a>
                        </td>
                        <td className="py-2 pr-4">{r.topic || "—"}</td>
                        <td className="py-2 pr-4 text-gray-600">
                          {[r.city, r.address].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {r.telegram_sent || r.email_sent ? (
                            <span className="text-green-600">
                              {r.telegram_sent ? "TG" : ""}
                              {r.telegram_sent && r.email_sent ? " + " : ""}
                              {r.email_sent ? "почта" : ""}
                            </span>
                          ) : (
                            <span className="text-red-600" title={r.delivery_error}>
                              не дошло
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && items.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Заявок пока нет
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminRequestsPage;
