export default {

    async run(client, message, args) {

        message.reply(`Pong`).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Obter informações do bot',
        description: 'Exibe informações do bot.',
        usage: 'ping',
        hide: true
    }

}