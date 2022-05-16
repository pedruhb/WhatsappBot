import whatsappApi from 'whatsapp-web.js';
const { MessageMedia } = whatsappApi;

export default {

    async run(client, message, args) {

        var photoUrl;

        const mentions = await message.getMentions();

        if (mentions.length == 0) {
            var profile = await message.getContact();
            photoUrl = await profile.getProfilePicUrl();
        } else {
            photoUrl = await mentions[0].getProfilePicUrl();
        }

        if (!photoUrl) {
            await message.reply("Não foi possível obter a foto de perfil, ela pode ser privada.").catch((erro) => {
                console.error('Error when sending: ', erro);
            });
            return;
        }

        const media = await MessageMedia.fromUrl(photoUrl, { unsafeMime: true })

        await message.reply(media).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Obter o avatar do usuário',
        description: 'Obter o avatar do usuário.',
        usage: 'avatar'
    }

}