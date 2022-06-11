import fetch from "node-fetch";

export default {

    async run(sock, msg, args) {

        var photoUrl;
        
        try {
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
                photoUrl = await sock.profilePictureUrl(msg.message.extendedTextMessage.contextInfo.mentionedJid[0], 'image')
            } else {
                photoUrl = await sock.profilePictureUrl(msg.key.participant ? msg.key.participant : msg.key.remoteJid, 'image');
            }
        } catch (err) {
            /// Foto privada
        }

        if (!photoUrl) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a foto de perfil, ela pode ser privada." }, { quoted: msg })
            return;
        }

        let fimg = await fetch(photoUrl).catch(async (err) => {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a foto de perfil, ela pode ser privada." }, { quoted: msg })
            return;
        });

        if (!fimg || !fimg.headers.get("content-type").startsWith("image")) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "👎", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: "Não foi possível obter a foto de perfil, ela pode ser privada." }, { quoted: msg })
            return;
        }

        const imgbuffer = await fimg.arrayBuffer();

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "👍", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { image: Buffer.from(imgbuffer) }, { quoted: msg });

    },

    info: {
        name: 'Obter o avatar do usuário',
        description: 'Obter o avatar do usuário.',
        usage: ['avatar', 'usuario']
    }

}