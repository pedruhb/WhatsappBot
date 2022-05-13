import ytdl from 'ytdl-core';
const { validateURL } = ytdl;
import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;

export default {

    async run(client, message, args) {

        if (args.length == 0) {
            await message.reply("Você deve enviar o link de um vídeo do YouTube.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        if (!validateURL(args[0])) {
            await message.reply("Você deve enviar o link de um vídeo do YouTube.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        var youtube_video = await ytdl.getBasicInfo(args[0]);

        var thumb = youtube_video.videoDetails.thumbnails[(youtube_video.videoDetails.thumbnails.length - 1)];

        if (!thumb || !thumb.url) {
            await message.reply("Erro ao obter thumbnail.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        const media = await MessageMedia.fromUrl(thumb.url, { unsafeMime: true })

        await message.reply(media).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Thumbnail',
        description: 'Obtém a thumbnail de um vídeo do YouTube.',
        usage: 'thumbnail'
    }

}