// ─────────────────────────────────────────────
//  ФОН САЙТА — редактируй здесь
// ─────────────────────────────────────────────
//
//  type: "gradient" — стандартный тёмный градиент (без медиафайла)
//  type: "image"    — фоновая картинка (вставь ссылку в src)
//  type: "video"    — фоновое видео (вставь ссылку в src, формат mp4)

const background = {

  type: "image" as "gradient" | "image" | "video",

  // Ссылка на картинку или видео (заполни если type = "image" или "video")
  src: "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/2334786e-7a81-474a-af1c-ff1ccf1ebcdd.jpg",

  // Затемнение поверх медиафайла: 0 = нет, 0.7 = сильное (число от 0 до 1)
  overlay: 0.72,

};

export default background;