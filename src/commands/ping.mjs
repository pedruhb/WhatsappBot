export default {

    async run(sock, msg, args) {
        console.log(3);
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🏓", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: `Pong 🏓 (${Math.floor(Date.now() / 1000) - msg.messageTimestamp}s)` }, { quoted: msg })
    },

    info: {
        name: 'Ping',
        description: 'Ping? Pong!',
        usage: ['ping'],
        hide: true
    }

}