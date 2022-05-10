import * as googleTTS from 'google-tts-api';

export default {

    async run(client, message, args) {

        var mensagem = args.join(' ');

        if (mensagem.length == 0) {
            await client.reply(message.from, "Digite uma mensagem...", message.id).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        if (mensagem.length > 200) {
            await client.reply(message.from, "A mensagem deve ter no máximo 200 caracteres.", message.id).catch((erro) => {
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

        await client.sendVoiceBase64(message.from, `data:audio/mpeg;base64,${audiobase64}`).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Say',
        description: 'Manda um áudio com o texto enviado.',
        usage: 'say'
    }

}