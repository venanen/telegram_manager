export function generatePostForFact(title, text, link, link_text ){
    return `<b>${title}</b>
        
${text}
        
        
<i>Источник: <a href="${link}">${link_text}</a></i>


⚡️<b> <a href="https://t.me/Rekord_and_facts">Факты каждый день</a></b>⚡️

        `
}