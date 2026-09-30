import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

export type RetryItem = {
  order_id: string;
  login: string;
  amount: number;
  attempts: number;
  status: string;
  last_error: string;
  next_try_at: string;
  created_at: string;
};

const MAX_ATTEMPTS = 6;

const humanError = (raw: string) => {
  const e = (raw || "").toLowerCase();
  if (e.includes("timed out") || e.includes("timeout")) return "Касса не ответила вовремя";
  if (e.includes("502") || e.includes("503") || e.includes("504")) return "Касса временно недоступна";
  if (e.includes("connection") || e.includes("refused")) return "Нет связи с кассой";
  if (e.includes("api_key")) return "Не настроен доступ к кассе";
  return raw || "Причина неизвестна";
};

export default function RetryQueue({
  items,
  onRun,
}: {
  items: RetryItem[];
  onRun: (orderId?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (orderId?: string) => {
    setBusy(orderId || "all");
    try {
      await onRun(orderId);
    } finally {
      setBusy(null);
    }
  };

  const pending = items.filter((i) => i.status === "pending");
  const failed = items.filter((i) => i.status === "failed");
  const sum = items.reduce((s, i) => s + (i.amount || 0), 0);

  if (items.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-6 flex items-center gap-3">
          <Icon name="ShieldCheck" size={22} className="text-emerald-400" />
          <div>
            <p className="text-white font-medium">Зависших платежей нет</p>
            <p className="text-sm text-slate-400">
              Все деньги дошли до счетов абонентов.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">В очереди</p>
            <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Требуют рук</p>
            <p className="text-2xl font-bold text-red-400">{failed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Сумма, ₽</p>
            <p className="text-2xl font-bold text-white">
              {sum.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => run()} disabled={busy !== null}>
          <Icon
            name={busy === "all" ? "Loader2" : "RefreshCw"}
            size={16}
            className={`mr-2 ${busy === "all" ? "animate-spin" : ""}`}
          />
          Запустить зачисление всех
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((it) => {
          const isFailed = it.status === "failed";
          return (
            <Card
              key={it.order_id}
              className={`border bg-slate-900 ${
                isFailed ? "border-red-900/60" : "border-amber-900/50"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon
                        name={isFailed ? "TriangleAlert" : "Clock"}
                        size={16}
                        className={isFailed ? "text-red-400" : "text-amber-400"}
                      />
                      <span className="text-white font-semibold">
                        {it.amount.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
                      </span>
                      <span className="text-slate-400 text-sm">
                        · счёт {it.login}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Заказ {it.order_id} · оплачен {it.created_at}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isFailed ? "default" : "outline"}
                    onClick={() => run(it.order_id)}
                    disabled={busy !== null}
                  >
                    <Icon
                      name={busy === it.order_id ? "Loader2" : "Play"}
                      size={14}
                      className={`mr-2 ${busy === it.order_id ? "animate-spin" : ""}`}
                    />
                    Зачислить сейчас
                  </Button>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span className="text-slate-400">
                    Попыток:{" "}
                    <span className={isFailed ? "text-red-400" : "text-white"}>
                      {it.attempts} из {MAX_ATTEMPTS}
                    </span>
                  </span>
                  {!isFailed && (
                    <span className="text-slate-400">
                      Следующая: <span className="text-white">{it.next_try_at}</span>
                    </span>
                  )}
                  <span className="text-slate-400">
                    Причина:{" "}
                    <span className="text-slate-200">{humanError(it.last_error)}</span>
                  </span>
                </div>

                <p
                  className={`text-xs rounded-md px-3 py-2 ${
                    isFailed
                      ? "bg-red-950/40 text-red-300"
                      : "bg-amber-950/30 text-amber-300"
                  }`}
                >
                  {isFailed
                    ? "Автоповторы исчерпаны. Деньги у банка приняты, но на счёт не попали — зачислите вручную."
                    : "Деньги приняты банком. Система сама повторит зачисление — вмешательство пока не требуется."}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
