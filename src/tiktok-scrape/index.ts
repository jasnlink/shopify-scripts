import fetch from "node-fetch"

const url = `https://www.tiktok.com/@emma.es36/video/7281867160291462443?is_from_webapp=1&sender_device=pc&web_id=7285133445449451013`

fetch(url)
.then((response) => {
    return response.text()
})
.then((data) => {
    console.log(`response`, data)
})