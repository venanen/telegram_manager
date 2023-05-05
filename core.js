import Vk from "./vk.js";
import fs from "fs";
import Telegram from "./telegram.js";
import SMM from "./SMM.js";
import https from "https";
import {generatePostForFact} from "./helper.js";
import { parse } from 'node-html-parser';
import axios from "axios";
class Core{
    vkToken
    tgToken
    channelsConfig
    smmToken

    /**
     *
     * @param vkToken
     * @param tgToken
     * @param smmToken
     * @param channelsConfig
     */
    constructor(vkToken = '', tgToken = '', smmToken='', channelsConfig = {}) {
        this.vkToken = vkToken
        this.tgToken = tgToken
        this.smmToken = smmToken
        this.channelsConfig = channelsConfig
    }

    async getAndSaveVkPostsByIndex(channelIndex){

        const channelConfig = this.channelsConfig[channelIndex]
        const vk  = new Vk(this.vkToken, channelConfig.memesGroups)
        const vkPosts = await vk.processAll()
        vk.storePosts(vkPosts, channelIndex)
        console.log('From vk posts store, length:', vkPosts.length, ' channelIndex: ', channelIndex)
    }

    async postToTelegramByIndex(channelIndex){
        const channelConfig = this.channelsConfig[channelIndex]
        const tg = new Telegram(this.tgToken, channelConfig.channelId)
        const smm = new SMM(this.smmToken)
        await tg.postPartGroup(channelIndex, channelConfig.limit)
        if(!channelConfig.excludeFromViews)
            await smm.processPostLinksJSON('./posts_links.json', true)

    }

    async sendAdsPost(){
        //const channelsIds =  this.channelsConfig.map(val => val.channelId)
        const [senderAd, receiverAd] = this.getMultipleRandom(this.channelsConfig, 2)
        const adText = senderAd.adsPost,
            adPhoto = senderAd.adsPhoto,
            receiverId = receiverAd.channelId
        const tg = new Telegram(this.tgToken, receiverId)
        const res = await tg.sendPhoto(adText, adPhoto)
        const postId = res.data?.result?.message_id
        const link = `https://t.me/${receiverId.replace('@', '')}/${postId}`
        const memberCount = await tg.getMemberCount()
        const tempResult = [{count: 0, postId, link, memberCount}]
        tg.addPostLinksToJSON(tempResult)
        return {senderAd, receiverAd}
    }
    getMultipleRandom(arr, num) {

        const shuffled = [...arr].sort(() => 0.5 - Math.random());

        return shuffled.slice(0, num);
    }



    async processSelfAd(){
        const {senderAd}  = await this.sendAdsPost()
        const smm = new SMM(this.smmToken)
        await smm.processPostLinksJSON('./posts_links.json', true)
        await smm.upSubsAfterSelfAds(senderAd.channelId)
    }

    async processUpViews(){
        const smm = new SMM(this.smmToken)
        await smm.processPostLinksJSON('./posts_links.json')
    }
    async processGetPosts(channelIndex){
        await this.getAndSaveVkPostsByIndex(channelIndex)

    }

    async processSendPosts(channelIndex){
        await this.postToTelegramByIndex(channelIndex)
    }

    async mainScheduler(){
        const testDate = 'December 25, 2023 09:00:30'
        const currentMinute = (new Date(/*testDate*/)).getMinutes()
        const currentHour = (new Date(/*testDate*/)).getHours()
        const getPosts_hour = 4
        //12 - реклама, 16 - реклама, 21 - реклама
        const sendPosts_hours = [11, 13, 17]
        const sendFactPosts_hours = [9, 19]
        const channelIndex = currentMinute / 5
        const isNowTime2Run = currentMinute % 5 === 0
        console.log('Get hours', currentHour, currentMinute, channelIndex, isNowTime2Run, this.channelsConfig[channelIndex] !== undefined, (currentHour in sendPosts_hours), sendPosts_hours)
        if((currentHour === getPosts_hour) && isNowTime2Run && (this.channelsConfig[channelIndex] !== undefined)){
            console.log('Run get posts for index', channelIndex)
            await this.processGetPosts(channelIndex)
        }
        if(isNowTime2Run && (this.channelsConfig[channelIndex] !== undefined) && sendPosts_hours.includes(currentHour) ){
            console.log('Run send posts for index', channelIndex)
            await this.processSendPosts(channelIndex)
        }

        if(currentMinute === 55){
            console.log('Run up views')
            await this.processUpViews()
        }
        if(currentHour === 16 && currentMinute===0){
            console.log('Run self add views')
            await this.processSelfAd()
        }

        if(sendFactPosts_hours.includes(currentHour) && currentMinute === 0){
            console.log('Send fact')
            await this.getFactAndSendPost()
        }
    }
    /*
    БОЛЬШОЙ КОСТЫЛЬ, Т.К. ЕЩЕ ОТДЕЛЬНЫЙ КАНАЛ, РАБОТАЮЩИЙ ПО ДРУГОЙ ЛОГИКЕ
    АККУРАТНО ЛЕГАСИ, НЕ ЗАБУДЬТЕ ПОМЫТЬ РУКИ
     */
    async getFactAndSendPost() {
        const factIdChannel = '@Rekord_and_facts'
        const tg = new Telegram(this.tgToken, factIdChannel)

        const factN = fs.readFileSync("factN.txt", "utf8");
        console.log(`Request https://facts.museum/${factN}......`)
        const res = await axios.get(`https://facts.museum/${factN}`, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            },
            httpsAgent: new https.Agent({keepAlive: true}),
            timeout: 30000
        })
        console.log(`Url accepted`)
        const root = parse(res.data)
        const title = root.querySelector('h2').childNodes[0]._rawText
        const text = root.querySelector('.content').childNodes[0]._rawText
        const link = root.querySelector('.clearfix.links').childNodes[0].childNodes[1].getAttribute('data-url')
        const linkText = root.querySelector('.clearfix.links').childNodes[0].childNodes[1].textContent.toString()

        const image_link = `https://facts.museum/img/facts/${factN}.jpg`

        const resultText = generatePostForFact(title, text, link, linkText)

        const res1 = await tg.sendPhoto(resultText, image_link)
        fs.writeFileSync("factN.txt", String(Number(factN) + 1))
        const postId = res1.data.result.message_id
        const subs = await tg.getMemberCount()
        const resObj =  [{
            count: 0,
            postId: postId,
            link: `https://t.me/Rekord_and_facts/${postId}`,
            memberCount: subs
        }]
        await tg.addPostLinksToJSON(resObj)
        const smm = new SMM(this.smmToken)
        await smm.processPostLinksJSON('./posts_links.json', true)
    }
}
export default Core