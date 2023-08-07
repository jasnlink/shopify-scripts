import { CreateMediaInput, MediaContentType, Mutation, ProductInput, ProductVariantInput, WeightUnit } from '../_generated/graphql.js'
import { ResultRoot } from '../_generated/result.js'
import 'dotenv/config'
import fs from 'fs'
import { print } from 'graphql'
import Shopify from 'shopify-api-node'
import { productCreateQuery, productCreateQueryInput } from '../_graphql/index.js'
import readline from 'readline'

const DATA_LOCATION = `${process.cwd()}\\_data\\result.jsonl`

const shopify = new Shopify({
    accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    shopName: process.env.SHOPIFY_SHOP_NAME
})

main(shopify)
.then(() => {
    console.log(`Main execution done...`)
})
.catch((err) => console.error(err))

function main(shopify: Shopify) {
    return new Promise<void>((resolve, reject) => {
        if (!shopify) {
            reject(`Error: Shopify session not defined...`)
        }

        
        let processQueue: Promise<any>[] = []

        const readStream = fs.createReadStream(DATA_LOCATION, `utf8`)
        const rl = readline.createInterface(readStream)
        rl.on(`line`, (line) => {
            console.log(`New line, pushing new job to queue...`)
            processQueue.push(processJob(shopify, line))
        })
        rl.on(`close`, () => {
            console.log(`End of file reached, waiting for all promises to settle...`)
            Promise.all(processQueue)
            .then(() => {
                console.log(`All promises settled, resolving...`)
                resolve()
            })
        })
        
        

        function processJob(shopify: Shopify, dataLine: string) {
            return new Promise<void>((resolve, reject) => {

                    const data: ResultRoot = JSON.parse(dataLine)

                    if (!data) {
                        reject(`Could not parse JSON data!`)
                    }

                    const productInputPayload: ProductInput = {
                        handle: data.product.handle,
                        vendor: 'KBDSHOP',
                        title: data.product.title,
                        descriptionHtml: data.product.body_html,
                        collectionsToJoin: ['gid:\/\/shopify\/Collection\/436311687452', 'gid:\/\/shopify\/Collection\/454475776284'],
                        giftCard: false,
                        options: (function() {
                            let res: string[] = []
                            for (let option of data.product.options) {
                                res.push(option.name)
                            }
                            return res
                        }()),
                        productType: data.product.product_type,
                        tags: [`import_id:${data.product.id}`],
                        variants: (function() {
                            let res: ProductVariantInput[] = []
                            for (let variant of data.product.variants) {
                                res.push({
                                    sku: variant.sku,
                                    taxable: true,
                                    price: ((parseFloat(variant.price))*2.2).toString(),
                                    weight: variant.weight,
                                    weightUnit: (function() {
                                        let res = null
                                        switch (variant.weight_unit) {
                                            case 'lb':
                                                res = WeightUnit.Pounds
                                                break;
                                            case 'oz':
                                                res = WeightUnit.Ounces
                                                break;
                                            case 'g':
                                                res = WeightUnit.Grams
                                                break;
                                            case 'kg':
                                                res = WeightUnit.Kilograms
                                                break;
                                            default:
                                                res = null
                                                break;
                                            }
                                        return res
                                    }()),
                                    requiresShipping: true,
                                    options: (function() {
                                        let res: string[] = []
                                        if(variant.option1) res.push(variant.option1)
                                        if(variant.option2) res.push(variant.option2)
                                        if(variant.option3) res.push(variant.option3)
                                        return res
                                    }())
                                })
                            }
                            return res
                        }()),
                    }
            
                    const mediaInputPayload = (function() {
                        let res: CreateMediaInput[] = []
                        for(let image of data.product.images) {
                            res.push({
                                originalSource: image.src,
                                mediaContentType: MediaContentType.Image,
                                alt: image.alt
                            })
                        }
                        return res
                    }()) 
            
                    shopify.graphql(print(productCreateQuery), productCreateQueryInput(productInputPayload, mediaInputPayload))
                    .then((response: Mutation) => {
                        if(response.productCreate.userErrors.length) {
                            reject(`User Error: ${JSON.stringify(response.productCreate.userErrors)}`)
                        }
                        console.log(`Current GraphQL limits:::${JSON.stringify(shopify.callGraphqlLimits)}, Mutation query done... ${JSON.stringify(response.productCreate.product.id)}:::::${JSON.stringify(response.productCreate.product.handle)}`)
                        resolve()
                    })
                    .catch((err) => reject(`GraphQL error: ${err}`))
            })
        }

    })
}