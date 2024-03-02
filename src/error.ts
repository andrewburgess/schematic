import { SchematicError } from "./types"

export class SchematicParseError extends Error {
    constructor(public errors: SchematicError[]) {
        super()

        this.message =
            this.errors.length > 1
                ? `${this.errors.length} errors occurred`
                : this.errors[0].message
    }
}
