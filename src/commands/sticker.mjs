
import * as googleTTS from 'google-tts-api';

export default {

    async run(client, message, args) {

        if (message.type == "image") {
            const buffer = await client.decryptFile(message);
            if (message.mimetype.startsWith("image")) {
                await client.sendImageAsSticker(message.from, `data:image/png;base64,${buffer.toString('base64')}`).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            } else {
                await client.sendText(message.from, "Você deve enviar uma imagem.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            }
        } else if (message.type == "video") {
            await client.reply(message.from, "Comando disponível apenas em imagem.", message.id).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
        }
    },

    info: {
        name: 'Sticker',
        description: 'Transforma uma foto enviada com essa descrição em sticker.',
        usage: 'sticker'
    }

}