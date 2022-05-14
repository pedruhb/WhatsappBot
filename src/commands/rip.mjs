import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;
import pkg_canvas from 'canvas';
const { createCanvas, loadImage } = pkg_canvas;
import { join } from 'path';
import { __dirname } from '../bot.js';

export default {

    async run(client, message, args) {

        var userPhoto;

        const mentions = await message.getMentions();
        const quotedMsg = await message.getQuotedMessage();

        if (quotedMsg && quotedMsg.hasMedia) {

            const attachmentData = await quotedMsg.downloadMedia();

            if (attachmentData.mimetype == "image/webp") {
                await message.reply("O formato da imagem mencionada não é válido.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            userPhoto = `data:${attachmentData.mimetype};base64,${attachmentData.data}`;

        } else if (message.hasMedia) {

            const attachmentData = await message.downloadMedia();

            if (attachmentData.mimetype == "image/webp") {
                await message.reply("O formato da imagem enviada não é válido.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            userPhoto = `data:${attachmentData.mimetype};base64,${attachmentData.data}`;

        } else if (mentions.length == 1) {

            userPhoto = await mentions[0].getProfilePicUrl();
            args.shift();

        } else {

            var profile = await message.getContact();
            userPhoto = await profile.getProfilePicUrl();

        }

        if (args.length < 3) {
            await message.reply("Você deve fornecer informações adicionais.\nExemplo: !rip @usuario [nascimento] [morte] [nome da pessoa]").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        var nascimento = args[0];
        var morte = args[1];
        args.shift();
        args.shift();
        var nome = args.join(" ");

        if (!userPhoto) {
            userPhoto = join(__dirname, "src", "assets", "default.jpg");
        }

        const canvas = createCanvas(1080, 1350)
        const ctx = canvas.getContext("2d")
        const avatar = await loadImage(userPhoto);
        const luto = await loadImage(join(__dirname, "src", "assets", "rip", "luto.png"));
        ctx.drawImage(avatar, 10, 135, 1060, canvas.width)
        ctx.font = '70px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(nome, (canvas.width / 2), 70);
        ctx.fillText(`${nascimento} - ${morte}`, (canvas.width / 2), 1285);
        ctx.shadowBlur = (7 * 2);
        ctx.shadowOffsetX = ctx.shadowOffsetY = 5;
        ctx.shadowColor = "white";
        ctx.drawImage(luto, 335, 850, 400, 300);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            data[i] = brightness;
            data[i + 1] = brightness;
            data[i + 2] = brightness;
        }
        ctx.putImageData(imageData, 0, 0);

        const mediaBase64 = canvas.toBuffer().toString('base64');
        const media = new MessageMedia('image/png', mediaBase64);

        await client.sendMessage(message.from, media).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'RIP',
        description: 'Cria imagem de RIP de um usuário.',
        usage: 'rip'
    }

}