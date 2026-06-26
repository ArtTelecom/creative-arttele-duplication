import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  TabKey,
  UserData,
  GlassCard,
  NeonButton,
  LoadingSpinner,
} from "./DashboardShared";
import MainStatsCards from "./MainStatsCards";
import MainQuickActions from "./MainQuickActions";
import BalanceForecastCard from "./BalanceForecastCard";
import PaymentBanner from "./PaymentBanner";

export function TabMain({ user, loading, onChangeTab }: { user: UserData; loading: boolean; onChangeTab: (tab: TabKey) => void }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <MainStatsCards user={user} onChangeTab={onChangeTab} />
      <MainQuickActions user={user} onChangeTab={onChangeTab} />
    </div>
  );
}

export function TabBalance({ user, payments, loading }: { user: UserData; payments: UserData["payments"]; loading: boolean }) {
  const [showPayBanner, setShowPayBanner] = useState(false);

  if (loading) return <LoadingSpinner />;

  const balance = user.balance || "0.00";
  const payList = payments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-sm mb-1">Текущий баланс</p>
            <p className="text-5xl font-bold font-montserrat" style={{ color: "var(--neon-blue)" }}>
              {balance} ₽
            </p>
          </div>
          <div className="flex gap-3">
            <NeonButton variant="blue" onClick={() => setShowPayBanner(true)}>
              <Icon name="Plus" size={16} />
              Пополнить баланс
            </NeonButton>
            <NeonButton variant="outline" onClick={() => setShowPayBanner(true)}>
              <Icon name="HandCoins" size={16} />
              Обещанный платёж
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      <BalanceForecastCard user={user} />

      {showPayBanner && (
        <PaymentBanner
          onClose={() => setShowPayBanner(false)}
          login={user.login}
          email={user.email}
          phone={user.phone}
        />
      )}

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4">Последние платежи</h3>
        {payList.length === 0 ? (
          <p className="text-white/40 text-sm">Нет данных о платежах</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Дата</th>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Сумма</th>
                  <th className="text-left text-white/40 font-medium pb-3 hidden sm:table-cell">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {payList.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td className="py-3 pr-4 text-white/70">{p.date || "—"}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: "var(--neon-green)" }}>
                      {p.amount ? `${p.amount} ₽` : "—"}
                    </td>
                    <td className="py-3 text-white/50 hidden sm:table-cell">{p.comment || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}