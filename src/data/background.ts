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
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/fecc195e-ff8a-4ce8-a38b-97dec1650f75.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/558ed2ec-690e-41f4-8e0c-c9f315783183.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/18f4421e-2e2a-4601-878b-a3e4e0a30feb.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/ec849118-8f24-4f04-8cb3-6023102d2ba2.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/0822b59f-298b-449c-aaf5-f9243020f455.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/de837121-2e05-4931-9faa-570777dd169c.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/3d3cadb0-85b7-46dc-b6a3-4f2ba855ef20.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/301d50fc-18ae-4984-971f-561477d3b4c1.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/2b46541f-d8d9-4584-9ff0-46f7b2b594e1.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/7ff82434-246f-4d81-aea5-5efd76d5cd4e.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/9a731bfe-fb0e-4827-97e1-9723b5b3473d.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/4ac859dd-1fe8-4870-b6be-aa3a7aef4b72.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/ab4ba20d-4f69-4937-94d8-6411cb7d4169.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/d635c573-484e-4772-9d3e-15bf3d30f60c.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/ce3ecf7d-454a-4f06-9a52-37241550cd7c.jpg",
    "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/4a5a7ad5-ab56-4771-961b-61d921a0ee58.jpg",
  ],

  // Сколько секунд показывать каждое фото
  slideDuration: 60,

  // Затемнение поверх медиафайла: 0 = нет, 0.7 = сильное (число от 0 до 1)
  overlay: 0,

};

export default background;