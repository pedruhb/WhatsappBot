
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import pkg from 'ytdl-core';
const { validateURL } = pkg;
import fs, { writeFile } from 'fs';
import { join } from 'path';
import { __dirname } from '../bot.js';
import ytsr from 'ytsr';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
ffmpeg.setFfmpegPath(join(__dirname, "src", "ffmpeg", "ffmpeg.exe"));
import pkg2 from 'spotify-url-info';
const { getDetails } = pkg2(fetch);

export default {

    async run(sock, msg, args) {

        var url = args.join(' ');
        var youtubeVideosUrl = [];
        var isPlaylist = false;
        const startDownloadTime = new Date().getTime();

        if (url.length == 0) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: `Você deve informar o nome da música ou link.` }, { quoted: msg });
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
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: `Houve um erro ao encontrar essa música, verifique se o nome ou link é válido.` }, { quoted: msg });
                return;
            }

        }

        else if (url.startsWith("https://youtube.com/playlist") || url.startsWith("https://www.youtube.com/playlist")) {

            const playlist = await ytpl(url);

            if (!playlist || !playlist.items || playlist.items.length < 1) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { text: `O link da playlist informado é inválido!` }, { quoted: msg });
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
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: `Link da playlist inválido.` }, { quoted: msg });
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
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: `Link da música/playlist ou nome inválido.` }, { quoted: msg });
            return;
        }

        if (isPlaylist) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Baixando um total de ${youtubeVideosUrl.length} músicas, isso pode demorar um pouco!` }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });

        for (var i = 0; i < youtubeVideosUrl.length; i++) {

            var youtube_video = await ytdl(youtubeVideosUrl[i], { quality: "highestaudio", filter: "audioonly" });

            var videoDetails = await new Promise((resolve) => {
                youtube_video.on('info', (info) => {
                    resolve(info.videoDetails);
                });
            });

            var videoId = videoDetails.videoId;
            var videoSeconds = videoDetails.lengthSeconds;

            if (videoSeconds >= (60 * 60)) {
                await sock.sendMessage(msg.key.remoteJid, { text: `O vídeo "${videoId}" ultrapassa o limite de 60 minutos.` }, { quoted: msg })
                return;
            }

            const temp_name = join(__dirname, "temp", `${videoId}.mp3`);
            const temp_name_c = join(__dirname, "temp", `c_${videoId}.mp3`);

            youtube_video.pipe(fs.createWriteStream(temp_name));

            await new Promise((resolve) => {
                ffmpeg(temp_name).toFormat('mp3').on('end', function () {
                    resolve();
                }).on('error', function (error) {
                    console.log("an error occured" + error.message);
                }).pipe(fs.createWriteStream(temp_name_c), { end: true })
            });

            await sock.sendMessage(msg.key.remoteJid, { audio: { url: temp_name_c }, mimetype: "audio/mpeg" }, { quoted: msg })

            fs.unlink(temp_name, function (err) {
                if (err) return console.log(err);
            });

            fs.unlink(temp_name_c, function (err) {
                if (err) return console.log(err);
            });

        }

        if (isPlaylist) {
            const finishDownloadTime = new Date((new Date().getTime() - startDownloadTime));
            await sock.sendMessage(msg.key.remoteJid, { text: `O download da playlist foi concluído em ${finishDownloadTime.getMinutes()} minutos e ${finishDownloadTime.getSeconds()} segundos.` }, { quoted: msg });
        }

    },

    info: {
        name: 'Baixar Música',
        description: 'Baixa uma música ou playlist através do link do Youtube, Spotify ou nome.',
        usage: ['music', 'musica', 'spotify']
    }

}