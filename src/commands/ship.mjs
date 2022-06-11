import { join } from 'path';
import { __dirname } from '../bot.js';
import pkg_canvas from 'canvas';
const { createCanvas, loadImage } = pkg_canvas;

export default {

    async run(sock, msg, args) {

        if (!msg.message.extendedTextMessage || msg.message.extendedTextMessage.contextInfo.mentionedJid.length == 0) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Você deve mencionar um ou dois usuários." }, { quoted: msg })
            return;
        }

        var user1 = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        var user2;
        if (msg.message.extendedTextMessage.contextInfo.mentionedJid[1]) {
            user2 = msg.message.extendedTextMessage.contextInfo.mentionedJid[1];
        } else {
            user2 = msg.key.participant ? msg.key.participant : msg.key.remoteJid;
        }

        if (user1 == user2) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Você deve mencionar dois usuários diferentes." }, { quoted: msg })
            return;
        }

        var user1Photo = await sock.profilePictureUrl(user1, 'image');
        var user2Photo = await sock.profilePictureUrl(user2, 'image');

        if (!user1Photo) {
            user1Photo = join(__dirname, "src", "assets", "default.jpg");
        }

        if (!user2Photo) {
            user2Photo = join(__dirname, "src", "assets", "default.jpg");
        }

        const canvas = createCanvas(700, 250)
        const ctx = canvas.getContext("2d")

        const bg = await loadImage(join(__dirname, "src", "assets", "ship", "bg.png"))
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        const avatar = await loadImage(user1Photo)
        ctx.drawImage(avatar, 100, 25, 200, 200)

        const TargetAvatar = await loadImage(user2Photo)
        ctx.drawImage(TargetAvatar, 400, 25, 200, 200)

        const heart = await loadImage(join(__dirname, "src", "assets", "ship", "hearth.png"))
        const broken = await loadImage(join(__dirname, "src", "assets", "ship", "broke.png"))

        const random = Math.floor(Math.random() * 99) + 1

        if (random >= 50) {
            ctx.drawImage(heart, 275, 60, 150, 150)
        } else {
            ctx.drawImage(broken, 275, 60, 150, 150)
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { image: canvas.toBuffer(), caption: `São ${random}% compatíveis.`, }, { quoted: msg })
    },

    info: {
        name: 'Ship',
        description: 'Shippa dois usuários',
        usage: ['ship', 'shippar', 'casal']
    }

}