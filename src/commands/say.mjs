import * as googleTTS from 'google-tts-api';
import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;

export default {

    async run(client, message, args) {

        var mensagem = args.join(' ');

        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg) {
            mensagem = quotedMsg.body;
        }

        if (mensagem.length == 0) {
            await message.reply("Digite uma mensagem...").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        if (mensagem.length > 200) {
            await message.reply("A mensagem deve ter no máximo 200 caracteres.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        var audiobase64 = await googleTTS.getAudioBase64(mensagem, {
            lang: 'pt',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        }).then((result) => { return result }).catch(console.error);

        const media = new MessageMedia('audio/mpeg', audiobase64);

        await message.reply(media).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Say',
        description: 'Transcreve uma mensagem ou texto.',
        usage: 'say'
    }

}