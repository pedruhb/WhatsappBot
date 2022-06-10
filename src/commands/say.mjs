import * as googleTTS from 'google-tts-api';

export default {

    async run(sock, msg, args) {

        var mensagem = args.join(' ');

        if (msg.quotedMessage) {
            mensagem = msg.quotedMessage.conversation;
        }

        if (mensagem.length == 0) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Digite uma mensagem..." }, { quoted: msg })
            return;
        }

        if (mensagem.length > 200) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "A mensagem deve ter no máximo 200 caracteres." }, { quoted: msg })
            return;
        }

        var audiobase64 = await googleTTS.getAudioBase64(mensagem, {
            lang: 'pt',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        }).then((result) => { return result }).catch(console.error);

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { audio: Buffer.from(audiobase64, 'base64'), mimetype: 'audio/mpeg', ptt: true }, { quoted: msg })

    },

    info: {
        name: 'SAY',
        description: 'Transcreve uma mensagem ou texto.',
        usage: ['say', 'tts', 'falar', 'ler']
    }

}