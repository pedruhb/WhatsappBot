import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;

export default {

    async run(client, message, args) {

        const options = { "sendMediaAsSticker": true, "stickerAuthor": "PHB", "stickerName": "PHB BOT", "stickerCategories": "😀" };

        try {
            if (message.hasMedia) {

                const attachmentData = await message.downloadMedia();
                const media = new MessageMedia(attachmentData.mimetype, attachmentData.data, attachmentData.filename)
                await client.sendMessage(message.from, media, options).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });

            } else {

                const quotedMsg = await message.getQuotedMessage();
                if (quotedMsg && quotedMsg.hasMedia) {
                    const attachmentData = await quotedMsg.downloadMedia();
                    const media = new MessageMedia(attachmentData.mimetype, attachmentData.data, attachmentData.filename)
                    await client.sendMessage(message.from, media, options).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });

                } else {
                    await message.reply("Imagem não encontrada!");
                }
            }
        } catch (err) {
            console.log("Sticker Error", err);
            await message.reply("Erro ao gerar sticker.");
        }

    },

    info: {
        name: 'Sticker',
        description: 'Transforma foto/video em sticker.',
        usage: 'sticker'
    }

}