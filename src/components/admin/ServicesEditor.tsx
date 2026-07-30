import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Service = {
  id?: number;
  icon: string;
  title: string;
  descr: string;
  tag: string;
  color: string;
};

const COLORS = [
  { value: "blue", label: "Синий" },
  { value: "green", label: "Зелёный" },
  { value: "purple", label: "Фиолетовый" },
];

const ServicesEditor = ({ login, password }: { login: string; password: string }) => {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list_services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_services" }),
      });
      const data = await res.json();
      setItems(data.services || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (idx: number, patch: Partial<Service>) =>
    setItems((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const add = () =>
    setItems((prev) => [...prev, { icon: "Zap", title: "Новая услуга", descr: "", tag: "", color: "blue" }]);

  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Login": login, "X-Admin-Password": password },
        body: JSON.stringify({ action: "save_services", items }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Сохранено! Изменения уже на сайте." : data.error || "Ошибка");
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка услуг...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button size="sm" variant="outline" onClick={add}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить услугу
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
        {items.map((s, idx) => (
          <Card key={idx} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 shrink-0">
                  <Icon name={s.icon} size={18} className="text-sky-400" fallback="Zap" />
                </div>
                <Input value={s.title} onChange={(e) => update(idx, { title: e.target.value })} className="font-medium" />
                <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 px-2" title="Удалить">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Иконка</Label>
                  <Input value={s.icon} onChange={(e) => update(idx, { icon: e.target.value })} placeholder="Zap" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Плашка</Label>
                  <Input value={s.tag} onChange={(e) => update(idx, { tag: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Цвет</Label>
                  <select value={s.color} onChange={(e) => update(idx, { color: e.target.value })} className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-white">
                    {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Описание</Label>
                <textarea
                  value={s.descr}
                  onChange={(e) => update(idx, { descr: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-white"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Названия иконок берутся с сайта lucide.dev (например: Zap, Wifi, Tv, Shield, Phone, Building2).
      </p>
    </div>
  );
};

export default ServicesEditor;
