import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;
import pkg_canvas from 'canvas';
const { createCanvas, loadImage } = pkg_canvas;
import { join } from 'path';
import { __dirname } from '../bot.js';
import { exec } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

export default {

    async run(client, message, args) {

        var userPhoto;

        const mentions = await message.getMentions();
        const quotedMsg = await message.getQuotedMessage();

        if (quotedMsg && quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            userPhoto = `data:${attachmentData.mimetype};base64,${attachmentData.data}`;
        } else if (message.hasMedia) {
            const attachmentData = await message.downloadMedia();
            userPhoto = `data:${attachmentData.mimetype};base64,${attachmentData.data}`;
        } else if (mentions.length == 1) {
            userPhoto = await mentions[0].getProfilePicUrl();
        } else {

            var profile = await message.getContact();
            userPhoto = await profile.getProfilePicUrl();
        }

        if (!userPhoto) {
            await message.reply("Imagem inválida!").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
        }

        const canvas = createCanvas(300, 300)
        const ctx = canvas.getContext("2d")
        const avatar = await loadImage(userPhoto);
        ctx.drawImage(avatar, 0, 0, 300, 300)

        const buffer_resized = canvas.toBuffer('image/png')

        const resized_file_path = join(__dirname, "temp", `seam_r_${Math.floor(Math.random() * 9999999)}.png`);
        const complete_file_path = join(__dirname, "temp", `seam_c_${Math.floor(Math.random() * 9999999)}.png`);

        writeFileSync(resized_file_path, buffer_resized);

        exec(`cd "${join(__dirname, "src", `seam_carver`)}" && java SeamCarver "${resized_file_path}" 100 100 "${complete_file_path}"`, async (error, stdout, stderr) => {

            if (error || !existsSync(complete_file_path)) {
                await message.reply("Erro ao gerar imagem, tente novamente.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            const media = MessageMedia.fromFilePath(complete_file_path);

            await client.sendMessage(message.from, media).catch((erro) => {
                console.error('Error when sending: ', erro);
            });

        });


    },

    info: {
        name: 'Seam Carver',
        description: 'Gera uma imagem Seam Carver.',
        usage: 'seam'
    }

}