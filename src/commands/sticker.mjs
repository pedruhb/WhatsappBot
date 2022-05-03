import config from "../config.js";

export default {

    async run(client, message, args) {

        if (message.type == "image") {
            const buffer = await client.decryptFile(message);
            if (message.mimetype.startsWith("image")) {

                await client.sendImageAsSticker(config.temp_group_id, `data:image/png;base64,${buffer.toString('base64')}`).catch((erro) => {
                    console.error('Error when sending: ', erro);
                }).then(async (result) => {

                    console.log('Result 1: ', result);

                    var forward_msgs = [];
                    //forward_msgs[0] = result.to._serialized;
                    forward_msgs[0] = `false_${result.to.remote.user}@${result.to.remote.server}_${result.to.id}`

                    console.log(forward_msgs);
                    
                    await client.forwardMessages(message.from, forward_msgs, true).then((result2) => {
                        console.log('Result 2: ', result2);
                    }).catch((erro2) => {
                        console.error('Error when sending: ', erro2);
                    });

                }).catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            } else {
                await client.sendText(message.from, "Você deve enviar uma imagem.").catch((erro) => {
                    console.error('Error when sending: ', erro);
                });
            }
        } else if (message.type == "video") {
            await client.reply(message.from, "Comando disponível apenas em imagem.", message.id).catch((erro) => {
                console.error('Error when sending: ', erro);
            });
        }
    },

    info: {
        name: 'Sticker',
        description: 'Transforma uma foto enviada com essa descrição em sticker.',
        usage: 'sticker'
    }

}