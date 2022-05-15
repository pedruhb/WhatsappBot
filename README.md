# Comandos
!dolar - Informa a cotação atual do dólar (utilizando a API https://economia.awesomeapi.com.br/json/last/USD-BRL)

!ship @user1 @user2* - Gera uma probabilidade e cria uma imagem utilizando canvas.

!rip @user* [ano] [ano] [nome] - Gera uma imagem de RIP utilizando canvas.

!music [url] - Faz o download de uma música através do link do YouTube, Spotify ou nome. Também baixa playlists inteiras do YouTube.

!ping - Comando de ping/pong.

!thumbnail [url] - Obtém a thumbnail de um vídeo do YouTube.

!say [texto]* - Envia um áudio lendo o texto informado, ou lendo o texto de uma mensagem mencionada.

!avatar @usuario* - Obtém a foto de perfil do usuário

!sticker - Cria uma figurinha de uma foto ou vídeo.



Obs: * = Opcional.

# Funções Passivas
O bot identifica automaticamente links do Youtube, Tiktok, Facebook e Instagram, realizando o download e envio do conteúdo (foto ou vídeo) no chat.

# Limitações
Os vídeos baixados acima de 16mb não podem ser enviados por limitações do WhatsApp.

# Criando comandos
Para fazer um comando, você deve criar um arquivo .mjs dentro da pasta commands.

Exemplo de comando:

``` 
export default {

    async init(client){ // Função que será executada na inicialização do bot.
    }
    
    async run(client, message, args) { // Função que será executada quando o comando for realizado.

        message.reply(`Pong 🏓`).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Ping', // Nome do comando
        description: 'Ping? Pong!', // Descrição do comando
        usage: 'ping', // O comando que será usado no chat.
        hide: true // Caso seja definido em true, ele não aparecerá no comando help.
    }

}
```
