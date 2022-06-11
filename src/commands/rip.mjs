
import { join } from 'path';
import { __dirname } from '../bot.js';
import { downloadContentFromMessage } from '@adiwajshing/baileys'
import pkg from 'canvas';
const { createCanvas, loadImage } = pkg;

export default {

    async run(sock, msg, args) {

        if (args.length < 3) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Você deve fornecer informações adicionais.\nExemplo: !rip @usuario [nascimento] [morte] [nome da pessoa]" }, { quoted: msg })
            return;
        }

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
                userPhoto = buffer.toString('base64');
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
            userPhoto = buffer.toString('base64');
        } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
            userPhoto = await sock.profilePictureUrl(msg.message.extendedTextMessage.contextInfo.mentionedJid[0], 'image')
            args.shift();
        } else {
            userPhoto = await sock.profilePictureUrl(msg.key.participant ? msg.key.participant : msg.key.remoteJid, 'image');
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
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
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

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { image: canvas.toBuffer('image/png') }, { quoted: msg })

    },

    info: {
        name: 'RIP',
        description: 'Cria imagem de RIP de um usuário.',
        usage: ['rip', 'morte']
    }

}