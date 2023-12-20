import fs from 'fs'
import os from 'os'
import 'dotenv/config'
import { print } from 'graphql'
import Shopify from 'shopify-api-node'
import { Mutation, ProductVariantInput, ProductVariantsBulkInput } from '../_generated/graphql.js'
import { addBulkVariantToProductQuery, addBulkVariantToProductQueryInput, productCreateQueryInput, productVariantCreateQuery } from '../_graphql/index.js'
import { randomUUID } from 'crypto'

import { existingVariantsOpaque as existingVariants } from './constants.js'
const MAX_SIZE = 72

const PRODUCT_ID = `gid://shopify/Product/7224921227317`
const DATA_LOCATION = `${process.cwd()}\\_data\\addProductVariants_result.json`

const shopify = new Shopify({
    accessToken: process.env.RIDEAU_ZEBRA_SHOPIFY_ADMIN_ACCESS_TOKEN,
    shopName: process.env.RIDEAU_ZEBRA_SHOPIFY_SHOP_NAME,
    autoLimit: true,
    hooks: {
        beforeError: [
            error => {
                return
                const {response} = error;
                if (response && response.body) {
                    error.name = 'ERROR ERROR ERROR';
                    console.dir(response)
                    error.message = `${(response.body)} (${response.statusCode})`;
                }

                return error;
            }
        ]
    }
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
        let bulkVariantInput: ProductVariantInput[] = []

        // Clear data result file
        fs.writeFileSync(DATA_LOCATION, ``, { encoding: `utf-8`, flag: `w` })

        for (let i = 10; i <= MAX_SIZE; i++) {
            if (existingVariants.filter(variant => variant.size === i).length && i !== 15) {
                continue
            }
            let currentClosest = existingVariants[0]
            for (let variant of existingVariants) {
                if ((variant.size - i) > 0 && (variant.size - i) < Math.abs(currentClosest.size - i)) {
                    currentClosest = variant
                }
            }
            bulkVariantInput.push({
                productId: PRODUCT_ID,
                inventoryItem: {
                    cost: function(){
                        if (i === 15) {
                            return 25.00
                        }
                        return (currentClosest.cost + 30).toFixed(2)
                    }(),
                    tracked: true
                },
                inventoryQuantities: [
                {
                    availableQuantity: 100,
                    locationId: "gid://shopify/Location/65568636981"
                }
                ],
                options: [
                    `${i} inch Width x 84 inch Length`
                ],
                price: function(){
                    if (i === 15) {
                        return 85.00
                    }
                    return (currentClosest.price + 30).toFixed(2)
                }(),
                requiresShipping: true,
                taxable: true,
            })
        }
        console.log(`Writing result to DATA_LOCATION`)
        //fs.writeFileSync(DATA_LOCATION, `${JSON.stringify(bulkVariantInput)}${os.EOL}`, { encoding: `utf-8`, flag: `a` })
        for (let variantInput of bulkVariantInput) {
            console.log(`Pushing new runQuery job`)
            processQueue.push(runQuery(variantInput).catch(err => console.error(err)))
        }
        Promise.all(processQueue)
        .then(() => {
            console.log(`processQueue done, resolving main...`)
            resolve()
        })
        function runQuery(variantInput: ProductVariantInput) {
            return new Promise<void>((resolve, reject) => {
                const jobId = randomUUID()
                console.log(`Running productVariantCreateQuery...`, jobId)
                shopify.graphql(print(productVariantCreateQuery), productCreateQueryInput(variantInput))
                .then((response: Mutation) => {
                    if (response.productVariantCreate.userErrors.length) {
                        throw new Error(`UserError: ${JSON.stringify(response.productVariantCreate.userErrors)}`)
                    }
                    fs.writeFileSync(DATA_LOCATION, `${JSON.stringify(response)}${os.EOL}`, { encoding: `utf-8`, flag: `a` })
                    resolve()
                })
                .catch(err => reject(err))
            })
        }
    })
}