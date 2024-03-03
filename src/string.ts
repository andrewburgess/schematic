import { createInvalidExactValueError, createTooBigError, createTooSmallError } from "./error"
import { Schematic } from "./schematic"
import {
    Coercable,
    CoerceSymbol,
    Defaultable,
    SchematicContext,
    SchematicOptions,
    SchematicParseResult
} from "./types"
import { addValidationCheck, withCoerce, withDefault } from "./util"

export class StringSchematic extends Schematic<string> implements Coercable, Defaultable<string> {
    defaultValue: string | (() => string) | undefined

    /**
     * @internal
     */
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
            return this.createTypeParseError(context.path, "string", value)
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
        return addValidationCheck(this, async (value: string, context: SchematicContext) => {
            if (value.length !== length) {
                context.addError(
                    createInvalidExactValueError(
                        context.path,
                        value,
                        length,
                        options?.message ??
                            `Expected string with length ${length} but received string with length ${value.length}`
                    )
                )
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: string, context: SchematicContext) => {
            if (value.length < min) {
                context.addError(
                    createTooSmallError(
                        context.path,
                        value,
                        length,
                        options?.exclusive,
                        options?.message
                    )
                )
            }
        })
    }

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: string, context: SchematicContext) => {
            if (value.length > max) {
                context.addError(
                    createTooBigError(
                        context.path,
                        value,
                        length,
                        options?.exclusive,
                        options?.message
                    )
                )
            }
        })
    }
}
