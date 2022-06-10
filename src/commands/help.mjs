import { getCommandList } from "../bot.js";
import config from "../config.js";

export default {

    async run(sock, msg, args) {

        const sections = [
            {
                title: "Comandos",
                rows: [
                ]
            }
        ]

        getCommandList().forEach(command => {
            sections[0].rows.push({ title: `${config.prefix}${command.usage[0]}`, rowId: `${config.prefix}${command.usage[0]}`, description: `${command.description} - Aliases: ${command.usage.join(", ")}.` })
        })

        const listMessage = {
            text: "```Funções passivas:```\n\n*Baixar vídeo:* ```Envie o link de um vídeo do TikTok, Instagram, Facebook ou Youtube.```\n\n",
            footer: "https://github.com/pedruhb/WhatsappBot",
            title: "Olá, sou um robô em desenvolvimento",
            buttonText: "Comandos",
            sections
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🆘", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, listMessage, { quoted: msg })

    },

    info: {
        name: 'Ajuda',
        description: 'Mais informações.',
        usage: ['help', 'ajuda']
    }

}