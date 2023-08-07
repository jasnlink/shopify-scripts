import 'dotenv/config'
import fetch, { Response } from "node-fetch";
import * as fs from "fs"
import { ResultRoot } from './_generated/result';

const RESULT_LOCATION = `${process.cwd()}\\${process.env.DATA_LOCATION}\\result`

if (!fs.existsSync(`${process.cwd()}\\${process.env.DATA_LOCATION}`)) {
    fs.mkdirSync(`${process.cwd()}\\${process.env.DATA_LOCATION}`)
}

const PRODUCT_URLS = [
    "https://phantomcables.com/products/inch-locking-sata-to-locking-sata-cable-7-pin-to-7-pin",
    "https://phantomcables.com/products/19-inch-15-pin-power-to-7-pin-4-pin-power-adapter",
    "https://phantomcables.com/products/39-inch-external-l-sata-to-i-esata-cable-7-pin-to-7-pin",
    "https://phantomcables.com/products/6-inch-4-pin-power-to-15-pin-sata-power-cable",
    "https://phantomcables.com/products/6-inch-4-pin-power-to-2x-15-pin-sata-power-cable",
    "https://phantomcables.com/products/6-inch-4-pin-power-to-right-angle-15-pin-sata-power-cable",
    "https://phantomcables.com/products/7-inch-4-pin-power-female-to-15-pin-male-sata-power-cable",
    "https://phantomcables.com/products/external-l-sata-to-external-l-sata-cable-7-pin-to-7-pin",
    "https://phantomcables.com/products/right-angle-sata-to-right-angle-sata-cable-7-pin-to-7-pin",
    "https://phantomcables.com/products/sata-to-right-angle-sata-cable-7-pin-to-7-pin",
    "https://phantomcables.com/products/sata-to-sata-cable-7-pin-to-7-pin"
]

main()
.then(() => {
    console.log(`Main execution done...`)
})
.catch((err) => console.error(err))

function main() {

    return new Promise<void>((resolve) => {

        fs.writeFileSync(`${RESULT_LOCATION}.json`, ``, { encoding: 'utf-8', flag: 'w' })
        fs.writeFileSync(`${RESULT_LOCATION}.jsonl`, ``, { encoding: 'utf-8', flag: 'w' })

        let processQueue: Promise<any>[] = []
    
        for (let i = 0; i < PRODUCT_URLS.length; i++) {
            const url = PRODUCT_URLS[i]
            processQueue.push(processJob(url, i))
        }
    
        Promise.all(processQueue)
        .then(() => {
            console.log(`All data has been fetched...`)
            resolve()
        })
        .catch((err) => {console.error(err)})
    
        function processJob(url: string, index: number) {
            return new Promise<void>((resolve, reject) => {
                fetch(`${url.trim()}.json`)
                .then((response: Response) => {
                    if(!response.ok) {
                        throw new Error(`Error: ${JSON.stringify(response.status)}`)
                    }
                    return response.json()
                })
                .then((data: ResultRoot) => {
                    fs.writeFileSync(`${RESULT_LOCATION}.json`, `${JSON.stringify(data, null, 4)}\n`, { encoding: 'utf-8', flag: 'a' })
                    fs.writeFileSync(`${RESULT_LOCATION}.jsonl`, `${JSON.stringify(data, null, 0)}\n`, { encoding: 'utf-8', flag: 'a' })
                    console.log(`Writing JSON data...`)
                    resolve()
                })
                .catch((err) => reject(err))
            })
        }

    })

}
