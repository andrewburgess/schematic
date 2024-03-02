import { Schematic } from "./schematic"
import {
    Coercable,
    CoerceSymbol,
    Defaultable,
    SchematicContext,
    SchematicErrorType,
    SchematicOptions,
    SchematicParseResult
} from "./types"
import { addValidationCheck, withCoerce, withDefault } from "./util"

export class StringSchematic extends Schematic<string> implements Coercable, Defaultable<string> {
    defaultValue: string | (() => string) | undefined

    constructor() {
        super()
    }

    public async _parseType(
        value: unknown = typeof this.defaultValue === "function"
            ? this.defaultValue()
            : this.defaultValue,
        context: SchematicContext
    ): Promise<SchematicParseResult<string>> {
        if (typeof value !== "string" && this[CoerceSymbol]) {
            switch (typeof value) {
                case "function":
                case "symbol":
                    break
                case "object":
                    if (value === null || value instanceof Date) {
                        value = String(value)
                    }
                    break
                case "undefined":
                    value = ""
                    break
                default:
                    value = String(value)
                    break
            }
        }

        if (typeof value !== "string") {
            return this.createTypeParseError({
                message: `Expected string but received ${typeof value}`,
                path: context.path,
                received: value,
                type: SchematicErrorType.InvalidType
            })
        }

        return {
            isValid: true,
            value
        }
    }

    public coerce() {
        return withCoerce(this)
    }

    public default(defaultValue: string | (() => string)): StringSchematic {
        return withDefault(this, defaultValue)
    }

    public length(length: number, options?: SchematicOptions) {
        return addValidationCheck(this, async (value: string) => {
            if (value.length !== length) {
                return {
                    message:
                        options?.message ??
                        `Expected string with length ${length} but received string with length ${value.length}`,
                    expected: length,
                    path: [],
                    received: value,
                    type: SchematicErrorType.InvalidExactValue
                }
            }

            return null
        })
    }

    public min(min: number, options?: SchematicOptions) {
        return addValidationCheck(this, async (value: string) => {
            if (value.length < min) {
                return {
                    message:
                        options?.message ??
                        `Expected string with length of at least ${min} but received string with length ${value.length}`,
                    min,
                    path: [],
                    received: value,
                    type: SchematicErrorType.TooSmall
                }
            }

            return null
        })
    }

    public max(max: number, options?: SchematicOptions) {
        return addValidationCheck(this, async (value: string) => {
            if (value.length > max) {
                return {
                    message:
                        options?.message ??
                        `Expected a string with length less than ${max} but received a string with length ${value.length}`,
                    max,
                    path: [],
                    received: value,
                    type: SchematicErrorType.TooBig
                }
            }

            return null
        })
    }
}
