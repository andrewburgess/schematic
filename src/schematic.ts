import { SchematicParseError } from "./error"
import type { SchematicContext, SchematicError, SchematicParseResult } from "./types"

/**
 * Base class for all Schematics
 */
export abstract class Schematic<T> {
    constructor() {}

    protected createSchematicError(issue: SchematicError): SchematicParseResult<T> {
        return {
            isValid: false,
            errors: [issue]
        }
    }

    /**
     * Internal method to parse a value into the type T
     * @param value The value to parse
     * @param context Context of the parsing
     * @internal
     * @returns The result of the parsing
     */
    abstract parseType(value: unknown, context: SchematicContext): Promise<SchematicParseResult<T>>

    /**
     * Parse and validate an unknown type into the type T
     * @param value The value to parse
     * @returns The parsed value
     */
    public async parse(value: unknown): Promise<T> {
        const context: SchematicContext = {
            data: value,
            path: [],
            parent: null
        }

        const result = await this.parseType(value, context)

        if (result.isValid) {
            return result.value
        }

        throw new SchematicParseError(result.errors)
    }
}
