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
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/62074cfe-f452-4302-a479-f595fae48988.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/f887322f-2108-48a3-8dd4-7ff44c2b80ce.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/d9c55ea8-563e-47ec-8653-b8142d5358cd.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/6102c9b3-23c8-4cfa-b7a4-96a50349744c.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/ac45329c-7925-430f-af19-99dcfe06dd9c.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/83020552-69f1-410d-8c80-648e0ed2dff2.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/52bd6cfc-8cae-4291-9e5c-0ee374d68ebe.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/0d80a9a5-0ddf-464c-bacf-d4ac36df06c9.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/523f579a-0a2e-4c27-a99a-0f791a72c825.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/51aa9a5c-e709-450a-b390-44cbd5ed7f79.jpg",
  ],

  // Сколько секунд показывать каждое фото
  slideDuration: 60,

  // Затемнение поверх медиафайла: 0 = нет, 0.7 = сильное (число от 0 до 1)
  overlay: 0,

};

export default background;