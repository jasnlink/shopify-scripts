import { gql } from "graphql-tag";
import { CreateMediaInput, ProductInput } from "../_generated/graphql";

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