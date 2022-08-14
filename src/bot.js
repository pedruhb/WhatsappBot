import pkg_baileys from '@adiwajshing/baileys';
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, useMultiFileAuthState } = pkg_baileys;
import { logger } from './logger.js';
import { yo } from 'yoo-hoo';
import Enmap from 'enmap';
import PHBScraper from './PHBScraper.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs, { readdirSync } from 'fs';
import config from './config.js';
import ffmpeg from 'fluent-ffmpeg';
import TikTokScraper from 'tiktok-scraper';
import ytdl from 'ytdl-core';
import fetch from "node-fetch";
export const __dirname = join(dirname(fileURLToPath(import.meta.url)), "../");
const commands = new Enmap();
const command_list = new Enmap();

try {
    console.log('\n\n');
    yo("Robozin", { color: 'rainbow' });
    console.log('\n\n');
    logger.info(`Iniciando o Robozin v${process.env.npm_package_version}`);

    ffmpeg.setFfmpegPath(join(__dirname, "src", "ffmpeg", "ffmpeg.exe"))
    const msgRetryCounterMap = {}

    const store = makeInMemoryStore({ logger });

    store?.readFromFile('./baileys_store_multi.json')

    setInterval(() => {
        store?.writeToFile('./baileys_store_multi.json')
    }, 10_000)

    const phbscraper = new PHBScraper();

    readdirSync(join(__dirname, "src", "commands")).forEach(async (f) => {
        try {
            const props = await import(`./commands/${f}`).catch(err => { console.log(err); });
            if (f.split('.').slice(-1)[0] !== 'mjs') return;
            logger.info(`Carregando o comando \u001b[0m\u001b[31m${props.default.info.name}\u001b[0m`);
            if (props.default.init) props.default.init();
            command_list.set(props.default.info.name, props.default.info);
            props.default.info.usage.forEach(alias => commands.set(alias, props.default))
        } catch (e) {
            logger.info(`Impossível carregar o comando \u001b[0m\u001b[31m${f}: ${e}\u001b[0m`)
        }
    })

    const startSock = async () => {

        const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: state,
            msgRetryCounterMap,
            getMessage: async key => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
                    return msg?.message || undefined
                }
            },
        });


        store?.bind(sock.ev);

        sock.ev.on('messages.upsert', async m => {

            const msg = m.messages[0];

            if (msg.key.fromMe || !msg.message || !msg.message.conversation && !msg.message.extendedTextMessage && !msg.message.imageMessage && !msg.message.listResponseMessage) return;

            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.quotedMessage)
                msg.quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;

            var msgtext;
            if (msg.message.conversation) {
                msgtext = msg.message.conversation;
            } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) {
                msgtext = msg.message.extendedTextMessage.text;
            } else if (msg.message.imageMessage && msg.message.imageMessage.caption) {
                msgtext = msg.message.imageMessage.caption;
            } else if (msg.message.listResponseMessage) {
                msgtext = msg.message.listResponseMessage.title;
            } else {
                return;
            }

            //await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])

            if (msgtext && msgtext.startsWith(config.prefix)) {
                const args = msgtext.slice(`${config.prefix}`.length).trim().split(/ +/g)
                const command = args.shift().toLowerCase();
                const cmd = commands.get(command);
                if (cmd) {
                    cmd.run(sock, msg, args);
                }
            }

            /* Groups */
            /*else if (/https:\/\/chat.whatsapp\.com\/[\w.-]+/g.test(msgtext)) {
                try {
                    var regex = /https:\/\/chat.whatsapp\.com\/[\w.-]+/g.exec(msgtext);
                    for (var i = 0; i < regex.length; i++) {
                        await sock.groupAcceptInvite(regex[i].replace("https://chat.whatsapp.com/", "")).catch((err) => {
                        })
                    }
                } catch (err) {
                    console.log(err);
                }
            }*/


            /* Tiktok Downloader */
            else if (msgtext.startsWith("https://www.tiktok.com") || msgtext.startsWith("https://vm.tiktok.com")) {

                var videoUrl = msgtext;

                if (msgtext.startsWith("https://vm.tiktok.com")) {
                    videoUrl = await fetch(msgtext, { redirect: 'follow' }).then(r => { return r.url; }).catch(function (err) { console.info(err + " url: " + url); });
                }

                try {
                    var videoMeta = await TikTokScraper.getVideoMeta(videoUrl)
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { video: { url: videoMeta.collector[0].videoUrl } }, { quoted: msg })
                } catch (error) {
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "Houve um erro ao baixar o vídeo, tente novamente." }, { quoted: msg })
                    return;
                }

            }

            /* Youtube Downloader */
            else if (msgtext.startsWith("https://www.youtube.com/watch") || msgtext.startsWith("https://youtu.be/")) {

                var youtube_video = ytdl(msgtext);

                var videoDetails = await new Promise((resolve) => {
                    youtube_video.on('info', (info) => {
                        resolve(info.videoDetails);
                    });
                });

                var videoSeconds = videoDetails.lengthSeconds;

                if (videoSeconds >= (60 * 30)) {
                    await sock.sendMessage(msg.key.remoteJid, { text: "O vídeo ultrapassa o limite de 60 minutos." }, { quoted: msg })
                    return;
                }

                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });

                var buffer = await new Promise((resolve, reject) => {
                    const _buf = [];
                    youtube_video.on("data", (chunk) => _buf.push(chunk));
                    youtube_video.on("end", () => resolve(Buffer.concat(_buf)));
                    youtube_video.on("error", (err) => reject(err));
                });

                if (buffer) {
                    await sock.sendMessage(msg.key.remoteJid, { video: buffer }, { quoted: msg }).catch(err => {
                        console.log(err);
                    })
                }

            }

            /* Facebook Downloader */
            else if (msgtext.includes("facebook.com") || msgtext.includes("fb.com") || msgtext.includes("fb.watch")) {

                var facebook = await phbscraper.facebook(msgtext);
                if (!facebook.success) {
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "Houve um erro ao baixar o vídeo, tente novamente." }, { quoted: msg })
                    return;
                }

                var video_file_name = `${Math.floor(Math.random() * 101)}_${msg.key.remoteJid}.mp4`;

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
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "Houve um erro ao baixar o vídeo, tente novamente." }, { quoted: msg })
                    return;
                }

                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
                await sock.sendMessage(msg.key.remoteJid, { video: { url: join(__dirname, "temp", video_file_name) } }, { quoted: msg }).catch(err => {
                    console.log(err);
                })

                fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                    if (err) return console.log(err);
                });

            }

            /* Instagram Downloader */
            else if (msgtext.startsWith("https://www.instagram.com/")) {

                var instagram = await phbscraper.instagram(msgtext);

                if (!instagram || !instagram.url || !instagram.url[0]) {
                    await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
                    await sock.sendMessage(msg.key.remoteJid, { text: "Houve um erro ao baixar o vídeo, tente novamente." }, { quoted: msg })
                    return;
                }

                for (var i = 0; i < instagram.url.length; i++) {

                    var i_url = instagram.url[i];

                    await fetch(i_url).then(async (res) => {

                        if (res.headers.get("content-type").startsWith("image")) {
                            await sock.sendMessage(msg.key.remoteJid, { image: { url: i_url } }, { quoted: msg })
                        } else if (res.headers.get("content-type").startsWith("video")) {

                            var video_file_name = `instagram_${Math.floor(Math.random() * 999)}_${i}_${msg.key.remoteJid}.mp4`;

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
                                await sock.sendMessage(msg.key.remoteJid, { text: "Houve um erro ao baixar o vídeo, tente novamente." }, { quoted: msg })
                                return;
                            }

                            await sock.sendMessage(msg.key.remoteJid, { video: { url: join(__dirname, "temp", video_file_name) } }, { quoted: msg }).catch(err => {
                                console.log(err);
                            })

                            fs.unlink(join(__dirname, "temp", video_file_name), function (err) {
                                if (err) return console.log(err);
                            });

                        }

                    });
                }

                await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });

            }


        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    startSock()
                } else {
                    console.log('Connection closed. You are logged out.')
                }
            }
            console.log('connection update', update)
        })

        sock.ev.on('creds.update', async () => {
            await saveCreds()
        })

        return sock;
    }

    startSock();
} catch (err) {

}

export function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

export function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

export const getCommandList = () => {
    return command_list ?? null
}