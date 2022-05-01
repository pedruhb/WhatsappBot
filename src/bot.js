import venom from 'venom-bot';
import TikTokScraper from 'tiktok-scraper';
import fetch from 'node-fetch';
import fs, { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ytdl from 'ytdl-core';
import Enmap from 'enmap';
import config from './config.js';

export const __dirname = join(dirname(fileURLToPath(import.meta.url)), "../");
const cmdFiles = readdirSync(join(__dirname, "src", "commands"))

venom.create({ session: 'session' }).then((client) => start(client)).catch((erro) => {
    console.log(erro);
});

async function start(client) {

    client.commands = new Enmap();

    cmdFiles.forEach(async (f) => {
        try {
            const props = await import(`./commands/${f}`).catch(err => { console.log(err); });
            if (f.split('.').slice(-1)[0] !== 'mjs') return;
            console.log('\u001b[33m [INFO]', `\u001b[32mCarregando o comando \u001b[0m\u001b[31m${props.default.info.name}\u001b[0m`);
            if (props.default.init) props.default.init(client)
            client.commands.set(props.default.info.usage, props.default)
            if (props.default.info.aliases) {
                props.default.alias = true
                props.default.info.aliases.forEach(alias => client.commands.set(alias, props.default))
            }
        } catch (e) {
            console.log('\u001b[31m [ERRO]', `\u001b[32mImpossível carregar o comando \u001b[0m\u001b[31m${f}: ${e}\u001b[0m`)
        }
    })

    if (!fs.existsSync("temp")) {
        await fs.mkdirSync("temp");
    }

    client.onMessage(async (message) => {

        var msg;

        if (message.type == "chat" && message.body) {
            msg = message.body
            if (message.body.startsWith("https://www.tiktok.com") || message.body.startsWith("https://vm.tiktok.com")) {

                var videoUrl = message.body;

                if (message.body.startsWith("https://vm.tiktok.com")) {
                    videoUrl = await fetch(message.body, { method: 'POST', redirect: 'follow' }).then(r => { return r.url; }).catch(function (err) { console.info(err + " url: " + url); });
                }

                const videoMeta = await TikTokScraper.getVideoMeta(videoUrl, { noWaterMark: true });

                var video_file_name = `${Math.floor(Math.random() * 101)}_${videoMeta.collector[0].id}.mp4`;

                await fetch(videoMeta.collector[0].videoUrl).then(async (res) => {
                    await new Promise((resolve, reject) => {
                        var dest = fs.createWriteStream(join(__dirname, "temp", video_file_name))
                        dest.on('error', function (err) {
                            console.log(err);
                        });
                        res.body.pipe(dest);
                        res.body.on("error", (err) => {
                            console.log(err);
                            reject(err);
                        });
                        dest.on("finish", function () {
                            resolve();
                        });
                    });
                });

                if (!fs.existsSync(join(__dirname, "temp", video_file_name))) {
                    await client.reply(message.from, "Houve um erro ao baixar o vídeo, tente novamente.", message.id).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                    return;
                }

                var fileinfo = await new Promise((resolve) => {
                    fs.stat(join(__dirname, "temp", video_file_name), (err, stats) => {
                        if (!err)
                            resolve(stats)
                    });
                });

                if ((fileinfo.size / (1024 * 1024)) >= 16) {
                    await client.reply(message.from, "O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.", message.id).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                    return;
                }

                await client.sendFile(message.from, join(__dirname, "temp", video_file_name), 'video.mp4', '').catch((erro) => {
                    console.error('Error when sending: ', erro);
                });

                fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                    if (err) return console.log(err);
                });

            } else if (message.body.startsWith("https://www.youtube.com/watch") || message.body.startsWith("https://youtu.be/")) {

                var youtube_video = ytdl(message.body)

                var videoDetails = await new Promise((resolve) => {
                    youtube_video.on('info', (info) => {
                        resolve(info.videoDetails);
                    });
                });

                console.log(videoDetails);

                var videoId = videoDetails.videoId;
                var videoSeconds = videoDetails.lengthSeconds;

                if (videoSeconds >= (60 * 5)) {
                    await client.reply(message.from, "O vídeo ultrapassa o limite de 5 minutos.", message.id).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                    return;
                }

                var video_file_name = `${Math.floor(Math.random() * 101)}_${videoId}.mp4`;

                await new Promise((resolve) => {
                    var dest = fs.createWriteStream(join(__dirname, "temp", video_file_name));
                    youtube_video.pipe(dest);
                    dest.on("finish", function () {
                        resolve();
                    });
                });

                if (!fs.existsSync(join(__dirname, "temp", video_file_name))) {
                    await client.reply(message.from, "Houve um erro ao baixar o vídeo, tente novamente.", message.id).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                    return;
                }

                var fileinfo = await new Promise((resolve) => {
                    fs.stat(join(__dirname, "temp", video_file_name), (err, stats) => {
                        if (!err)
                            resolve(stats)
                    });
                });

                if ((fileinfo.size / (1024 * 1024)) >= 16) {
                    await client.reply(message.from, "O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.", message.id).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                } else {
                    await client.sendFile(message.from, join(__dirname, "temp", video_file_name), 'video.mp4', ''/*videoMeta.collector[0].text*/).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                }

                fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                    if (err) return console.log(err);
                });
            }
        } else if (message.text) {
            msg = message.text;
        }

        if (msg || String(msg).startsWith(config.prefix)) {
            const args = msg.slice(`${config.prefix}`.length).trim().split(/ +/g)
            const command = args.shift().toLowerCase();
            const cmd = client.commands.get(command);
            if (cmd) {
                cmd.run(client, message, args);
            }
        }

    });

    client.onAddedToGroup(async (chatEvent) => {
        await client.sendText(chatEvent.id, "Olá, obrigado por me adicionar ao grupo, para ver as funções disponíveis use o comando !help").catch((erro) => {
            console.error('Error when sending: ', erro);
        });
    });

}

export function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

export function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}