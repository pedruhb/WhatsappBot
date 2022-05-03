export default {

    async run(client, message, args) {

        if (message.isGroupMsg) {

            var msg = `ID: ${message.chat.groupMetadata.id}\n` +
                `Dono: ${message.chat.groupMetadata.owner}\n` +
                `Data: ${new Date(message.chat.groupMetadata.creation * 1e3).toLocaleString()}\n` +
                `Usuários: ${message.chat.groupMetadata.size}`

            client.reply(message.from, msg, message.id).catch((erro) => {
                console.error('Error when sending: ', erro);
            });

        }

    },

    info: {
        name: 'Obter informações do grupo',
        description: 'Exibe informações do grupo.',
        usage: 'groupinfo',
        hide: true
    }

}