
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
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
import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;

export default {

    async run(client, message, args) {

        var url = args.join(' ');
        var youtubeVideosUrl = [];
        var isPlaylist = false;
        const startDownloadTime = new Date().getTime();

        if (url.length == 0) {
            await message.reply(`Você deve informar o nome da música ou link.`).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        if (!validateURL(url) && !url.includes("/playlist")) {

            var searchText = url;

            if (url.startsWith("https://open.spotify.com/track/")) {
                await getDetails(url).then(async (music_info) => {
                    searchText = `${music_info.preview.title} - ${music_info.preview.artist}`;
                })
            }

            const searchResults = await ytsr(searchText, { limit: 1 });
            if (searchResults && searchResults.items && searchResults.items.length > 0) {
                youtubeVideosUrl[0] = searchResults.items[0].url;
            } else {
                await message.reply("Houve um erro ao encontrar essa música, verifique se o nome ou link é válido.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

        }

        else if (url.startsWith("https://youtube.com/playlist") || url.startsWith("https://www.youtube.com/playlist")) {

            const playlist = await ytpl(url);

            if (!playlist || !playlist.items || playlist.items.length < 1) {
                await message.reply(`O link da playlist informado é inválido!`).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
                return;
            }

            for (var i = 0; i < playlist.items.length; i++) {
                youtubeVideosUrl[i] = playlist.items[i].shortUrl;
            }

            isPlaylist = true;

        }

        else if (url.startsWith("https://open.spotify.com/playlist/")) {

            await getDetails(url).then(async (music_info) => {

                if (!music_info || !music_info.tracks) {
                    await message.reply("Link da playlist inválido.").catch((erro) => {
                        console.error('Error when sending: ', erro);
                    });
                    return;
                }

                isPlaylist = true;

                for (var i = 0; i < music_info.tracks.length; i++) {

                    var artists = "";
                    for (var e = 0; e < music_info.tracks[i].artists.length; e++) {
                        artists += `${music_info.tracks[i].artists[e].name} `
                    }

                    const searchResults = await ytsr(`${music_info.tracks[i].name} - ${artists}`, { limit: 1 });
                    if (searchResults && searchResults.items && searchResults.items.length > 0) {
                        youtubeVideosUrl[i] = searchResults.items[0].url;
                    }
                }

            })
        }

        else if (validateURL(url)) {
            youtubeVideosUrl[0] = url;
        }

        else {

            await message.reply("Link da música/playlist ou nome inválido.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;

        }

        if (isPlaylist) {
            await message.reply(`Baixando um total de ${youtubeVideosUrl.length} músicas, isso pode demorar um pouco!`).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
        }

        for (var i = 0; i < youtubeVideosUrl.length; i++) {

            var youtube_video = ytdl(youtubeVideosUrl[i], { quality: "highestaudio", filter: "audioonly" });

            var videoDetails = await new Promise((resolve) => {
                youtube_video.on('info', (info) => {
                    resolve(info.videoDetails);
                });
            });

            var videoId = videoDetails.videoId;
            var videoSeconds = videoDetails.lengthSeconds;

            if (videoSeconds >= (60 * 10)) {
                await message.reply("O vídeo ultrapassa o limite de 10 minutos.").catch((erro) => {
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
                const media = new MessageMedia('audio/mpeg', audiobase64);

                await message.reply(media).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });

            }

            fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                if (err) return console.log(err);
            });

            fs.unlink(join(__dirname, "temp", `converted_${video_file_name}`), function (err) {
                if (err) return console.log(err);
            });
        }

        if (isPlaylist) {
            const finishDownloadTime = new Date((new Date().getTime() - startDownloadTime));
            await message.reply(`O download da playlist foi concluído em ${finishDownloadTime.getMinutes()} minutos e ${finishDownloadTime.getSeconds()} segundos.`).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
        }

    },

    info: {
        name: 'Baixar Música',
        description: 'Baixa uma música ou playlist através do link do Youtube, Spotify ou nome.',
        usage: 'music'
    }

}