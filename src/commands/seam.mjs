import { join } from 'path';
import { __dirname } from '../bot.js';
import { exec } from 'child_process';
import { existsSync, readFileSync, unlink, writeFileSync } from 'fs';
import { downloadContentFromMessage } from '@adiwajshing/baileys';
import sharp from 'sharp';
import fetch from "node-fetch";

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
                userPhoto = buffer;
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
            userPhoto = buffer;
        } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
            userPhoto = await sock.profilePictureUrl(msg.message.extendedTextMessage.contextInfo.mentionedJid[0], 'image')
            var fimg = await fetch(userPhoto);
            var imgbuffer = await fimg.arrayBuffer();
            userPhoto = Buffer.from(imgbuffer)
        } else {
            userPhoto = await sock.profilePictureUrl(msg.key.participant ? msg.key.participant : msg.key.remoteJid, 'image');
            var fimg = await fetch(userPhoto);
            var imgbuffer = await fimg.arrayBuffer();
            userPhoto = Buffer.from(imgbuffer)
        }

        if (!userPhoto) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Imagem inválida!" }, { quoted: msg })
            return;
        }

        const resized_file_path = join(__dirname, "temp", `seam_r_${Math.floor(Math.random() * 9999999)}.png`);
        const complete_file_path = join(__dirname, "temp", `seam_c_${Math.floor(Math.random() * 9999999)}.png`);

        await new Promise(async (resolve) => await sharp(userPhoto).png().resize(300).toFile(resized_file_path, async (err, info) => {
            if (err) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao gerar imagem, tente novamente." }, { quoted: msg })
                return;
            }
            resolve();
        }));

        if (!existsSync(resized_file_path)) {
            console.log("arquivo n existe")
            return;
        }

        exec(`cd "${join(__dirname, "src", `seam_carver`)}" && java SeamCarver "${resized_file_path}" 100 100 "${complete_file_path}"`, async (error, stdout, stderr) => {

            if (error || !existsSync(complete_file_path)) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: "Erro ao gerar imagem, tente novamente." }, { quoted: msg })
                return;
            }

            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { image: { url: complete_file_path } });

            unlink(resized_file_path, (err) => {
                if (err) {
                    console.log(err);
                }
            });

            unlink(complete_file_path, (err) => {
                if (err) {
                    console.log(err);
                }
            });

        });


    },

    info: {
        name: 'Seam Carver',
        description: 'Gera uma imagem Seam Carver.',
        usage: ['seam', 'carver', 'seamcarver']
    }

}