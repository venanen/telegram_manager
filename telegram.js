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
            console.error('Error with callMethod', e.response.data)
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
        return this.callMethod('getChatMemberCount', {
            "chat_id": this.destinationChat,
        })
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

    async postPartGroup(channelIndex) {
        const {length, posts} = this.readMemeFromJSON(channelIndex)
        const chunkSize = Math.floor((7 / 100) * length)
        const sliceEnd = chunkSize > length ? length : chunkSize
        const processPosts = posts.slice(0, sliceEnd)
        const otherPosts = posts.slice(sliceEnd, posts.length - 1)
        console.log('Proccess part, json len: ', length, 'real post: ', posts.length, ' process post: ', processPosts.length, ' other posts: ', otherPosts.length, ' slice end: ', sliceEnd)
        const resObject = {length, posts: otherPosts}
        this.saveMemeToJSON(channelIndex, resObject)
        const result = await this.processVkPosts(processPosts)
        this.addPostLinksToJSON(channelIndex, result)


    }
    readMemeFromJSON(channelIndex){
        return JSON.parse(fs.readFileSync(`posts_channel_${channelIndex}.json`, 'utf8'))
    }
    saveMemeToJSON(channelIndex, resObject){
        fs.writeFileSync(`posts_channel_${channelIndex}.json`, JSON.stringify(resObject))
    }
    savePostsLinks(channelIndex, resObject){
        fs.writeFileSync(`posts_links.json`, JSON.stringify(resObject))
    }
    readPostsLinks(channelIndex){
        if (fs.existsSync(`posts_links.json`)) {
            return JSON.parse(fs.readFileSync(`posts_links.json`, 'utf8'))
        }else{
            return []
        }

    }
    addPostLinksToJSON(channelIndex, resObject){
        let res = this.readPostsLinks(channelIndex)
        console.log('resObj', resObject)
        this.savePostsLinks(channelIndex, [...res, ...resObject])
    }
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}
export default Telegram