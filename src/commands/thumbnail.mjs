import fetch from 'node-fetch';
import Sharp from 'sharp';
import ytdl from 'ytdl-core';
const { validateURL } = ytdl;

export default {

    async run(sock, msg, args) {

        if (args.length == 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Você deve enviar o link de um vídeo do YouTube." }, { quoted: msg })
            return;
        }

        if (!validateURL(args[0])) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Você deve enviar o link de um vídeo do YouTube." }, { quoted: msg })
            return;
        }

        var youtube_video = await ytdl.getBasicInfo(args[0]);

        var thumb = youtube_video.videoDetails.thumbnails[(youtube_video.videoDetails.thumbnails.length - 1)];

        if (!thumb || !thumb.url) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao obter thumbnail." }, { quoted: msg })
            return;
        }

        let fimg = await fetch(thumb.url).catch(async (err) => {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a thumbnail." }, { quoted: msg })
            return;
        });

        if (!fimg || !fimg.headers.get("content-type").startsWith("image")) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a thumbnail." }, { quoted: msg })
            return;
        }

        const imgbuffer = await fimg.arrayBuffer();

        const sticker_buffer = await Sharp(Buffer.from(imgbuffer)).png().toBuffer().catch(async err => {
            console.log("Sticker Error (Sharp) ", err);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a thumbnail." }, { quoted: msg })
        });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { image: sticker_buffer });

    },

    info: {
        name: 'Thumbnail',
        description: 'Obtém a thumbnail de um vídeo do YouTube.',
        usage: ['thumbnail', 'thumb']
    }

}