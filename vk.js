import fs from 'fs'
import axios from "axios";
class Vk{
    /**
     *
     * @param token
     * @param memesGroups
     */
    constructor(token, memesGroups) {
        this.token = token
        this.memesGroups = memesGroups
    }

    async callMethod(method, params){
        const uri = new URLSearchParams(params).toString()
        return await axios.get(`https://api.vk.com/method/${method}?v=5.131&access_token=${this.token}&${uri}`)
    }
    async getPosts(ownerId = -67185996, offset = 0){
        try {
            const data = await this.callMethod('wall.get', {
                owner_id: ownerId,
                count: 100,
                offset: 0
            })
            if(data.error !== undefined){
                throw new Error('Error on getPosts')
            }else{
                return data;
            }
        }catch (e) {
            console.error('Error on getPosts')
        }
    }

    async resolveIdByName(name){
        try {
            const res = await this.callMethod('groups.getById', {
                group_ids: name
            })
            if(res.error !== undefined){
                console.error(res.error)
                throw new Error('Error on resolveIdsByName')
            }
            return res.data.response
        }catch (e) {
            console.error('Error on resolveIdsByName', `https://api.vk.com/method/groups.getById?v=5.131&group_ids=${name}&access_token=${this.token}`)
        }
    }
    async getMemesGroupIds(){
        const ids = await this.resolveIdByName(this.memesGroups.join(','))
        //console.log('IDS', ids)
        return ids.map(val => val.id)
    }
    formattedDate(timestamp = 0){
        if(timestamp === 0){
            let a  = new Date()
            a.setDate(a.getDate() - 1)
            return a.getMonth() + '/' + a.getDate()
        }else{
            let a = new Date(timestamp)
            return a.getMonth() + '/' + a.getDate()
        }
    }
    isAllowedAttachmentType(attachment){
        const allowedTypeAttachment = ['photo']
        if(attachment === undefined)
            return true
        return attachment.find(val => allowedTypeAttachment.includes(val.type)) !== undefined
    }
    async getPostGroup(ownerId = -67185996){
        //let items = [];
        let post =  await this.getPosts(ownerId)
        return post.data.response.items
            .filter(val => {
                return val['marked_as_ads'] === 0 &&
                    this.formattedDate() === this.formattedDate(val.date * 1000) &&
                    this.isAllowedAttachmentType(val['attachments']) &&
                    val['is_pinned'] !== 1 &&
                    val['copy_history'] === undefined
            })
    }
    async processSingleGroup(ownerId = -67185996){
        const countPostsPercent = 60 / 100;
        const minPostsForCutting = 60
        let items = []
        const posts = await this.getPostGroup(ownerId)
        posts.forEach(value => {
            let res = {}
            res.text = value.text
            res.views = value.views.count
            res.likes = value.likes.count
            res.vlRatio = value.likes.count / value.views.count
            res.date = new Date(value.date*1000)
            res.owner = value.owner_id
            const attObj = this.processAttachment(value['attachments'])
            if(attObj !== undefined){
                res = {...res, ...attObj}
            }
            items.push(res)
        })
        const sortedItems = items.sort((a, b) => {
            return b.vlRatio - a.vlRatio;
        })
        if(minPostsForCutting >= sortedItems.length){
            return sortedItems
        }else{
            return sortedItems.slice(0, sortedItems.length*countPostsPercent)
        }
    }
    processAttachment(attachment) {
        const attachmentObj = {
            photo: [],
            //video: []
        }
        if(attachment === undefined)
            return attachment
        attachment.forEach(att => {
            switch(att.type) {
                case 'photo':
                    // Берем самое большое изображение
                    //console.log(att.photo.sizes.filter(sizeObject => sizeObject['type'] === 'z'))
                    let photo = att.photo.sizes.filter(sizeObject => sizeObject['type'] === 'z' || sizeObject['type'] === 'x').at(-1)
                    attachmentObj.photo.push(photo.url)
                    break;
                case 'video':
                    // TODO: прикрутить видео
                    break
            }
        })
        return attachmentObj
    }
    async processAll(){
        let posts = []
        const ids = await this.getMemesGroupIds()
        for (const id of ids) {
            const p = await this.processSingleGroup(`-${id}`)
            posts = [...posts, ...p]
            await this.sleep(50)
        }
        /* перемешиваем */
        return posts.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
    }
    storePosts(posts, channelIndex){
        const len = posts.length
        const resultObject = {
            length: len,
            posts
        }
        fs.writeFile(`posts_channel_${channelIndex}.json`, JSON.stringify(resultObject), err => {
            if (err) {
                console.error(err);
            }
            console.log(`Stored ${len} posts`)
            // file written successfully
        });
    }
    sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

}
export default Vk