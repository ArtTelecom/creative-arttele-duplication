// ═══════════════════════════════════════════════════════
//  НАСЕЛЁННЫЕ ПУНКТЫ — редактируй здесь
//  Каждый пункт: свои тарифы, акции и описание
// ═══════════════════════════════════════════════════════

export type TariffColor = "blue" | "green" | "purple";

export interface LocationTariff {
  name: string;
  speed: string;          // Мбит/с
  price: string;          // ₽/мес
  oldPrice?: string;
  popular?: boolean;
  color: TariffColor;
  features: string[];
  badge?: string;         // доп. бейдж (напр. "Только новым")
}

export interface LocationPromo {
  title: string;
  desc: string;
  badge?: string;
  color: TariffColor;
}

export interface Location {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  tariffs: LocationTariff[];
  promos: LocationPromo[];
}

// Единая линейка тарифов для всех населённых пунктов
const commonTariffs: LocationTariff[] = [
  {
    name: "Лайт",
    speed: "30",
    price: "500",
    color: "blue",
    features: ["30 Мбит/с", "Безлимит", "Поддержка 24/7"],
  },
  {
    name: "Базовый",
    speed: "50",
    price: "800",
    color: "blue",
    features: ["50 Мбит/с", "Безлимит", "Поддержка 24/7"],
  },
  {
    name: "Комфорт",
    speed: "100",
    price: "1000",
    color: "blue",
    features: ["100 Мбит/с", "Безлимит", "Поддержка 24/7"],
  },
  {
    name: "Старт",
    speed: "200",
    price: "1300",
    color: "green",
    features: ["200 Мбит/с", "Безлимит", "Поддержка 24/7"],
  },
  {
    name: "Оптима",
    speed: "300",
    price: "1500",
    color: "green",
    popular: true,
    features: [
      "300 Мбит/с",
      "Безлимит",
      "Поддержка 24/7",
      "__social__",
    ],
  },
  {
    name: "Премиум",
    speed: "500",
    price: "1700",
    color: "purple",
    features: ["500 Мбит/с", "Безлимит", "Поддержка 24/7", "__social__"],
  },
  {
    name: "Ультра",
    speed: "600",
    price: "1900",
    color: "purple",
    features: ["600 Мбит/с", "Безлимит", "Поддержка 24/7", "__social__"],
  },
  {
    name: "Максимум",
    speed: "1000",
    price: "2700",
    color: "purple",
    features: ["1 Гбит/с", "Безлимит", "Поддержка 24/7", "__social__"],
  },
  {
    name: "Гигабит+",
    speed: "2500",
    price: "5000",
    color: "purple",
    badge: "Для ИП и ООО",
    features: ["2.5 Гбит/с", "Безлимит", "Приоритетная поддержка", "Только для ИП и ООО", "__social__"],
  },
];

const locations: Location[] = [
  {
    slug: "oazis",
    name: "Оазис",
    description: "Подключение к гигабитной оптике. Доступны все тарифы линейки.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Роутер Wi-Fi 6 в подарок", desc: "При подключении тарифа «Максимум».", badge: "Подарок", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "noviy",
    name: "Новый",
    description: "Высокоскоростной интернет для жителей посёлка Новый.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Скидка 20% на первые 3 месяца", desc: "Для новых абонентов при подключении любого тарифа.", badge: "Акция", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "otradniy",
    name: "Отрадный",
    description: "Стабильный интернет для Отрадного. Подключение за 24 часа.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Подключение за 0 ₽", desc: "Бесплатное подключение и прокладка кабеля до квартиры.", badge: "Бесплатно", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "natuhay",
    name: "Натухай",
    description: "Оптоволоконный интернет в Натухае. Без ограничений трафика.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Скидка 15% пенсионерам", desc: "Постоянная скидка на любой тариф для пенсионеров при предъявлении удостоверения.", badge: "Льгота", color: "purple" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "enem",
    name: "Энем",
    description: "Быстрый интернет для жителей Энема. Гигабит уже доступен.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Два месяца по цене одного", desc: "При оплате на 6 месяцев вперёд — 2 месяца бесплатно.", badge: "Выгода", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "enem-dachi",
    name: "Энем-дачи",
    description: "Сезонное и круглогодичное подключение для дачного посёлка Энем-дачи.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Дачный тариф — заморозка на зиму", desc: "Приостановите тариф на зимний период без потери номера и настроек.", badge: "Дачникам", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "dachi-otrada",
    name: "Дачи Отрада и Пчелка",
    description: "Интернет для дачных посёлков Отрада и Пчелка. Один договор — две точки.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Установка за 1 ₽", desc: "Символическая стоимость подключения при заключении договора на год.", badge: "Выгода", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "noviy-sad",
    name: "Новый Сад",
    description: "Оптоволокно в каждый дом посёлка Новый Сад.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Первый месяц — 1 ₽", desc: "Специальное предложение для новых абонентов Нового Сада.", badge: "Акция", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "supovskiy",
    name: "Суповский",
    description: "Надёжный интернет для посёлка Суповский. Поддержка 24/7.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Скидка 10% на годовую оплату", desc: "Оплатите сразу за год и сэкономьте 10%.", badge: "Выгода", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "pricepilovka",
    name: "Прицепиловка",
    description: "Стабильный интернет в Прицепиловке. Быстрое подключение.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "Бесплатный роутер", desc: "При подключении на срок от 6 месяцев роутер в аренду бесплатно.", badge: "Подарок", color: "blue" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "shuvaevskiy",
    name: "Шуваев",
    description: "Оптоволоконный интернет в Шуваеве. Без ограничений.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
      { title: "ТВ 3 месяца бесплатно", desc: "При подключении тарифа «Про» или «Максимум».", badge: "Акция", color: "purple" },
    ],
    tariffs: commonTariffs,
  },
  {
    slug: "plodorodniy",
    name: "Плодородный",
    description: "Оптоволоконный интернет в посёлке Плодородный, улица Тихорецкая. Без ограничений трафика.",
    available: true,
    promos: [
      { title: "Социальный тариф для новых", desc: "30 Мбит/с за 500 ₽ — первые 3 месяца, затем автоматический переход на Оптима+.", badge: "Акция", color: "green" },
    ],
    tariffs: [
      {
        name: "Комфорт",
        speed: "100",
        price: "1250",
        color: "blue",
        features: ["100 Мбит/с", "Безлимит", "Поддержка 24/7"],
      },
      {
        name: "Старт",
        speed: "200",
        price: "1400",
        color: "green",
        features: ["200 Мбит/с", "Безлимит", "Поддержка 24/7"],
      },
      {
        name: "Оптима",
        speed: "300",
        price: "1600",
        color: "green",
        popular: true,
        features: ["300 Мбит/с", "Безлимит", "Поддержка 24/7", "__social__"],
      },
      {
        name: "Премиум",
        speed: "500",
        price: "1800",
        color: "purple",
        features: ["500 Мбит/с", "Безлимит", "Поддержка 24/7", "__social__"],
      },
    ],
  },
];

export default locations;