import { Schematic } from "./schematic"
import { SchematicContext, SchematicErrorType, SchematicParseResult } from "./types"

export class StringSchematic extends Schematic<string> {
    constructor() {
        super()
    }

    public async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<string>> {
        if (typeof value !== "string") {
            return this.createSchematicError({
                message: `Expected a string but received a ${typeof value}`,
                path: context.path,
                type: SchematicErrorType.InvalidType
            })
        }

        return {
            isValid: true,
            value
        }
    }

    public length(length: number) {
        this.validationChecks.push(async (value: unknown) => {
            if (typeof value === "string") {
                if (value.length !== length) {
                    return {
                        message: `Expected a string with a length of ${length} but received a string with a length of ${value.length}`,
                        expected: length,
                        path: [],
                        type: SchematicErrorType.InvalidExactValue
                    }
                }
            }

            return null
        })

        return this
    }

    public min(min: number) {
        this.validationChecks.push(async (value: unknown) => {
            if (typeof value === "string") {
                if (value.length < min) {
                    return {
                        message: `Expected a string with a length of at least ${min} but received a string with a length of ${value.length}`,
                        min,
                        path: [],
                        type: SchematicErrorType.TooSmall
                    }
                }
            }

            return null
        })

        return this
    }

    public max(max: number) {
        this.validationChecks.push(async (value: unknown) => {
            if (typeof value === "string") {
                if (value.length > max) {
                    return {
                        message: `Expected a string with a length of at most ${max} but received a string with a length of ${value.length}`,
                        max,
                        path: [],
                        type: SchematicErrorType.TooBig
                    }
                }
            }

            return null
        })

        return this
    }
}
