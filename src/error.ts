import { SchematicError } from "./types"

export class SchematicParseError extends Error {
    constructor(public errors: SchematicError[]) {
        super("The value failed to parse correctly")
    }
}
