import fs from "fs";

class SMM{
    token
    targetEr = 23
    constructor(token, targetEr = 23) {
        this.token = token
        this.targetEr = targetEr



    }
    async upViews(count, postId){
        console.log('Up views', count, postId)
    }

    upSubscribers(count, postId){

    }
    async getSubscriber(channelId){
        //имплементировать логику
        return 7000
    }
    timeDistributionFunction(x){
        return 6/x
    }

    async calcNeededViewsByER(countSubscriber, er = 18){
        return Math.floor(countSubscriber * (er / 100))

    }
    getMultiplier(startsCount = 12, summary){
        let sum = 0
        for(let i = 1; i < startsCount; i++)
            sum+=this.timeDistributionFunction(i)
        return Math.floor(summary/sum)
    }

    async processViews(step, channelId, postId){
        //const neededViews = this.calcNeededViewsByER(channelId, this.targetEr)
        const multiplier = this.getMultiplier(12, neededViews)
        //this.
        await this.upViews()
    }

    async processPostLinksJSON(pathToJSON = './posts_links.json'){
        const MIN_SUBS_UP = 100
        const MAX_STARTS = 12
        if (fs.existsSync(pathToJSON)) {
            const data = JSON.parse(fs.readFileSync(pathToJSON, 'utf8'))
            for (const postObj of data) {
                const countSubs = postObj.memberCount
                const er = this.targetEr
                const step = postObj.count + 1
                const allNeededViews = await this.calcNeededViewsByER(countSubs, er)
                const multiplier = this.getMultiplier(12, allNeededViews)

                const viewsForCurrentStep = Math.floor(this.timeDistributionFunction(step) * multiplier)
                //console.log('q', multiplier, allNeededViews, step, viewsForCurrentStep)
                await this.upViews(viewsForCurrentStep < MIN_SUBS_UP ? MIN_SUBS_UP : viewsForCurrentStep, postObj.link)
                postObj.count++
            }
            fs.writeFileSync(pathToJSON, JSON.stringify(
                    data.filter(val => val.count < MAX_STARTS)
                )
            )
        }else{
            console.warn('Post links not exist')
        }
    }




}
export default SMM