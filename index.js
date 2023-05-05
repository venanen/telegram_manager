import Core from './core.js'
import fs from 'fs'
import SMM from "./SMM.js";
import Telegram from "./telegram.js";

const VK_TOKEN =  'vk1.a.NIRpefRwlOaM6sMsmMVYXjW5gZ8PejZFH2XW7066POpstU29U2DjxzcnvIztBgSYtXIZDig5-JreLYBcIW8Z6Zr57pRvDJbkHU50IebgHomDGfhf8LmZW_-L6GctOQt0oIw9a_4ztvtwY-35n_Rz5hd_KNe5rXKmBHu9PKvtXMNQca-vFtnGDigr552FUvi4azmCcZ5RUP9i54pWwl6hSw'
const TELEGRAM_BOT_TOKEN =  '6033121034:AAEG-rTt2fOmB93J9nEJJYwa8q89j_hkao0'
const GLOBAL_SMM_TOKEN = '26031198bb035e0d0e956270ad2ae42bdbe42444b3b59f41263445a109b3de8a'

const CONFIG_CHANNELS = [
    {
        channelId: '@memefrogv',
        memesGroups: ['saintbeobanka', 'demotiva', 'baneksbest', 'jumoreski', 'threadshot', 'abstract_memes', 'karkb',
            'dank_memes_ayylmao', 'cursed_hh', 'designmdk', 'abama_loh', 'polybaiani', 'sg.bash', 'spiritlesswest',
            '21jqofa', 'inscriptions_on_pics', 'postmoderntoponym',
            'pikcipikcipikci', ],
        adsPost: "Любишь самые современные мемы? Тогда подписывайся на @memefrogv, где нейросеть сама собирает лучшие мемы по всему рунету! Мемы каждый день огромными порциями - залетай и кайфуй!",
        adsPhoto: "https://sun9-44.userapi.com/impf/c851128/v851128805/182b8e/aMyHPALu2Hw.jpg?size=1000x800&quality=96&sign=88b7342bba88b740cf6bd9062688e783&type=album",
        excludeFromViews: true,
        limit: -1
    },
    {
        channelId: '@NeuralMemesv2',
        memesGroups: ['saintbeobanka', 'demotiva', 'baneksbest', 'jumoreski', 'threadshot', 'abstract_memes', 'karkb',
        'dank_memes_ayylmao', 'cursed_hh', 'designmdk', 'abama_loh', 'polybaiani', 'sg.bash', 'spiritlesswest',
        '21jqofa', 'inscriptions_on_pics', 'postmoderntoponym',
        'pikcipikcipikci', ],
        adsPost: "Любишь самые современные мемы? Тогда подписывайся на @NeuralMemesv2, где нейросеть сама собирает лучшие мемы по всему рунету! Мемы каждый день огромными порциями - залетай и кайфуй!",
        adsPhoto: "https://sun9-46.userapi.com/impg/z4Jiy91Ily3dvZ0jX51W1Ir2wG8KyrH81XF_Zw/b-Ypw2Mg4N8.jpg?size=640x640&quality=95&sign=431ad40a03012afb6f9e33b235c058ea&type=album",
        excludeFromViews: false,
        limit: 2
    },
    {
        channelId: '@ruki_iz_plech_rl',
        memesGroups: ['stroi_samych', 'public124764538', 'freeseller', 'samodelkatv'],
        adsPost: "Хотите научиться создавать уникальные вещи своими руками и получать удовольствие от творчества? Подписывайтесь на наш канал самоделок и хобби @ruki_iz_plech_rl! У нас вы найдете множество идей для различных проектов, полезные советы и подробные инструкции. Не нужно быть профессионалом - все, что вам нужно, это желание и интерес к творчеству. Присоединяйтесь к нашему сообществу и начните создавать свои уникальные шедевры уже сегодня!",
        adsPhoto: "https://sun9-77.userapi.com/impg/zaTx_57GFtxIynildubQI6W3csnJcjJUhSyxnQ/nRMVZHurZkw.jpg?size=500x500&quality=95&sign=820f8323566ff2b26e2b04999b3a6811&type=album",
        excludeFromViews: false,
        limit: 2
    },
    {
        channelId: '@must_have_china',
        memesGroups: ['ali_stallions', 'dolly_ali', 's_stylist', 'wowsoalix'],
        adsPost: "Готовы к потрясающим покупкам по низким ценам? Подписывайтесь на наш канал товаров с AliExpress @must_have_china и откройте для себя мир бесконечных возможностей! Мы ищем самые интересные и качественные товары на AliExpress и делимся с вами нашими находками. Наши обзоры и отзывы помогут вам сделать правильный выбор и сэкономить ваш бюджет. Присоединяйтесь к нам, и начните покупать умнее уже сегодня!",
        adsPhoto: "https://sun9-60.userapi.com/impg/tySIjYIPaUt0I-qmynvo2RwwcUtdEy4jTI04sw/X1n7-TF39rQ.jpg?size=640x640&quality=95&sign=94c2546a2b56ae3620f6c211d8924175&type=album",
        excludeFromViews: false,
        limit: 2
    },
    {
        channelId: '@underhear',
        memesGroups: ['overhear', 'public76791337', 'pmmgo'],
        adsPost: "Хотите окунуться в мир чужих историй и заглянуть за кулисы жизни других людей? Подписывайтесь на наш канал \"Подслушано\" @underhear и узнавайте самые неожиданные, удивительные и порой шокирующие анонимные истории. Мы собираем и публикуем самые интересные истории из жизни, открывая вам новые грани реальности. Присоединяйтесь к нашему сообществу и начните погружаться в увлекательный мир человеческих историй уже сегодня!",
        adsPhoto: "https://sun9-15.userapi.com/impg/4m0miO-cNWOxyU2HYgcHdZHJdWMHGaXc4hzR-A/Xo8ZUBSEj2k.jpg?size=200x202&quality=95&sign=ca4c427794d1397731af0f726675c1f5&type=album",
        excludeFromViews: false,
        limit: 2
    },
    {
        channelId: '@somnit_anek',
        memesGroups: ['baneksbest', 'badjokesleaguee'],
        adsPost: "Готовы рассмеяться до слез? Подписывайтесь на наш канал анекдотов @somnit_anek и наслаждайтесь лучшими юмористическими историями! Мы собираем и публикуем самые смешные и остроумные анекдоты, чтобы поднять вам настроение и помочь расслабиться после трудного дня. Наш канал подходит для любителей юмора всех возрастов и предпочтений. Присоединяйтесь к нашему сообществу и начните улыбаться уже сегодня!",
        adsPhoto: "https://sun9-76.userapi.com/impg/Yjto-hcV6ZyqNZ_u0rLhgfeykhclM-s258DlIA/2mhjKrMW0-I.jpg?size=1080x1080&quality=95&sign=6d6c31872657dc274bd243fbe9f2d907&type=album",
        excludeFromViews: false,
        limit: 2
    }
]


const core = new Core(VK_TOKEN, TELEGRAM_BOT_TOKEN, GLOBAL_SMM_TOKEN, CONFIG_CHANNELS)
const smm = new SMM(GLOBAL_SMM_TOKEN)
const args = process.argv
if(args[2] === 'get'){
    core.getAndSaveVkPostsByIndex(0)
}
if(args[2] === 'post'){
    core.postToTelegramByIndex(0)
}
if(args[2] === 'up-views'){
    smm.processPostLinksJSON('./posts_links.json')
}
if(args[2] === 'set-ads'){
    core.processSelfAd()
}
if(args[2] === 'test-run'){
    let testRun = 3
    //core.processGetPosts(testRun)
    core.mainScheduler()
}

if(args[2] === 'test'){
    core.getFactAndSendPost()
}