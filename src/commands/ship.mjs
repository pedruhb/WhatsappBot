import { join } from 'path';
import { __dirname } from '../bot.js';
import pkg from '@napi-rs/canvas';
import fetch from 'node-fetch';
const { createCanvas, Image } = pkg;
import { readFile } from 'fs';

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
        var fimg1 = await fetch(user1Photo);
        var imgbuffer1 = await fimg1.arrayBuffer();
        user1Photo = Buffer.from(imgbuffer1)

        var user2Photo = await sock.profilePictureUrl(user2, 'image');
        var fimg2 = await fetch(user2Photo);
        var imgbuffer2 = await fimg2.arrayBuffer();
        user2Photo = Buffer.from(imgbuffer2)

        if (!user1Photo) {
            user1Photo = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "default.jpg"), (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                resolve(data);
            }));
        }

        if (!user2Photo) {
            user2Photo = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "default.jpg"), (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                resolve(data);
            }));
        }

        var heartimg = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "ship", "hearth.png"), (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        }));

        var brokenimg = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "ship", "broke.png"), (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        }));

        var bgimg = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "ship", "bg.png"), (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        }));

        const canvas = createCanvas(700, 250)
        const ctx = canvas.getContext("2d")

        const bg = new Image();
        bg.src = bgimg;

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        const avatar = new Image();
        avatar.src = user1Photo;

        ctx.drawImage(avatar, 100, 25, 200, 200)

        const TargetAvatar = new Image();
        TargetAvatar.src = user2Photo;

        ctx.drawImage(TargetAvatar, 400, 25, 200, 200)

        const heart = new Image();
        heart.src = heartimg;

        const broken = new Image();
        broken.src = brokenimg;

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