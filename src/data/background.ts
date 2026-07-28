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
  src: "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/2334786e-7a81-474a-af1c-ff1ccf1ebcdd.jpg",

  // Фото для слайд-шоу (заполни если type = "slideshow")
  slides: [
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/2334786e-7a81-474a-af1c-ff1ccf1ebcdd.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/f6a7e322-2bab-4a1d-b17f-1f0816ed9c25.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/424e77a2-965a-4f46-8d87-79c973cdfa5c.jpg",
  ],

  // Сколько секунд показывать каждое фото
  slideDuration: 60,

  // Затемнение поверх медиафайла: 0 = нет, 0.7 = сильное (число от 0 до 1)
  overlay: 0,

};

export default background;