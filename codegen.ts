//@ts-nocheck
import 'dotenv/config'
import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: [
        {
            [`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`]: {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
                }
            }
        }
    ],
    generates: {
        './src/_generated/graphql.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-graphql-request'
            ]
        },
        './schema.graphql': {
            plugins: ['schema-ast']
        }
    }
}

export default config