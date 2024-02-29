import { SchematicParseError } from "./error"
import {
    SchematicErrorType,
    type SchematicContext,
    type SchematicError,
    type SchematicParseResult
} from "./types"

/**
 * Base class for all Schematics
 */
export abstract class Schematic<T> {
    /**
     * @internal
     */
    validationChecks: Array<(value: T) => Promise<SchematicError | null>> = []

    constructor() {}

    /**
     * @internal
     */
    createSchematicError(issue: SchematicError): SchematicParseResult<T> {
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

        let result = await this.parseType(value, context)

        for (const check of this.validationChecks) {
            if (!result.isValid) {
                break
            }

            const error = await check(result.value)

            if (error) {
                result = {
                    isValid: false,
                    errors: [error]
                }
            }
        }

        if (result.isValid) {
            return result.value
        }

        throw new SchematicParseError(result.errors)
    }
}

type AbstractSchematicMixin<T> = abstract new (...args: any[]) => Schematic<T>

export function SchematicPrimitiveType<T>(Base: AbstractSchematicMixin<T>) {
    abstract class Mixin extends Base {
        public exact(expectedValue: T): this {
            this.validationChecks.push(async (value: unknown) => {
                if (value !== expectedValue) {
                    return {
                        expected: expectedValue,
                        message: `Expected ${expectedValue} but received ${value}`,
                        path: [],
                        type: SchematicErrorType.InvalidExactValue
                    }
                }

                return null
            })

            return this
        }
    }

    return Mixin
}
