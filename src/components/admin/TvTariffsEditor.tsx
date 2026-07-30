import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Tv = {
  id?: number;
  name: string;
  internet: string;
  price: string;
  channels: string;
  color: string;
  popular: boolean;
  promo: string;
  features: string[];
};

const COLORS = [
  { value: "blue", label: "Синий" },
  { value: "green", label: "Зелёный" },
  { value: "purple", label: "Фиолетовый" },
];

const TvTariffsEditor = ({ login, password }: { login: string; password: string }) => {
  const [items, setItems] = useState<Tv[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list_tv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_tv" }),
      });
      const data = await res.json();
      setItems((data.tv || []).map((t: Tv) => ({ ...t, features: t.features || [] })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (idx: number, patch: Partial<Tv>) =>
    setItems((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const add = () =>
    setItems((prev) => [
      ...prev,
      { name: "Новый пакет + ТВ", internet: "100", price: "1000", channels: "150", color: "blue", popular: false, promo: "", features: ["100 Мбит/с", "150 каналов", "Поддержка 24/7"] },
    ]);

  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Login": login, "X-Admin-Password": password },
        body: JSON.stringify({ action: "save_tv", items }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Сохранено! Изменения уже на сайте." : data.error || "Ошибка");
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка ТВ-тарифов...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button size="sm" variant="outline" onClick={add}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить пакет
        </Button>
        <div className="flex items-center gap-3">
          {msg && <span className={msg.includes("Сохранено") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{msg}</span>}
          <Button onClick={save} disabled={saving}>
            <Icon name="Save" size={16} className="mr-2" />
            {saving ? "Сохранение..." : "Сохранить всё"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((t, idx) => (
          <Card key={idx} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input value={t.name} onChange={(e) => update(idx, { name: e.target.value })} className="max-w-[220px] font-medium" />
                <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 px-2" title="Удалить">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Интернет, Мбит/с</Label>
                  <Input value={t.internet} onChange={(e) => update(idx, { internet: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Цена ₽</Label>
                  <Input value={t.price} onChange={(e) => update(idx, { price: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Каналов</Label>
                  <Input value={t.channels} onChange={(e) => update(idx, { channels: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Цвет</Label>
                  <select value={t.color} onChange={(e) => update(idx, { color: e.target.value })} className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-white">
                    {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 pb-2">
                  <input type="checkbox" checked={t.popular} onChange={(e) => update(idx, { popular: e.target.checked })} />
                  Популярный
                </label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Плашка акции (необязательно)</Label>
                <Input value={t.promo} placeholder="Напр. Приставка в подарок" onChange={(e) => update(idx, { promo: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Опции (каждая с новой строки)</Label>
                <textarea
                  value={t.features.join("\n")}
                  onChange={(e) => update(idx, { features: e.target.value.split("\n") })}
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

export default TvTariffsEditor;
