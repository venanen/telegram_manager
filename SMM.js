import fs from "fs";
import axios from "axios";

class SMM{
    token
    targetEr = 23

    subsAfterSelfAds = 100
    subsAfterOutAds = 100
    subsRandomMaxPercent = 1.2
    METHODS = {
        upSubsBad: 1548,
        upSubsGood: 1666,
        upViews: 1497
    }
    constructor(token, targetEr = 23) {
        this.token = token
        this.targetEr = targetEr



    }
    async callSmmMethod(method, quantity, postLink){

        const urlMethod = `https://global-smm.biz/api/adapter/default/index/?key=${this.token}&_format=json&action=add&service=${method}&quantity=${quantity}&link=${postLink}`
        try {
        return await axios.get(urlMethod)
        } catch (e) {
            console.error('Error with callSmmMethod', e.response.data, 'URL: ', `https://api.telegram.org/bot${this.token}/${method}`, params)
        }
        //https://global-smm.biz/api/adapter/default/index/?key=26031198bb035e0d0e956270ad2ae42bdbe42444b3b59f41263445a109b3de8a&_format=json&action=add&service=1497&quantity=3500&link=${postLink}`
    }
    async upViews(count, postLink){
        return this.callSmmMethod(this.METHODS.upViews, count, postLink)
        //console.log('Up views', count, postId)
    }

    async upSubscribers(count, channelId, isSubsGood = true){
        return this.callSmmMethod(isSubsGood ? this.METHODS.upSubsGood : this.METHODS.upSubsBad, count, channelId)
    }
    timeDistributionFunction(x){
        return 6/x
    }
    randomIntFromInterval(min, max) { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    upSubsAfterSelfAds(channelId){
        const upSubsCount = this.randomIntFromInterval(this.subsAfterSelfAds, this.subsAfterSelfAds * this.subsRandomMaxPercent)
        return this.upSubscribers(upSubsCount, channelId)
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

/*    async processViews(step, channelId, postId){
        //const neededViews = this.calcNeededViewsByER(channelId, this.targetEr)
        const multiplier = this.getMultiplier(12, neededViews)
        //this.
        await this.upViews()
    }*/

    async processPostLinksJSON(pathToJSON = './posts_links.json', isCallForFirstTime = false){
        const MIN_SUBS_UP = 100
        const MAX_STARTS = 12
        if (fs.existsSync(pathToJSON)) {
            const data = JSON.parse(fs.readFileSync(pathToJSON, 'utf8'))
            for (const postObj of data) {
                const countSubs = postObj.memberCount
                const er = this.targetEr
                const step = postObj.count + 1
                if(isCallForFirstTime && step !== 1)
                    continue
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