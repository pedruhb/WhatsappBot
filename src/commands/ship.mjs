import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;
import pkg_canvas from 'canvas';
const { createCanvas, loadImage } = pkg_canvas;
import { join } from 'path';
import { __dirname } from '../bot.js';

export default {

    async run(client, message, args) {

        const mentions = await message.getMentions();

        if (mentions.length == 0) {
            await message.reply("Você deve mencionar um ou dois usuários.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        var user1 = mentions[0];
        var user2;
        if (mentions[1]) {
            user2 = mentions[1];
        } else {
            user2 = await message.getContact();
        }

        if (user1.id.user == user2.id.user) {
            await message.reply("Você deve mencionar dois usuários diferentes.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        var user1Photo = await user1.getProfilePicUrl()
        var user2Photo = await user2.getProfilePicUrl();

        if (user1Photo == undefined || user1Photo == null) {
            user1Photo = join(__dirname, "src", "assets", "default.jpg");
        }

        if (user2Photo == undefined || user2Photo == null) {
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

        const audiobase64 = canvas.toBuffer().toString('base64');
        const media = new MessageMedia('image/png', audiobase64);

        await client.sendMessage(message.from, media, { caption: `São ${random}% compatíveis.` }).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Ship',
        description: 'Shippa dois usuários',
        usage: 'ship'
    }

}