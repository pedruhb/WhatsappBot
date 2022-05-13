export default {

    async run(client, message, args) {

        var msg = 'Olá, sou um robô em desenvolvimento e precisamos de dinheiro para manter o servidor...\n\n' +
            'Caso queira ajudar, você pode fazer uma doação de qualquer valor através do PIX.\n\n' +
            '31c30455-5e2a-4e48-9608-37f14fdd06e8';

        await message.reply(msg).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Donate',
        description: 'Apoie o desenvolvimento do BOT.',
        usage: 'donate'
    }

}