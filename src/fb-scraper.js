import { URL } from 'url';
import puppeteer from "puppeteer";
const iPhone = puppeteer.devices['iPhone 6'];
const browser = await puppeteer.launch();

export default class Scraper {

    async facebook(url) {

        const link = new URL(url);

        if (!["www.facebook.com", "facebook.com", "www.fb.com", "fb.com", "m.facebook.com", "fb.watch"].includes(link.host)) {
            return {
                "success": false,
                "message": "URL inválido! verifique se o link é do facebook."
            }
        }

        if (url.includes("watch")) {
            return FacebookWatch(link);
        } else {
            return Facebook(link);
        }

    }

}

async function Facebook(url) {

    const page = await browser.newPage();
  //  await page.emulate(iPhone);
    await page.goto("http://m.facebook.com" + url.href.substring(url.origin.length, url.href.length));

    const exists = await page.$eval('#m_story_permalink_view > div > div > div > div > section > div > div > i', () => true).catch(() => false)
    if (!exists) {
        //await page.close();
        return {
            "success": false,
            "message": "Erro ao selecionar vídeo, a estrutura pode ter sido alterada!"
        }
    }

    await page.click('#m_story_permalink_view > div > div > div > div > section > div > div > i')
        .catch((error) => {
            console.log(error);
            return {
                "success": false,
                "message": "Erro ao selecionar vídeo, a estrutura pode ter sido alterada!"
            }
        });

    await page.waitForSelector('#m_story_permalink_view > div > div > div > div > section > div > div > video', { visible: true })

    const videoUrl = await page.evaluate(() => {
        try {
            return document.querySelector("#m_story_permalink_view > div > div > div > div > section > div > div > video").src;
        } catch (err) {
            console.log('Erro ao selecionar vídeo, a estrutura pode ter sido alterada!')
            return false
        }
    })

    if (!videoUrl) {
       // await page.close();
        return {
            "success": false,
            "message": "Erro ao selecionar vídeo, a estrutura pode ter sido alterada!"
        }
    }

    //await page.close();
    return {
        "success": true,
        "url": videoUrl
    }

}

async function FacebookWatch(url) {

    const page = await browser.newPage();
    await page.emulate(iPhone);
    await page.goto(url);

    const checkSelector = await page.evaluate(() => {
        try {
            return document.querySelector(".widePic > div > i");
        } catch (err) {
            console.log(err);
            return false
        }
    })

    if (!checkSelector) {
        await page.close();
        return {
            "success": false,
            "message": "Erro ao selecionar vídeo, a estrutura pode ter sido alterada!"
        }
    }

    await page.click('.widePic > div > i')
        .catch((error) => {
            console.log(error);
        });

    await page.waitForSelector('.widePic > div> video', { visible: true })

    const videoUrl = await page.evaluate(() => {
        try {
            return document.querySelector(".widePic > div > video").src;
        } catch (err) {
            console.log('Erro ao selecionar vídeo, a estrutura pode ter sido alterada!')
            return false
        }
    })

    if (!videoUrl) {
        await page.close();
        return {
            "success": false,
            "message": "Erro ao selecionar vídeo, a estrutura pode ter sido alterada!"
        }
    }

    await page.close();

    return {
        "success": true,
        "url": videoUrl
    }

}