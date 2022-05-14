import puppeteer from "puppeteer";
import { logger } from './logger.js';

const iPhone = puppeteer.devices['iPhone 6'];
const browser = await puppeteer.launch({ headless: false, userDataDir: './temp/phb-scraper/' });

export default class PHBScraper {

    constructor() {
        this.start();
    }

    async start() {
        logger.info("[PHB Scraper] Iniciando...");
        const page = await browser.newPage();
        const pages = await browser.pages();
        if (pages.length > 1) await pages[0].close();
        await page.goto('https://www.instagram.com/accounts/login/');
    }

    async instagram(url) {

        const page = await browser.newPage();
        const uri = url.replace(/\?.*$/g, "") + "?__a=1";
        const response = await page.goto(uri);

        var data;
        try {
            data = await response.json();
        } catch (err) {
            console.log(err)
        }

        page.close();

        if (data.hasOwnProperty("graphql")) {

            const type = data.graphql.shortcode_media.__typename;

            const metadata = {
                "success": true,
                type,
                url: [],
            };

            if (type === "GraphImage") {
                metadata.url.push(data.graphql.shortcode_media.display_url);
            } else if (type === "GraphVideo") {
                metadata.url.push(data.graphql.shortcode_media.video_url);
            } else if (type === "GraphSidecar") {
                data.graphql.shortcode_media.edge_sidecar_to_children.edges.map((r) => {
                    if (r.node.__typename === "GraphImage") metadata.url.push(r.node.display_url);
                    if (r.node.__typename === "GraphVideo") metadata.url.push(r.node.video_url);
                });
            }

            return metadata;

        } else if (data.hasOwnProperty("items")) {

            const metadata = { "success": true, url: [] };
            const mediaTypeMap = {
                1: "image",
                2: "video",
                8: "carousel",
            }[data.items[0].media_type];

            if (mediaTypeMap === "image") {
                const dl_link = data.items[0].image_versions2?.candidates?.[0]?.url;
                metadata["url"].push(dl_link);
            } else if (mediaTypeMap === "video") {
                const dl_link = data.items[0].video_versions?.[0]?.url;
                metadata["url"].push(dl_link);
            } else if (mediaTypeMap === "carousel") {
                const dl_link = data.items[0].carousel_media.map((fd) => {
                    const data_1 = {
                        1: fd.image_versions2?.candidates?.[0]?.url,
                        2: fd.video_versions?.[0]?.url,
                    }[fd.media_type];
                    return data_1;
                });
                metadata["url"] = dl_link;
            }

            return metadata;

        } else {
            return {
                "success": false
            }
        }

    }

    async facebook(url) {

        console.log(url);

        var link;

        try {
            link = new URL(url);
        } catch (err) {
            return false;
        }

        if (!["www.facebook.com", "facebook.com", "www.fb.com", "fb.com", "m.facebook.com", "fb.watch"].includes(link.host)) {
            return {
                "success": false,
                "message": "URL inválido! verifique se o link é do facebook."
            }
        }

        if (url.includes("watch")) {
            return facebook_watch(link);
        } else {
            return facebook_watch(link);
        }

    }

    async destroy() {
        browser.close();
    }

}

async function facebook_watch(url) {

    const page = await browser.newPage();
    await page.emulate(iPhone);
    await page.goto(url);

    const videoUrl = await page.evaluate(() => {
        try {
            document.querySelector("i[data-sigil='playInlineVideo']").click()
            linkvideo = document.querySelector("video").src;
            return linkvideo;
        } catch (err) {
            console.log(err);
            return false
        }
    });

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


/* DEMO 
const scraper = new PHBScraper();

const insta = await scraper.instagram("https://www.instagram.com/reel/CdhGjZtFqdA/?igshid=ZTE2MDY0MWU=");
console.log("Instagram\n", insta.url[0], "\n\n");

const face_watch = await scraper.facebook("https://www.facebook.com/watch?v=1182741245814140");
console.log("Facebook Watch\n", face_watch.url, "\n\n");

const face = await scraper.facebook("https://www.facebook.com/groups/310854623775061/permalink/688287929365060/");
console.log(`Facebook\n`, face.url, "\n\n");

scraper.destroy();
*/
