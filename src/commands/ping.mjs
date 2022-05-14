export default {

    async run(client, message, args) {

        message.reply(`Pong 🏓`).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Ping',
        description: 'Ping? Pong!',
        usage: 'ping',
        hide: true
    }

}