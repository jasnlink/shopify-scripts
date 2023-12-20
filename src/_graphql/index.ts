import { gql } from "graphql-tag";
import { CreateMediaInput, ProductInput, ProductVariantInput, ProductVariantPositionInput, ProductVariantsBulkInput } from "../_generated/graphql";

export const userErrorsFields = gql`
    fragment userErrorsFields on UserError {
        field
        message
    }
`

export const shopQuery = gql`
    query {
        shop {
            id
        }
    }
`

export function productCreateQueryInput(input: ProductInput, media?: CreateMediaInput[]) {
    return {
        input: input,
        media: media ? media : null
    }
}

export const productCreateQuery = gql`
    ${userErrorsFields}
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
        productCreate(input: $input, media: $media) {
            userErrors {
                ...userErrorsFields
            }
            product {
                id
                handle
                title
            }
        }
    }
`

export function addBulkVariantToProductQueryInput(productId: string, variants: ProductVariantsBulkInput[], media: CreateMediaInput[]) {
    return {
        media: media,
        productId: productId,
        variants: variants
    }
}


export const addBulkVariantToProductQuery = gql`
    mutation addBulkVariantToProductQuery($media: [CreateMediaInput!],$productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(media: $media, productId: $productId, variants: $variants) {
            userErrors {
                field
                message
            }
            product {
                id
                handle
                title
            }
            productVariants {
                id
                title
                price
            }
        }
    }
`

export function productVariantCreateQueryInput(input: ProductVariantInput) {
    return {
        input: input
    }
}

export const productVariantCreateQuery = gql`
    ${userErrorsFields}
    mutation productVariantCreate($input: ProductVariantInput!) {
        productVariantCreate(input: $input) {
            product {
                id
                title
                handle
            }
            productVariant {
                id
                title
                price
            }
            userErrors {
                ...userErrorsFields
            }
        }
    }
`

export function productQueryInput(id: string) {
    return {
        id: id
    }
}

export const productQuery = gql`
    query productQuery($id: ID!) {
        product(id: $id) {
            id
            title
            handle
            variants(first: 100) {
                edges {
                    node {
                        id
                        title
                    }
                }
            }
        }
    }
`

export function productVariantBulkReorderQueryInput(positions: ProductVariantPositionInput[], productId: string) {
    return {
        positions: positions,
        productId: productId
    }
}

export const productVariantsBulkReorderQuery = gql`
    mutation productVariantsBulkReorderQuery($positions: [ProductVariantPositionInput!]!, $productId: ID!) {
        productVariantsBulkReorder(positions: $positions, productId: $productId) {
            userErrors {
                field
                message
            }
            product {
                id
                title
                handle
                variants(first: 100, sortKey: POSITION) {
                    edges {
                        node {
                            id
                            title
                            position
                        }
                    }
                }
            }
        }
    }
`