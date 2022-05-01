
import ytdl from 'ytdl-core';
import pkg from 'ytdl-core';
const { validateURL } = pkg;
import fs from 'fs';
import { join } from 'path';
import { __dirname } from '../bot.js';

export default {

    async run(client, message, args) {

        var url = args.join(' ');

        if (validateURL(url)) {

            var youtube_video = ytdl(url, { quality: "highestaudio", filter: "audioonly" });

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

            var video_file_name = `${Math.floor(Math.random() * 101)}_${videoId}.mp3`;

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
                await client.sendVoice(message.from, join(__dirname, "temp", video_file_name)).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            }

            fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                if (err) return console.log(err);
            });

        } else {

            await client.reply(message.from, "O link não é do Youtube.", message.id).catch((erro) => {
                console.error('Error when sending: ', erro);
            });

        }

    },

    info: {
        name: 'Baixar Música',
        description: 'Baixa uma música através do link do Youtube.',
        usage: 'music'
    }

}