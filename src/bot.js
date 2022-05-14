import whatsappApi from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = whatsappApi;
import TikTokScraper from 'tiktok-scraper';
import fetch from 'node-fetch';
import fs, { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ytdl from 'ytdl-core';
import Enmap from 'enmap';
import config from './config.js';
import qrcode from 'qrcode-terminal';
import { yo } from 'yoo-hoo';
import { logger } from './logger.js';
import PHBScraper from './PHBScraper.js';

export const __dirname = join(dirname(fileURLToPath(import.meta.url)), "../");
const cmdFiles = readdirSync(join(__dirname, "src", "commands"));

console.log('\n\n');
yo("Robozin", { color: 'rainbow' });
console.log('\n\n');
logger.info('Iniciando...');

const phbscraper = new PHBScraper();

const client = new Client({
    puppeteer: config.puppeteer,
    authStrategy: new LocalAuth({ clientId: "client1" })
});

client.commands = new Enmap();

cmdFiles.forEach(async (f) => {
    try {
        const props = await import(`./commands/${f}`).catch(err => { console.log(err); });
        if (f.split('.').slice(-1)[0] !== 'mjs') return;
        logger.info(`Carregando o comando \u001b[0m\u001b[31m${props.default.info.name}\u001b[0m`);
        if (props.default.init) props.default.init(client)
        client.commands.set(props.default.info.usage, props.default)
        if (props.default.info.aliases) {
            props.default.alias = true
            props.default.info.aliases.forEach(alias => client.commands.set(alias, props.default))
        }
    } catch (e) {
        logger.info(`Impossível carregar o comando \u001b[0m\u001b[31m${f}: ${e}\u001b[0m`)
    }
})

if (!fs.existsSync("temp")) {
    await fs.mkdirSync("temp");
}

client.on('qr', (qr) => {
    logger.info("QR Code Recebido");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    logger.info('Cliente conectada!');
});

client.on('group_join', (notification) => {
    notification.reply('Olá, obrigado por me adicionar ao grupo, para ver as funções disponíveis use o comando !help');
});

client.on('change_state', state => {
    logger.info('CHANGE STATE', state);
});

client.on('disconnected', (reason) => {
    logger.error('Cliente desconectada.', reason);
});

client.on('auth_failure', (reason) => {
    logger.error('Erro ao estabelecer conexão.', reason);
});

client.on('authenticated', () => {
    logger.info('A conexão foi estabelecida!');
});

client.on('message', async (message) => {

    if (message.type == "chat" && message.body) {

        if (message.body.startsWith("https://www.tiktok.com") || message.body.startsWith("https://vm.tiktok.com")) {

            var videoUrl = message.body;

            if (message.body.startsWith("https://vm.tiktok.com")) {
                videoUrl = await fetch(message.body, { redirect: 'follow' }).then(r => { return r.url; }).catch(function (err) { console.info(err + " url: " + url); });
            }

            var videoMeta;

            try {
                videoMeta = await TikTokScraper.getVideoMeta(videoUrl)
            } catch (error) {
                await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

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
            }).catch(async (error) => {
                console.log(error);
                console.log(videoMeta);
                await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            })

            if (!fs.existsSync(join(__dirname, "temp", video_file_name))) {
                await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
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
                await message.reply("O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            const media = MessageMedia.fromFilePath(join(__dirname, "temp", video_file_name))
            await message.reply(media).catch((erro) => {
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

            var videoId = videoDetails.videoId;
            var videoSeconds = videoDetails.lengthSeconds;

            if (videoSeconds >= (60 * 5)) {
                await message.reply("O vídeo ultrapassa o limite de 5 minutos.").catch((erro) => {
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
                await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
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
                await message.reply("O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            } else {
                const media = MessageMedia.fromFilePath(join(__dirname, "temp", video_file_name))
                await message.reply(media).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            }

            fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                if (err) return console.log(err);
            });

        } else if (message.body.includes("facebook.com") || message.body.includes("fb.com") || message.body.includes("fb.watch")) {

            var facebook = await phbscraper.facebook(message.body);
            if (!facebook.success) {
                await message.reply("Erro ao obter vídeo.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            var video_file_name = `${Math.floor(Math.random() * 101)}_${message.from}.mp4`;

            await fetch(facebook.url).then(async (res) => {
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
                await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
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
                await message.reply("O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            } else {
                const media = MessageMedia.fromFilePath(join(__dirname, "temp", video_file_name))
                await message.reply(media).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            }

            fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                if (err) return console.log(err);
            });

        } else if (message.body.startsWith("https://www.instagram.com/")) {

            var instagram = await phbscraper.instagram(message.body);

            if (!instagram || !instagram.url || !instagram.url[0]) {
                await message.reply("Erro ao obter vídeo.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            for (var i = 0; i < instagram.url.length; i++) {

                var i_url = instagram.url[i];

                await fetch(i_url).then(async (res) => {

                    if (res.headers.get("content-type").startsWith("image")) {

                        const media = await MessageMedia.fromUrl(i_url, { unsafeMime: true })

                        await message.reply(media).catch((erro) => {
                            console.error('Error when sending: ', erro);
                        });

                    } else if (res.headers.get("content-type").startsWith("video")) {

                        var video_file_name = `instagram_${Math.floor(Math.random() * 999)}_${i}_${message.from}.mp4`;

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

                        if (!fs.existsSync(join(__dirname, "temp", video_file_name))) {
                            await message.reply("Houve um erro ao baixar o vídeo, tente novamente.").catch((erro) => {
                                console.error('Error when sending: ', erro);
                            });
                        }

                        var fileinfo = await new Promise((resolve) => {
                            fs.stat(join(__dirname, "temp", video_file_name), (err, stats) => {
                                if (!err)
                                    resolve(stats)
                            });
                        });

                        if ((fileinfo.size / (1024 * 1024)) >= 16) {

                            await message.reply("O vídeo ultrapassa o limite de 16MB estabelecido pelo WhatsApp.").catch((erro) => {
                                console.error('Error when sending: ', erro);
                            });

                        } else {

                            const media = MessageMedia.fromFilePath(join(__dirname, "temp", video_file_name))
                            await message.reply(media).catch((erro) => {
                                console.error('Error when sending: ', erro);
                            });

                        }

                        fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                            if (err) return console.log(err);
                        });

                    }

                });

            }

        }

    }

    if (message.body && String(message.body).startsWith(config.prefix)) {
        const args = String(message.body).slice(`${config.prefix}`.length).trim().split(/ +/g)
        const command = args.shift().toLowerCase();
        const cmd = client.commands.get(command);
        if (cmd) {
            cmd.run(client, message, args);
        }
    }

});

client.initialize();

export function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

export function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

process.on("SIGINT", async () => {
    await client.destroy();
    await phbscraper.destroy();
    process.exit(0);
});