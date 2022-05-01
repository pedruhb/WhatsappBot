import config from "../config.js";

export default {

    async run(client, message, args) {

        var helpMessage = 'Olá, sou um robô em desenvolvimento.\n\n' +
            '```Veja a minha lista de funções:``` \n\n' +
            '*Baixar vídeo:* ```Envie o link de um vídeo do TikTok ou Youtube.```\n\n';

        let commands = client.commands
        commands.forEach(command => {
            helpMessage += '*' + command.info.name + ':* ```' + config.prefix + '' + command.info.usage + ' -  ' + command.info.description + '```\n\n'
        })

        helpMessage += '*_Tem um feedback? entre em contato com o desenvolvedor: https://wa.me/5521998149241_*';

        await client.reply(message.from, helpMessage, message.id).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Ajuda',
        description: 'Mais informações.',
        usage: 'help'
    }

}