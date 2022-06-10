export default {

    async run(sock, msg, args) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❤️", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: 'Para saber mais sobre o projeto acesse https://github.com/pedruhb/WhatsappBot' }, { quoted: msg })
    },

    info: {
        name: 'Github',
        description: 'Saiba mais sobre o projeto.',
        usage: ['github', 'source']
    }

}