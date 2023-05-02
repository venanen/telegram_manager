import Vk from "./vk.js";
import fs from "fs";
import Telegram from "./telegram.js";

class Core{
    vkToken
    tgToken
    channelsConfig

    /**
     *
     * @param vkToken
     * @param tgToken
     * @param channelsConfig
     */
    constructor(vkToken = '', tgToken = '', channelsConfig = {}) {
        this.vkToken = vkToken
        this.tgToken = tgToken
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


}
export default Core