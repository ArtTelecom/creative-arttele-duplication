import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Social = { id?: number; name: string; src: string; bg: string; url: string };

const SocialsEditor = ({ login, password }: { login: string; password: string }) => {
  const [items, setItems] = useState<Social[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list_socials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_socials" }),
      });
      const data = await res.json();
      setItems(data.socials || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (idx: number, patch: Partial<Social>) =>
    setItems((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const add = () =>
    setItems((prev) => [
      ...prev,
      { name: "Новая соцсеть", src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg", bg: "#26A5E4", url: "" },
    ]);

  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Login": login, "X-Admin-Password": password },
        body: JSON.stringify({ action: "save_socials", items }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Сохранено! Изменения уже на сайте." : data.error || "Ошибка");
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка соцсетей...</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button size="sm" variant="outline" onClick={add}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить соцсеть
        </Button>
        <div className="flex items-center gap-3">
          {msg && <span className={msg.includes("Сохранено") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{msg}</span>}
          <Button onClick={save} disabled={saving}>
            <Icon name="Save" size={16} className="mr-2" />
            {saving ? "Сохранение..." : "Сохранить всё"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Этот список значков показывается на тарифах, где включена галочка «Значки соцсетей».
      </p>

      <div className="space-y-3">
        {items.map((s, idx) => (
          <Card key={idx} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: s.bg }}
                  title={s.name}
                >
                  {s.src && <img src={s.src} alt={s.name} className="w-5 h-5 invert" />}
                </div>
                <div className="space-y-1 w-40">
                  <Label className="text-xs text-slate-400">Название</Label>
                  <Input value={s.name} onChange={(e) => update(idx, { name: e.target.value })} />
                </div>
                <div className="space-y-1 w-28">
                  <Label className="text-xs text-slate-400">Цвет фона</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={s.bg}
                      onChange={(e) => update(idx, { bg: e.target.value })}
                      className="h-9 w-9 rounded border border-slate-700 bg-slate-800 p-0.5"
                    />
                    <Input value={s.bg} onChange={(e) => update(idx, { bg: e.target.value })} className="h-9" />
                  </div>
                </div>
                <button
                  onClick={() => remove(idx)}
                  className="text-red-400 hover:text-red-300 px-2 ml-auto self-end pb-2"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Ссылка на иконку (картинка)</Label>
                  <Input value={s.src} onChange={(e) => update(idx, { src: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Ссылка перехода (необязательно)</Label>
                  <Input
                    value={s.url}
                    placeholder="https://t.me/..."
                    onChange={(e) => update(idx, { url: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SocialsEditor;
