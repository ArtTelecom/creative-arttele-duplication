CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.socials (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    src TEXT NOT NULL DEFAULT '',
    bg TEXT NOT NULL DEFAULT '#000000',
    url TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO t_p33656588_creative_arttele_dup.socials (name, src, bg, url, sort_order) VALUES
('WhatsApp','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg','#25D366','',1),
('YouTube','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg','#FF0000','',2),
('Telegram','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg','#26A5E4','',3),
('Viber','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/viber.svg','#7360F2','',4),
('Instagram','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg','#E4405F','',5),
('Threads','https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/threads.svg','#101010','',6);