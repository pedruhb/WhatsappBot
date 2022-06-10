
import { join } from 'path';
import { __dirname } from '../bot.js';
import { downloadContentFromMessage } from '@adiwajshing/baileys'
import { createWriteStream, readFile, readFileSync, unlink, writeFile } from 'fs';
import pkg from '@napi-rs/canvas';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
ffmpeg.setFfmpegPath(join(__dirname, "src", "ffmpeg", "ffmpeg.exe"));
const { createCanvas, Image } = pkg;
import GIFEncoder from 'gifencoder';

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
            userPhoto = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "default.jpg"), (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                resolve(data);
            }));
        }

        var triggered = await new Promise((resolve) => readFile(join(__dirname, "src", "assets", "triggered.png"), (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        }));

        const base = new Image();
        base.src = triggered;

        const img = new Image();
        img.src = userPhoto;

        const GIF = new GIFEncoder(256, 310);
        GIF.start();
        GIF.setRepeat(0);
        GIF.setDelay(15);

        const canvas = createCanvas(256, 310);
        const ctx = canvas.getContext("2d");
        const BR = 30;
        const LR = 20;

        for (var i = 0; i < 9; i++) {
            ctx.clearRect(0, 0, 256, 310);
            ctx.drawImage(
                img,
                Math.floor(Math.random() * BR) - BR,
                Math.floor(Math.random() * BR) - BR,
                256 + BR,
                310 - 54 + BR
            );
            ctx.fillStyle = "#ffb8b885";
            ctx.fillRect(0, 0, 256, 310);
            ctx.drawImage(
                base,
                Math.floor(Math.random() * LR) - LR,
                310 - 54 + Math.floor(Math.random() * LR) - LR,
                256 + LR,
                54 + LR
            );
            GIF.addFrame(ctx);
        }

        GIF.finish();

        const imagedata = GIF.out.getData();

        if (args.join(" ").includes("sticker")) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { sticker: imagedata }, { quoted: msg })
        } else {

            const temp_name = join(__dirname, "temp", `${Math.floor(Math.random() * 101)}_${msg.key.remoteJid}.gif`);
            const temp_name_c = join(__dirname, "temp", `${Math.floor(Math.random() * 101)}_${msg.key.remoteJid}.mp4`);

            new Promise((resolve, reject) => {
                writeFile(temp_name, imagedata, (err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })

            ffmpeg(temp_name).outputOptions([
                "-pix_fmt yuv420p",
                "-c:v libx264",
                "-movflags +faststart",
                "-filter:v crop='floor(in_w/2)*2:floor(in_h/2)*2'",
            ]).noAudio().output(temp_name_c)
                .on("end", async () => {

                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { video: readFileSync(temp_name_c), gifPlayback: true }, { quoted: msg })

                    unlink(temp_name, function (err) {
                        if (err) return console.log(err);
                    });

                    unlink(temp_name_c, function (err) {
                        if (err) return console.log(err);
                    });

                })
                .on("error", (e) => {
                    console.log(e)
                    fs.unlink(temp_name, function (err) {
                        if (err) return console.log(err);
                    });
                    fs.unlink(temp_name_c, function (err) {
                        if (err) return console.log(err);
                    });
                })
                .run();

        }

    },

    info: {
        name: 'trigger',
        description: 'Se mandado com sticker na mensagem irá ser enviado como sticker.',
        usage: ['trigger', 'triggered']
    }

}