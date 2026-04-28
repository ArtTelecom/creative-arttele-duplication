import Icon from "@/components/ui/icon";

export type TabKey = "main" | "balance" | "tariff" | "stats" | "assistant" | "settings";

export const LOGO_URL =
  "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/eab6cd5f-932d-4520-b6dc-7b7f9fa0ff47.jpg";

export const menuItems: { key: TabKey | "logout"; label: string; icon: string }[] = [
  { key: "main", label: "Главная", icon: "Home" },
  { key: "balance", label: "Баланс и оплата", icon: "Wallet" },
  { key: "tariff", label: "Мой тариф", icon: "Wifi" },
  { key: "stats", label: "Статистика", icon: "BarChart3" },
  { key: "assistant", label: "Чат с сотрудником", icon: "MessageCircle" },
  { key: "settings", label: "Настройки", icon: "Settings" },
  { key: "logout", label: "Выход", icon: "LogOut" },
];

export interface UserData {
  login: string;
  name: string;
  balance: string;
  tariff: string;
  speed: string;
  status: string;
  account: string;
  address: string;
  phone: string;
  email: string;
  credit: string;
  ip: string;
  mac: string;
  group: string;
  work_until: string;
  price?: string;
  raw_info?: Record<string, string>;
  payments?: { date?: string; amount?: string; comment?: string }[];
  traffic?: { date?: string; incoming?: string; outgoing?: string }[];
}

export function GlassCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{
        background: "rgba(17, 24, 39, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function NeonButton({
  children,
  onClick,
  variant = "blue",
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "blue" | "green" | "outline";
  className?: string;
  type?: "button" | "submit";
}) {
  const styles: Record<string, React.CSSProperties> = {
    blue: {
      background: "linear-gradient(135deg, var(--neon-blue), #0099cc)",
      boxShadow: "0 0 25px rgba(0, 212, 255, 0.3)",
      color: "#0b0e17",
    },
    green: {
      background: "linear-gradient(135deg, var(--neon-green), #00c462)",
      boxShadow: "0 0 25px rgba(0, 245, 122, 0.3)",
      color: "#0b0e17",
    },
    outline: {
      background: "transparent",
      border: "1px solid rgba(0, 212, 255, 0.3)",
      color: "var(--neon-blue)",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function InputField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-2 font-medium">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
          <Icon name={icon} size={18} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/25 outline-none transition-all duration-200 text-sm focus:border-[rgba(0,212,255,0.4)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        />
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Icon name="Loader2" size={32} className="animate-spin text-[#00d4ff]" />
    </div>
  );
}

export const HOME_TARIFFS: { name: string; speed: string; price: number; mbps: number }[] = [
  { name: "Лайт", speed: "30 Мбит/с", price: 500, mbps: 30 },
  { name: "Базовый", speed: "50 Мбит/с", price: 800, mbps: 50 },
  { name: "Комфорт", speed: "100 Мбит/с", price: 1000, mbps: 100 },
  { name: "Классик-шейк", speed: "150 Мбит/с", price: 1250, mbps: 150 },
  { name: "Старт", speed: "200 Мбит/с", price: 1300, mbps: 200 },
  { name: "Оптима", speed: "300 Мбит/с", price: 1500, mbps: 300 },
  { name: "Премиум", speed: "500 Мбит/с", price: 1700, mbps: 500 },
  { name: "Ультра", speed: "600 Мбит/с", price: 1900, mbps: 600 },
  { name: "Максимум", speed: "1 Гбит/с", price: 2700, mbps: 1000 },
  { name: "Гигабит+", speed: "2.5 Гбит/с", price: 5000, mbps: 2500 },
];

export function findTariffPrice(tariffName?: string): number | null {
  if (!tariffName) return null;
  const lower = tariffName.toLowerCase();
  const byName = HOME_TARIFFS.find((t) => lower.includes(t.name.toLowerCase()));
  if (byName) return byName.price;
  const speedMatch = lower.match(/(\d+)\s*(мбит|гбит)/);
  if (speedMatch) {
    let mbps = parseInt(speedMatch[1], 10);
    if (speedMatch[2].startsWith("гбит")) mbps *= 1000;
    const bySpeed = HOME_TARIFFS.find((t) => t.mbps === mbps)
      || HOME_TARIFFS.reduce<{ t: typeof HOME_TARIFFS[number]; diff: number } | null>((acc, t) => {
        const diff = Math.abs(t.mbps - mbps);
        if (!acc || diff < acc.diff) return { t, diff };
        return acc;
      }, null)?.t;
    if (bySpeed && "price" in bySpeed) return bySpeed.price;
  }
  return null;
}

export function parseDateSafe(raw?: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  const m = s.match(/(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
}

export function formatDateRu(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getDaysWord(n: number): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

export interface BalanceForecast {
  untilDate: string | null;
  daysLeft: number | null;
  hoursLeft: number | null;
  monthlyFee: number | null;
  dailyFee: number | null;
  balanceNum: number | null;
  topUpNeeded: number | null;
  source: "real" | "calculated" | "unknown";
}

export function computeBalanceForecast(user: UserData): BalanceForecast {
  const realPrice = parseFloat((user.price || "").replace(/\s/g, "").replace(",", "."));
  const monthlyFee = isFinite(realPrice) && realPrice > 0
    ? realPrice
    : findTariffPrice(user.tariff);
  const dailyFee = monthlyFee ? +(monthlyFee / 30).toFixed(2) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const balanceNum = parseFloat((user.balance || "0").replace(/\s/g, "").replace(",", "."));
  const hasBalance = isFinite(balanceNum) && !!monthlyFee && monthlyFee > 0 && !!dailyFee && dailyFee > 0;

  const topUpNeeded = hasBalance && balanceNum < (monthlyFee as number)
    ? Math.ceil((monthlyFee as number) - balanceNum)
    : 0;

  // 1. Считаем прогноз по балансу (дробные дни)
  let calcDate: Date | null = null;
  let calcDays: number | null = null;
  let calcDaysFloat = 0;
  if (hasBalance) {
    if (balanceNum <= 0) {
      calcDate = new Date(today);
      calcDays = 0;
      calcDaysFloat = 0;
    } else {
      calcDaysFloat = balanceNum / (dailyFee as number);
      calcDays = Math.floor(calcDaysFloat);
      calcDate = new Date(today);
      const addMs = calcDaysFloat * 24 * 60 * 60 * 1000;
      calcDate = new Date(today.getTime() + addMs);
    }
  }

  // 2. Дата от провайдера (work_until)
  const realDate = parseDateSafe(user.work_until);
  const realDays = realDate ? Math.max(0, daysBetween(today, realDate)) : null;

  // Берём МАКСИМУМ из двух прогнозов
  let finalDate: Date | null = null;
  let finalDays: number | null = null;
  let finalDaysFloat = 0;
  let source: "real" | "calculated" | "unknown" = "unknown";

  if (calcDate && realDate) {
    if (calcDaysFloat >= (realDays as number)) {
      finalDate = calcDate;
      finalDays = calcDays;
      finalDaysFloat = calcDaysFloat;
      source = "calculated";
    } else {
      finalDate = realDate;
      finalDays = realDays;
      finalDaysFloat = realDays as number;
      source = "real";
    }
  } else if (calcDate) {
    finalDate = calcDate;
    finalDays = calcDays;
    finalDaysFloat = calcDaysFloat;
    source = "calculated";
  } else if (realDate) {
    finalDate = realDate;
    finalDays = realDays;
    finalDaysFloat = realDays as number;
    source = "real";
  }

  if (!finalDate) {
    return {
      untilDate: null, daysLeft: null, hoursLeft: null,
      monthlyFee, dailyFee,
      balanceNum: isFinite(balanceNum) ? balanceNum : null,
      topUpNeeded: null,
      source: "unknown",
    };
  }

  const hoursLeft = Math.max(0, Math.floor(finalDaysFloat * 24));

  return {
    untilDate: formatDateRu(finalDate),
    daysLeft: finalDays,
    hoursLeft,
    monthlyFee,
    dailyFee,
    balanceNum: isFinite(balanceNum) ? balanceNum : null,
    topUpNeeded,
    source,
  };
}
