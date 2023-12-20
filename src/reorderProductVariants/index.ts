import fs from 'fs'
import os from 'os'
import 'dotenv/config'
import { print } from 'graphql'
import Shopify from 'shopify-api-node'
import { Mutation, ProductVariantInput, ProductVariantPositionInput, ProductVariantsBulkInput, QueryRoot } from '../_generated/graphql.js'
import { addBulkVariantToProductQuery, addBulkVariantToProductQueryInput, productCreateQueryInput, productQuery, productQueryInput, productVariantBulkReorderQueryInput, productVariantCreateQuery, productVariantsBulkReorderQuery } from '../_graphql/index.js'
import { randomUUID } from 'crypto'


const PRODUCT_ID = `gid://shopify/Product/7224921227317`
const DATA_LOCATION = `${process.cwd()}\\_data\\reorderProductVariants_result.json`

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

        // Clear data result file
        fs.writeFileSync(DATA_LOCATION, ``, { encoding: `utf-8`, flag: `w` })

        console.log(`Running productQuery`)

        shopify.graphql(print(productQuery), productQueryInput(PRODUCT_ID))
        .then((response: QueryRoot) => {
            console.log(response)
            let productVariants = response.product.variants.edges
            fs.writeFileSync(DATA_LOCATION, `${JSON.stringify(productVariants)}${os.EOL}`, { encoding: `utf-8`, flag: `a` })
            
            console.log(`Received product variants, sorting to ascending title...`)
            productVariants.sort((a, b) => parseInt(a.node.title.slice(0, 2)) - parseInt(b.node.title.slice(0, 2)))

            console.log(`Building positions...`)
            let positions: ProductVariantPositionInput[] = []
            for (let i = 1; i < productVariants.length; i++) {
                positions.push({
                    id: productVariants[i-1].node.id,
                    position: i
                })
            }
            fs.writeFileSync(DATA_LOCATION, `${JSON.stringify(positions)}${os.EOL}`, { encoding: `utf-8`, flag: `a` })

            console.log(`Running productVariantsBulkReorderQuery`)
            shopify.graphql(print(productVariantsBulkReorderQuery), productVariantBulkReorderQueryInput(positions, PRODUCT_ID))
            .then((response: Mutation) => {
                if (response.productVariantsBulkReorder.userErrors.length) {
                    throw new Error(`UserError: ${JSON.stringify(response.productVariantsBulkReorder.userErrors)}`)
                }
                fs.writeFileSync(DATA_LOCATION, `${JSON.stringify(response)}${os.EOL}`, { encoding: `utf-8`, flag: `a` })
                console.log(`Reorder done, resolving`)
                resolve()
            })
            .catch((err) => reject(err))
        })
        .catch((err) => reject(err))
    })
}