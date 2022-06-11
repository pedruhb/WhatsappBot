import fetch from 'node-fetch';
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
            await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao obter thumbnail." }, { quoted: msg });
            return;
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { image: { url: thumb.url } }, { quoted: msg });

    },

    info: {
        name: 'Thumbnail',
        description: 'Obtém a thumbnail de um vídeo do YouTube.',
        usage: ['thumbnail', 'thumb']
    }

}