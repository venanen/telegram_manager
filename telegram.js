import axios from "axios";
import fs from 'fs'
class Telegram {
    constructor(token, destinationChat) {
        this.token = token
        this.destinationChat = destinationChat
    }

    async callMethod(method, params) {
        try {
            return await axios.post(`https://api.telegram.org/bot${this.token}/${method}`, params)
        } catch (e) {
            console.error('Error with callMethod', e.response.data, 'URL: ', `https://api.telegram.org/bot${this.token}/${method}`, params)
        }
    }

    async sendText(text) {
        return await this.callMethod('sendMessage', {
            "chat_id": this.destinationChat,
            "text": text
        })
    }

    async sendPhoto(text, photo) {
        return await this.callMethod('sendPhoto', {
            "chat_id": this.destinationChat,
            "caption": text,
            "parse_mode": 'HTML',
            photo
        })
    }

    async sendMediaGroup(text, arrayOfPhotos) {
        let mediaTypes = arrayOfPhotos.map((url, key) => {
            let media = {
                type: 'photo',
                media: url
            }
            return key === 0 ? {caption: text, ...media} : media
        })
        return await this.callMethod('sendMediaGroup', {
            "chat_id": this.destinationChat,
            "caption": text,
            'media': mediaTypes
        })
    }
    async getMemberCount(){
        const data = await this.callMethod('getChatMemberCount', {
            "chat_id": this.destinationChat,
        })
        return data.data.result
    }
    async processVkPosts(posts) {
        let memberCount = await this.getMemberCount()
        memberCount = 7000//memberCount.data.result
        let request = 0
        let resultRequests = []
        for (const post of posts) {
            let res
            if (request++ % 14 === 0) {
                await this.sleep(1000)
            }
            console.log('Process', request)
            if ('photo' in post) {
                if (post['photo'].length > 1) {
                    res = await this.sendMediaGroup(post['text'], post['photo'])
                } else {
                    res = await this.sendPhoto(post['text'], post['photo'][0])
                }
            } else {
                res = await this.sendText(post['text'])
            }
            const postId = res.data?.result?.message_id
            if(postId !== undefined){
                const link = `https://t.me/${this.destinationChat.replace('@', '')}/${postId}`
                const tempResult = {count: 0, postId, link, memberCount}
                resultRequests.push(tempResult)
            }

        }
        return resultRequests
    }

    async postPartGroup(channelIndex, limit = -1) {
        const {length, posts} = this.readMemeFromJSON(channelIndex)
        const chunkSize = Math.floor((25 / 100) * length)
        const sliceEnd = chunkSize > length ? length : chunkSize
        const countProcessPosts = limit !== -1 && sliceEnd > limit ? limit : sliceEnd
        const processPosts = posts.slice(0, countProcessPosts)
        const otherPosts = posts.slice(countProcessPosts, posts.length - 1)
        console.log('Proccess part, json len: ', length, 'real post: ', posts.length, ' process post: ', processPosts.length, ' other posts: ', otherPosts.length, ' slice end: ', countProcessPosts)
        const resObject = {length, posts: otherPosts}
        this.saveMemeToJSON(channelIndex, resObject)
        const result = await this.processVkPosts(processPosts, limit)
        this.addPostLinksToJSON(result)
        return true


    }
    readMemeFromJSON(channelIndex){
        return JSON.parse(fs.readFileSync(`posts_channel_${channelIndex}.json`, 'utf8'))
    }
    saveMemeToJSON(channelIndex, resObject){
        fs.writeFileSync(`posts_channel_${channelIndex}.json`, JSON.stringify(resObject))
    }
    savePostsLinks(resObject){
        fs.writeFileSync(`posts_links.json`, JSON.stringify(resObject))
    }
    readPostsLinks(){
        if (fs.existsSync(`posts_links.json`)) {
            return JSON.parse(fs.readFileSync(`posts_links.json`, 'utf8'))
        }else{
            return []
        }

    }
    addPostLinksToJSON( resObject){
        let res = this.readPostsLinks()
        //console.log('resObj', resObject)
/*        if(typeof resObject !== 'object'){
            console.error('Error obj recivied', resObject)
            throw new Error('resObject is not an object')
        }*/
        this.savePostsLinks([...res, ...resObject])
    }
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async getUpdates(){
        let data = await this.callMethod('getUpdates', {})

        return data.data
    }

}
export default Telegram