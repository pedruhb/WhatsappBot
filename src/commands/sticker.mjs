import { downloadContentFromMessage } from '@adiwajshing/baileys'
import ffmpeg from 'fluent-ffmpeg';
import { unlink } from 'fs';
import { join } from 'path';
import { Readable } from "stream"
import { __dirname } from '../bot.js';

export default {

    async run(sock, msg, args) {

        try {

            let buffer = Buffer.from([])

            var message = msg.quotedMessage ? msg.quotedMessage : msg.message;

            console.log(message);

            const messageType = Object.keys(message)[0]

            if (messageType === 'imageMessage') {

                const stream = await downloadContentFromMessage(message.imageMessage, 'image')

                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }

            } else if (messageType === 'videoMessage' && message.videoMessage && message.videoMessage.gifPlayback) {

                const stream = await downloadContentFromMessage(message.videoMessage, 'video')

                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }

            } else {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: "Você deve enviar ou marcar uma imagem ou gif." }, { quoted: msg })
                return;
            }

            const temp_name = join(__dirname, "temp", `sticker_c_${Math.floor(Math.random() * 9999999)}.webp`);

            await new Promise((resolve) => {
                ffmpeg()
                    .input(Readable.from([buffer], { objectMode: false }))
                    .withOptions(['-loop 0'])
                    .on('end', function () {
                        resolve()
                    })
                    .on('error', function (error) {
                        console.log("an error occured" + error.message);
                    })
                    .toFormat("webp")
                    .saveToFile(temp_name)
            });

            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { sticker: { url: temp_name } }, { quoted: msg })

            unlink(temp_name, function (err) {
                if (err) return console.log(err);
            });

        } catch (err) {
            console.log("Sticker Error", err);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao gerar sticker!" }, { quoted: msg })
        }

    },

    info: {
        name: 'Sticker',
        description: 'Transforma uma imagem ou gif em sticker.',
        usage: ['sticker', 'figurinha']
    }

}