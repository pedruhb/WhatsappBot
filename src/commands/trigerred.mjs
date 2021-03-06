
import { join } from 'path';
import { __dirname } from '../bot.js';
import { downloadContentFromMessage } from '@adiwajshing/baileys'
import { unlink, writeFileSync } from 'fs';
import canvacord from 'canvacord';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

export default {

    async run(sock, msg, args) {

        var userPhoto;
        let buffer = Buffer.from([]);
        const messageType = Object.keys(msg.message)[0];

        if (msg.quotedMessage) {
            const messageType = Object.keys(msg.quotedMessage)[0]
            if (messageType === 'imageMessage') {
                const stream = await downloadContentFromMessage(msg.quotedMessage.imageMessage, 'image')
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }
                userPhoto = `data:image/png;base64,${buffer.toString('base64')}`
            } else {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: "A mensagem marcada não é uma imagem." }, { quoted: msg })
                return;
            }
        } else if (messageType === 'imageMessage') {
            const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            userPhoto = `data:image/png;base64,${buffer.toString('base64')}`
        } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
            try {
                userPhoto = await sock.profilePictureUrl(msg.message.extendedTextMessage.contextInfo.mentionedJid[0], 'image')
            } catch (err) {
                /// Foto privada
            }
        } else {
            try {
                userPhoto = await sock.profilePictureUrl(msg.key.participant ? msg.key.participant : msg.key.remoteJid, 'image');
            } catch (err) {
                /// Foto privada
            }
        }

        if (!userPhoto) {
            userPhoto = join(__dirname, "src", "assets", "default.jpg");
        }

        let image = await canvacord.Canvas.trigger(userPhoto);

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });

        const temp_name = join(__dirname, "temp", `trigger_${Math.floor(Math.random() * 9999999)}.gif`);
        var temp_name_c;

        writeFileSync(temp_name, image);

        if (args.join(" ").includes("sticker") || args.join(" ").includes("figurinha")) {

            temp_name_c = join(__dirname, "temp", `trigger_${Math.floor(Math.random() * 9999999)}.webp`);

            await new Promise((resolve) => {
                ffmpeg()
                    .input(temp_name)
                    .withOptions(['-loop 0'])
                    .on('end', function () {
                        resolve()
                    })
                    .on('error', function (error) {
                        console.log("an error occured" + error.message);
                    })
                    .outputOptions(["-pix_fmt yuv420p"])
                    .saveToFile(temp_name_c)
            });

            await sock.sendMessage(msg.key.remoteJid, { sticker: { url: temp_name_c } }, { quoted: msg })

        } else {

            temp_name_c = join(__dirname, "temp", `trigger_${Math.floor(Math.random() * 9999999)}.mp4`);

            await new Promise((resolve) => {
                ffmpeg()
                    .input(temp_name)
                    .on('end', function () {
                        resolve()
                    })
                    .on('error', function (error) {
                        console.log("an error occured" + error.message);
                    })
                    .outputOptions(["-pix_fmt yuv420p"])
                    .saveToFile(temp_name_c)
            });

            await sock.sendMessage(msg.key.remoteJid, { video: { url: temp_name_c }, gifPlayback: true }, { quoted: msg })

        }

        unlink(temp_name, function (err) {
            if (err) return console.log(err);
        });

        unlink(temp_name_c, function (err) {
            if (err) return console.log(err);
        });

    },

    info: {
        name: 'trigger',
        description: 'Se mandado com sticker na mensagem irá ser enviado como sticker.',
        usage: ['trigger', 'triggered']
    }

}