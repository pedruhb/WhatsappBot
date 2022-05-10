
import ytdl from 'ytdl-core';
import pkg from 'ytdl-core';
const { validateURL } = pkg;
import fs from 'fs';
import { join } from 'path';
import { __dirname } from '../bot.js';
import ytsr from 'ytsr';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
ffmpeg.setFfmpegPath(join(__dirname, "src", "ffmpeg", "ffmpeg.exe"));
import pkg2 from 'spotify-url-info';
const { getDetails } = pkg2(fetch);

export default {

    async run(client, message, args) {

        var url = args.join(' ');

        if (!validateURL(url)) {

            if (url.startsWith("https://open.spotify.com/track/")) {
                await getDetails(url).then((music_info) => {
                    url = `${music_info.preview.title} - ${music_info.preview.artist}`;
                })
            }

            const searchResults = await ytsr(url, { limit: 1 });
            if (searchResults && searchResults.items && searchResults.items.length > 0) {
                url = searchResults.items[0].url;
            } else {
                await client.reply(message.from, "Houve um erro ao encontrar essa música, verifique se o nome ou link é válido.", message.id).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }
        }

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

            await new Promise((resolve) => {
                var dest = fs.createWriteStream(join(__dirname, "temp", `converted_${video_file_name}`));
                ffmpeg(join(__dirname, "temp", video_file_name))
                    .toFormat('mp3')
                    .on('end', function () {
                        resolve();
                    })
                    .on('error', function (error) {
                        console.log("an error occured" + error.message);
                    })
                    .pipe(dest, { end: true })
            });

            const file_buffer = fs.readFileSync(join(__dirname, "temp", `converted_${video_file_name}`));
            const audiobase64 = file_buffer.toString('base64');

            await client.sendVoiceBase64(message.from, `data:audio/mpeg;base64,${audiobase64}`).catch((erro) => {
                console.error('Error when sending: ', erro);
            });

        }

        fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
            if (err) return console.log(err);
        });

        fs.unlink(join(__dirname, "temp", `converted_${video_file_name}`), function (err) {
            if (err) return console.log(err);
        });

    },

    info: {
        name: 'Baixar Música',
        description: 'Baixa uma música através do link do Youtube, Spotify ou nome.',
        usage: 'music'
    }

}