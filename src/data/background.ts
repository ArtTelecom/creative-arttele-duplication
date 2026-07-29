// ─────────────────────────────────────────────
//  ФОН САЙТА — редактируй здесь
// ─────────────────────────────────────────────
//
//  type: "gradient" — стандартный тёмный градиент (без медиафайла)
//  type: "image"    — фоновая картинка (вставь ссылку в src)
//  type: "video"    — фоновое видео (вставь ссылку в src, формат mp4)
//  type: "slideshow"— несколько фото, которые плавно сменяют друг друга

const background = {

  type: "slideshow" as "gradient" | "image" | "video" | "slideshow",

  // Ссылка на картинку или видео (заполни если type = "image" или "video")
  src: "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/493a058c-03d1-45fc-ad97-6e7e981e74e4.jpg",

  // Фото для слайд-шоу (заполни если type = "slideshow")
  slides: [
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/493a058c-03d1-45fc-ad97-6e7e981e74e4.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/39e4e58f-2bd1-49c7-a45c-abbeaa2800fd.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/66c31c0f-735a-4c26-8d47-d3fd8c65959b.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/ec3b65ab-8ca3-4e75-a465-cab789e6f4d3.jpg",
  ],

  // Сколько секунд показывать каждое фото
  slideDuration: 60,

  // Затемнение поверх медиафайла: 0 = нет, 0.7 = сильное (число от 0 до 1)
  overlay: 0,

};

export default background;