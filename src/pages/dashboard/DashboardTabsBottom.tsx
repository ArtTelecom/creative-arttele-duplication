import { useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  UserData,
  GlassCard,
  NeonButton,
  InputField,
  LoadingSpinner,
  computeBalanceForecast,
  getDaysWord,
} from "./DashboardShared";
import SpeedHistoryChart from "./SpeedHistoryChart";

export function TabTariff({ user, loading }: { user: UserData; loading: boolean }) {
  if (loading) return <LoadingSpinner />;

  const tariffs: { name: string; speed: string; price: number; popular?: boolean }[] = [
    { name: "Лайт", speed: "30 Мбит/с", price: 500 },
    { name: "Базовый", speed: "50 Мбит/с", price: 800 },
    { name: "Комфорт", speed: "100 Мбит/с", price: 1000 },
    { name: "Старт", speed: "200 Мбит/с", price: 1300 },
    { name: "Оптима", speed: "300 Мбит/с", price: 1500, popular: true },
    { name: "Премиум", speed: "500 Мбит/с", price: 1700 },
    { name: "Ультра", speed: "600 Мбит/с", price: 1900 },
    { name: "Максимум", speed: "1 Гбит/с", price: 2700 },
    { name: "Гигабит+", speed: "2.5 Гбит/с", price: 5000 },
  ];

  const forecast = computeBalanceForecast(user);
  const isUrgent = forecast.daysLeft !== null && forecast.daysLeft <= 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-1">Текущий тариф</h3>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0, 245, 122, 0.12)", border: "1px solid rgba(0, 245, 122, 0.2)" }}
          >
            <Icon name="Wifi" size={24} style={{ color: "var(--neon-green)" }} />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user.tariff || "—"}</p>
            <p className="text-white/40 text-sm">{user.speed || ""}</p>
          </div>
        </div>
        {user.group && (
          <p className="text-white/40 text-sm mt-3">Сетевая группа: {user.group}</p>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Wallet" size={16} style={{ color: "var(--neon-blue)" }} />
            <span className="text-white/50 text-xs uppercase tracking-wider">Оплата по тарифу</span>
          </div>
          <p className="text-2xl font-bold text-white font-montserrat">
            {forecast.monthlyFee !== null ? `${forecast.monthlyFee} ₽` : "—"}
          </p>
          <p className="text-white/40 text-xs mt-1">в месяц</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Timer" size={16} style={{ color: "var(--neon-green)" }} />
            <span className="text-white/50 text-xs uppercase tracking-wider">Списание в день</span>
          </div>
          <p className="text-2xl font-bold text-white font-montserrat">
            {forecast.dailyFee !== null ? `${forecast.dailyFee} ₽` : "—"}
          </p>
          <p className="text-white/40 text-xs mt-1">≈ {forecast.monthlyFee ? "месяц / 30" : "нет данных"}</p>
        </GlassCard>
        <GlassCard
          className="p-5"
          style={
            isUrgent
              ? {
                  background: "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.05))",
                  border: "1px solid rgba(239,68,68,0.25)",
                }
              : undefined
          }
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon
              name="CalendarClock"
              size={16}
              style={{ color: isUrgent ? "#ef4444" : "var(--neon-purple)" }}
            />
            <span className="text-white/50 text-xs uppercase tracking-wider">Баланса хватит до</span>
          </div>
          <p
            className="text-2xl font-bold font-montserrat"
            style={{ color: isUrgent ? "#ef4444" : "#fff" }}
          >
            {forecast.untilDate || "—"}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {forecast.daysLeft !== null
              ? `≈ ${forecast.daysLeft} ${getDaysWord(forecast.daysLeft)}`
              : "нет данных"}
          </p>
        </GlassCard>
      </div>

      {user.address && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white font-montserrat mb-3">Адрес подключения</h3>
          <p className="text-white/70">{user.address}</p>
        </GlassCard>
      )}

      <div>
        <h3 className="text-lg font-bold text-white font-montserrat mb-4">Доступные тарифы</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tariffs.map((t) => {
            const isActive = user.tariff?.toLowerCase().includes(t.name.toLowerCase());
            return (
              <GlassCard
                key={t.name}
                className={`p-6 relative overflow-hidden transition-all duration-300 ${isActive ? "" : "card-hover"}`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,245,122,0.06))",
                        border: "1px solid rgba(0, 212, 255, 0.35)",
                        boxShadow: "0 0 40px rgba(0, 212, 255, 0.08)",
                      }
                    : undefined
                }
              >
                {isActive && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))",
                      color: "#0b0e17",
                    }}
                  >
                    Текущий
                  </div>
                )}
                {!isActive && t.popular && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                      color: "#fff",
                    }}
                  >
                    Популярный
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xl font-bold text-white font-montserrat">{t.name}</p>
                  <p className="text-white/40 text-sm mt-1">{t.speed}</p>
                </div>
                <p className="text-3xl font-bold font-montserrat mb-1" style={{ color: isActive ? "var(--neon-blue)" : "white" }}>
                  {t.price} ₽
                </p>
                <p className="text-white/40 text-sm mb-5">в месяц</p>
                {isActive ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--neon-green)" }}>
                    <Icon name="CheckCircle" size={16} />
                    Подключён
                  </div>
                ) : (
                  <NeonButton variant="outline" className="w-full" onClick={() => toast.info("Для смены тарифа позвоните: +7 (902) 404-88-50")}>
                    Подключить
                  </NeonButton>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TabStats({
  traffic,
  payments,
  loading,
  login,
}: {
  traffic: UserData["traffic"];
  payments: UserData["payments"];
  loading: boolean;
  login?: string;
}) {
  const trafficList = traffic || [];
  const paymentsList = payments || [];
  const hasAnyData = paymentsList.length > 0 || trafficList.length > 0;
  if (loading && !hasAnyData) return <LoadingSpinner />;

  const totalPaid = paymentsList.reduce((sum, p) => {
    const n = parseFloat((p.amount || "0").replace(/\s/g, "").replace(",", "."));
    return isFinite(n) && n > 0 ? sum + n : sum;
  }, 0);

  const lastPayment = paymentsList.find((p) => {
    const n = parseFloat((p.amount || "0").replace(/\s/g, "").replace(",", "."));
    return isFinite(n) && n > 0;
  }) || paymentsList[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {login && <SpeedHistoryChart login={login} />}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
          <Icon name="Wallet" size={20} style={{ color: "var(--neon-green)" }} />
          Статистика платежей
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(0,245,122,0.06)",
              border: "1px solid rgba(0,245,122,0.18)",
            }}
          >
            <p className="text-white/45 text-xs uppercase tracking-wider mb-1.5">Всего платежей</p>
            <p className="text-2xl font-bold text-white font-montserrat">
              {paymentsList.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.18)",
            }}
          >
            <p className="text-white/45 text-xs uppercase tracking-wider mb-1.5">Сумма пополнений</p>
            <p className="text-2xl font-bold font-montserrat" style={{ color: "var(--neon-blue)" }}>
              {totalPaid > 0 ? `${totalPaid.toFixed(2)} ₽` : "—"}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(168,85,247,0.06)",
              border: "1px solid rgba(168,85,247,0.18)",
            }}
          >
            <p className="text-white/45 text-xs uppercase tracking-wider mb-1.5">Последний платёж</p>
            <p className="text-2xl font-bold text-white font-montserrat">
              {lastPayment?.amount ? `${lastPayment.amount} ₽` : "—"}
            </p>
            {lastPayment?.date && (
              <p className="text-white/40 text-xs mt-0.5">{lastPayment.date}</p>
            )}
          </div>
        </div>

        {paymentsList.length === 0 ? (
          <p className="text-white/40 text-sm">Нет данных о платежах</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Дата</th>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Сумма</th>
                  <th className="text-left text-white/40 font-medium pb-3">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.map((row, i) => {
                  const num = parseFloat((row.amount || "0").replace(/\s/g, "").replace(",", "."));
                  const isCharge = isFinite(num) && num < 0;
                  const rowBg = isCharge
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(0,245,122,0.06)";
                  const amountColor = isCharge ? "#ef4444" : "var(--neon-green)";
                  const sign = isCharge ? "" : (num > 0 ? "+" : "");
                  return (
                    <tr
                      key={i}
                      className="border-b last:border-b-0"
                      style={{
                        borderColor: "rgba(255,255,255,0.04)",
                        background: rowBg,
                      }}
                    >
                      <td className="py-3 pr-4 text-white/70 pl-3">{row.date || "—"}</td>
                      <td className="py-3 pr-4 font-semibold" style={{ color: amountColor }}>
                        {row.amount ? `${sign}${row.amount} ₽` : "—"}
                      </td>
                      <td className="py-3 pr-3 text-white/70">{row.comment || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
          <Icon name="BarChart3" size={20} style={{ color: "var(--neon-blue)" }} />
          Статистика трафика
        </h3>
        {trafficList.length === 0 ? (
          <p className="text-white/40 text-sm">Нет данных о трафике</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Дата</th>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Входящий</th>
                  <th className="text-left text-white/40 font-medium pb-3">Исходящий</th>
                </tr>
              </thead>
              <tbody>
                {trafficList.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td className="py-3 pr-4 text-white/70">{row.date || "—"}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: "var(--neon-blue)" }}>
                      {row.incoming || "—"}
                    </td>
                    <td className="py-3 font-semibold" style={{ color: "var(--neon-green)" }}>
                      {row.outgoing || "—"}
                    </td>
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

export function TabSettings({ user }: { user: UserData }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");

  const handleChangePassword = () => {
    toast.info("Для изменения пароля обратитесь в поддержку: +7 (902) 404-88-50");
  };

  const handleSaveContacts = () => {
    toast.info("Для изменения контактных данных обратитесь в поддержку: +7 (902) 404-88-50");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-5 flex items-center gap-2">
          <Icon name="Lock" size={20} style={{ color: "var(--neon-blue)" }} />
          Смена пароля
        </h3>
        <div className="space-y-4 max-w-md">
          <InputField
            label="Текущий пароль"
            icon="Lock"
            type="password"
            value={oldPass}
            onChange={setOldPass}
            placeholder="Введите текущий пароль"
          />
          <InputField
            label="Новый пароль"
            icon="KeyRound"
            type="password"
            value={newPass}
            onChange={setNewPass}
            placeholder="Введите новый пароль"
          />
          <InputField
            label="Подтверждение пароля"
            icon="KeyRound"
            type="password"
            value={confirmPass}
            onChange={setConfirmPass}
            placeholder="Повторите новый пароль"
          />
          <NeonButton variant="blue" onClick={handleChangePassword}>
            <Icon name="Save" size={16} />
            Сменить пароль
          </NeonButton>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-5 flex items-center gap-2">
          <Icon name="UserCog" size={20} style={{ color: "var(--neon-green)" }} />
          Контактные данные
        </h3>
        <div className="space-y-4 max-w-md">
          <InputField
            label="Телефон"
            icon="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="+7 (___) ___-__-__"
          />
          <InputField
            label="Email"
            icon="Mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
          />
          <NeonButton variant="green" onClick={handleSaveContacts}>
            <Icon name="Save" size={16} />
            Сохранить
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}