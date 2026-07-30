import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const TARIFFS_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Tariff = {
  id: number;
  kind: string;
  name: string;
  speed: string;
  price: string;
  popular: boolean;
  color: string;
  sla: string;
  features: string[];
};

const COLORS = [
  { value: "blue", label: "Синий" },
  { value: "green", label: "Зелёный" },
  { value: "purple", label: "Фиолетовый" },
];

const TariffsEditor = ({ login, password }: { login: string; password: string }) => {
  const [tab, setTab] = useState<"home" | "business">("home");
  const [home, setHome] = useState<Tariff[]>([]);
  const [business, setBusiness] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(TARIFFS_URL);
      const data = await res.json();
      setHome((data.home || []).map((t: Tariff) => ({ ...t, kind: "home" })));
      setBusiness((data.business || []).map((t: Tariff) => ({ ...t, kind: "business" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const list = tab === "home" ? home : business;
  const setList = tab === "home" ? setHome : setBusiness;

  const update = (id: number, patch: Partial<Tariff>) => {
    setList((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(TARIFFS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Login": login,
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ action: "save", items: [...home, ...business] }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg("Сохранено! Изменения уже на сайте.");
      } else {
        setMsg(data.error || "Ошибка сохранения");
      }
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка тарифов...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
          <button
            onClick={() => setTab("home")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === "home" ? "bg-slate-600 text-white" : "text-slate-400"
            }`}
          >
            Для дома
          </button>
          <button
            onClick={() => setTab("business")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === "business" ? "bg-slate-600 text-white" : "text-slate-400"
            }`}
          >
            Для бизнеса
          </button>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={msg.includes("Сохранено") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
              {msg}
            </span>
          )}
          <Button onClick={save} disabled={saving}>
            <Icon name="Save" size={16} className="mr-2" />
            {saving ? "Сохранение..." : "Сохранить всё"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((t) => (
          <Card key={t.id} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Название</Label>
                  <Input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Цена, ₽/мес</Label>
                  <Input value={t.price} onChange={(e) => update(t.id, { price: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Скорость, Мбит/с</Label>
                  <Input value={t.speed} onChange={(e) => update(t.id, { speed: e.target.value })} />
                </div>
                {tab === "business" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">SLA</Label>
                    <Input value={t.sla} onChange={(e) => update(t.id, { sla: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Цвет</Label>
                  <select
                    value={t.color}
                    onChange={(e) => update(t.id, { color: e.target.value })}
                    className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-white"
                  >
                    {COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={t.popular}
                      onChange={(e) => update(t.id, { popular: e.target.checked })}
                    />
                    Популярный
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Опции (каждая с новой строки)</Label>
                <textarea
                  value={t.features.join("\n")}
                  onChange={(e) => update(t.id, { features: e.target.value.split("\n") })}
                  rows={Math.max(3, t.features.length)}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-white"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TariffsEditor;
