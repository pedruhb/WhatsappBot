import venom from 'venom-bot';
import TikTokScraper from 'tiktok-scraper';
import fetch from 'node-fetch';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ytdl from 'ytdl-core';
import * as googleTTS from 'google-tts-api';

const __dirname = dirname(fileURLToPath(import.meta.url));
venom.create({ session: 'session' }).then((client) => start(client)).catch((erro) => {
    console.log(erro);
});

const helpMessage = 'Olá, sou um robô em desenvolvimento.\n\n' +
    '```Veja a minha lista de funções:``` \n\n' +
    '*Baixar vídeo:* ```Mande o link de um vídeo do TikTok ou Youtube.```\n\n' +
    '*Criar sticker:* ```mande uma foto com a descrição "!sticker".```\n\n' +
    '*Mandar áudio:* ```Use o comando "!say teste".```\n\n' +
    '*Ajuda:* ```Use o comando !help para mais informações.```\n\n' +
    '_Em breve vou receber mais funções._\n\n' +
    '*_Tem um feedback? entre em contato com o desenvolvedor: https://wa.me/5521998149241_*';

async function start(client) {

    if (!fs.existsSync("temp")) {
        await fs.mkdirSync("temp");
    }

    client.onMessage(async (message) => {
        try {

            if (message.type == "chat" && message.body) {

                /// tiktok
                if (message.body.startsWith("https://www.tiktok.com") || message.body.startsWith("https://vm.tiktok.com")) {

                    var videoUrl = message.body;

                    if (message.body.startsWith("https://vm.tiktok.com")) {
                        videoUrl = await fetch(message.body, { method: 'POST', redirect: 'follow' }).then(r => { return r.url; }).catch(function (err) { console.info(err + " url: " + url); });
                    }

                    const videoMeta = await TikTokScraper.getVideoMeta(videoUrl, { noWaterMark: true });

                    var video_file_name = `${videoMeta.collector[0].id}.mp4`;

                    await fetch(videoMeta.collector[0].videoUrl).then(async (res) => {
                        await new Promise((resolve, reject) => {
                            var dest = fs.createWriteStream(join(__dirname, "temp", video_file_name));
                            res.body.pipe(dest);
                            res.body.on("error", (err) => {
                                reject(err);
                            });
                            dest.on("finish", function () {
                                resolve();
                            });
                        });
                    });

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

                }

                /// youtube
                else if (message.body.startsWith("https://www.youtube.com/watch") || message.body.startsWith("https://youtu.be/")) {

                    var youtube_video = ytdl(message.body)

                    var videoDetails = await new Promise((resolve) => {
                        youtube_video.on('info', (info) => {
                            resolve(info.videoDetails);
                        });
                    });

                    var videoId = videoDetails.videoId;
                    var videoSeconds = videoDetails.lengthSeconds;

                    if (videoSeconds >= (60 * 5)) {
                        await client.reply(message.from, "O vídeo ultrapassa o limite de 5 minutos.", message.id).catch((erro) => {
                            console.error('Error when sending: ', erro);
                        });
                        return;
                    }

                    var video_file_name = `${videoId}.mp4`;

                    await new Promise((resolve) => {
                        var dest = fs.createWriteStream(join(__dirname, "temp", video_file_name));
                        youtube_video.pipe(dest);
                        dest.on("finish", function () {
                            resolve();
                        });
                    });

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

                /// tts command
                else if (message.body.startsWith("!say") || message.body.startsWith("!tts")) {

                    var mensagem = message.body.replace("!say", "").replace("!tts", "");

                    if (mensagem.length == 0) {
                        await client.reply(message.from, "Digite uma mensagem...", message.id).catch((erro) => {
                            console.error('Error when sending: ', erro);
                        });
                        return;
                    }

                    if (mensagem.length > 200) {
                        await client.reply(message.from, "A mensagem deve ter no máximo 200 caracteres.", message.id).catch((erro) => {
                            console.error('Error when sending: ', erro);
                        });
                        return;
                    }

                    var audiobase64 = await googleTTS.getAudioBase64(mensagem, {
                        lang: 'pt',
                        slow: false,
                        host: 'https://translate.google.com',
                        timeout: 10000,
                    }).then((result) => { return result }).catch(console.error);

                    await client.sendVoiceBase64(message.from, `data:audio/mpeg;base64,${audiobase64}`).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });

                }

                /// help command
                else if (message.body.startsWith("!help") || message.body.startsWith("!ajuda")) {
                    await client.sendText(message.from, helpMessage).catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                }

            } else if (message.type == "image") {

                /// image to sticker
                if (message.isMedia === true || message.isMMS === true) {
                    if (message.text && message.text.startsWith("!sticker")) {
                        const buffer = await client.decryptFile(message);
                        if (message.mimetype.startsWith("image")) {
                            await client.sendImageAsSticker(message.from, `data:image/png;base64,${buffer.toString('base64')}`).catch((erro) => {
                                console.error('Error when sending: ', erro);
                            });
                        } else {
                            await client.sendText(message.from, "Você deve enviar uma imagem.").catch((erro) => {
                                console.error('Error when sending: ', erro);
                            });
                        }
                    }
                }

            }

        } catch (error) {
            console.log(error);
        }

    });

    client.onAddedToGroup(async (chatEvent) => {
        await client.sendText(chatEvent.id, helpMessage).catch((erro) => {
            console.error('Error when sending: ', erro);
        });
    });

}
