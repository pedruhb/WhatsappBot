import fetch from "node-fetch";
import { isFloat, isInt } from "../bot.js";

export default {

    async run(client, message, args) {

        var amount = 1;

        if (args[0] && isInt(parseInt(args[0])) || args[0] && isFloat(parseFloat(args[0].replace(",", "."))))
            amount = args[0].replace(",", ".").replace(" ", "");

        var apiResponse = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL").then(r => { return r.json(); }).catch(function (err) { console.info(err + " url: " + url); });

        await message.reply(`$${amount} equivale à ${(apiResponse.USDBRL.bid * amount).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}.`).catch((erro) => {
            console.error('Error when sending: ', erro);
        });

    },

    info: {
        name: 'Dólar',
        description: 'Informa a cotação do dólar.',
        usage: 'dolar'
    }

}