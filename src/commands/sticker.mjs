import { downloadContentFromMessage } from '@adiwajshing/baileys'
import sharp from 'sharp';

export default {

    async run(sock, msg, args) {

        try {

            let buffer = Buffer.from([])

            if (msg.quotedMessage) {
                const messageType = Object.keys(msg.quotedMessage)[0]
                if (messageType === 'imageMessage') {
                    const stream = await downloadContentFromMessage(msg.quotedMessage.imageMessage, 'image')
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "A mensagem marcada não é uma imagem." }, { quoted: msg })
                    return;
                }
            } else {
                const messageType = Object.keys(msg.message)[0]
                if (messageType === 'imageMessage') {
                    const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "Você deve enviar ou marcar uma imagem." }, { quoted: msg })
                    return;
                }
            }

            const sticker_buffer = await sharp(buffer).webp().toBuffer().catch(async err => {
                console.log("Sticker Error (Sharp) ", err);
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao gerar sticker!" }, { quoted: msg })
            });

            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { sticker: sticker_buffer }, { quoted: msg })

        } catch (err) {
            console.log("Sticker Error", err);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao gerar sticker!" }, { quoted: msg })
        }

    },

    info: {
        name: 'Sticker',
        description: 'Transforma uma foto/video em sticker.',
        usage: ['sticker', 'figurinha']
    }

}