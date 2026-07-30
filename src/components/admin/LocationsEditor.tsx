import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Promo = { title: string; desc: string; badge: string; color: string };
type Loc = {
  id: number;
  slug: string;
  name: string;
  description: string;
  available: boolean;
  promos: Promo[];
};

const COLORS = [
  { value: "blue", label: "Синий" },
  { value: "green", label: "Зелёный" },
  { value: "purple", label: "Фиолетовый" },
];

const LocationsEditor = ({ login, password }: { login: string; password: string }) => {
  const [items, setItems] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list_locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_locations" }),
      });
      const data = await res.json();
      setItems(
        (data.locations || []).map((l: Loc) => ({ ...l, promos: l.promos || [] }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (id: number, patch: Partial<Loc>) =>
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const updatePromo = (id: number, idx: number, patch: Partial<Promo>) =>
    setItems((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, promos: l.promos.map((p, i) => (i === idx ? { ...p, ...patch } : p)) }
          : l
      )
    );

  const addPromo = (id: number) =>
    update(id, {
      promos: [
        ...(items.find((l) => l.id === id)?.promos || []),
        { title: "Новая акция", desc: "", badge: "Акция", color: "green" },
      ],
    });

  const removePromo = (id: number, idx: number) =>
    setItems((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, promos: l.promos.filter((_, i) => i !== idx) } : l
      )
    );

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Login": login,
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ action: "save_locations", items }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Сохранено! Изменения уже на сайте." : data.error || "Ошибка сохранения");
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка районов...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-400">Районов: {items.length}</p>
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

      <div className="space-y-3">
        {items.map((l) => (
          <Card key={l.id} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setOpenId(openId === l.id ? null : l.id)}
                  className="text-slate-400 hover:text-white"
                >
                  <Icon name={openId === l.id ? "ChevronDown" : "ChevronRight"} size={18} />
                </button>
                <Input
                  value={l.name}
                  onChange={(e) => update(l.id, { name: e.target.value })}
                  className="max-w-xs font-medium"
                />
                <label className="flex items-center gap-2 text-sm text-slate-300 ml-auto">
                  <input
                    type="checkbox"
                    checked={l.available}
                    onChange={(e) => update(l.id, { available: e.target.checked })}
                  />
                  Подключение доступно
                </label>
                <span className="text-xs text-slate-600">
                  {l.promos.length} акц.
                </span>
              </div>

              {openId === l.id && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Описание района</Label>
                    <textarea
                      value={l.description}
                      onChange={(e) => update(l.id, { description: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Акции района</Label>
                      <Button size="sm" variant="outline" onClick={() => addPromo(l.id)}>
                        <Icon name="Plus" size={14} className="mr-1" /> Акция
                      </Button>
                    </div>
                    {l.promos.map((p, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={p.title}
                            placeholder="Заголовок акции"
                            onChange={(e) => updatePromo(l.id, idx, { title: e.target.value })}
                          />
                          <Input
                            value={p.badge}
                            placeholder="Метка"
                            className="max-w-[130px]"
                            onChange={(e) => updatePromo(l.id, idx, { badge: e.target.value })}
                          />
                          <select
                            value={p.color}
                            onChange={(e) => updatePromo(l.id, idx, { color: e.target.value })}
                            className="h-10 rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-white"
                          >
                            {COLORS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removePromo(l.id, idx)}
                            className="text-red-400 hover:text-red-300 px-2"
                            title="Удалить акцию"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                        <textarea
                          value={p.desc}
                          placeholder="Описание акции"
                          onChange={(e) => updatePromo(l.id, idx, { desc: e.target.value })}
                          rows={2}
                          className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-sm text-white"
                        />
                      </div>
                    ))}
                    {l.promos.length === 0 && (
                      <p className="text-xs text-slate-600">Акций нет. Нажмите «Акция», чтобы добавить.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LocationsEditor;
