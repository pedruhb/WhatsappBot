export default {

    async run(sock, msg, args) {

        var msgDonate = 'Olá, sou um robô em desenvolvimento e precisamos de dinheiro para manter o servidor.\n\n' +
            'Caso queira ajudar, você pode fazer uma doação de qualquer valor através do PIX.\n\n' +
            '31c30455-5e2a-4e48-9608-37f14fdd06e8';

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "💰", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: msgDonate }, { quoted: msg })

    },

    info: {
        name: 'Donate',
        description: 'Apoie o desenvolvimento do BOT.',
        usage: ['donate', 'doar', 'doacao', 'doação']
    }

}