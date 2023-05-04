import Vk from "./vk.js";
import fs from "fs";
import Telegram from "./telegram.js";
import SMM from "./SMM.js";

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
        return await tg.postPartGroup(channelIndex)
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
        await smm.upSubsAfterSelfAds(senderAd.channelId)
    }

}
export default Core