import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0d2a078e-d410-451d-a543-ec6a3ef3fe76";

type Setting = { key: string; value: string; label: string };

const ContactsEditor = ({ login, password }: { login: string; password: string }) => {
  const [items, setItems] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list_settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_settings" }),
      });
      const data = await res.json();
      setItems(data.settings || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: string, value: string) =>
    setItems((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Login": login, "X-Admin-Password": password },
        body: JSON.stringify({ action: "save_settings", items }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Сохранено! Изменения уже на сайте." : data.error || "Ошибка");
    } catch {
      setMsg("Не удалось подключиться");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Загрузка настроек...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-end gap-3">
        {msg && <span className={msg.includes("Сохранено") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{msg}</span>}
        <Button onClick={save} disabled={saving}>
          <Icon name="Save" size={16} className="mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4 space-y-4">
          {items.map((s) => (
            <div key={s.key} className="space-y-1">
              <Label className="text-slate-300">{s.label || s.key}</Label>
              <Input value={s.value} onChange={(e) => update(s.key, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsEditor;
