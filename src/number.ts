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

export class NumberSchematic extends Schematic<number> implements Coercable, Defaultable<number> {
    constructor() {
        super()
    }
    defaultValue: number | (() => number) | undefined

    async _parseType(
        value: unknown = typeof this.defaultValue === "function"
            ? this.defaultValue()
            : this.defaultValue,
        context: SchematicContext
    ): Promise<SchematicParseResult<number>> {
        if (this[CoerceSymbol]) {
            if (typeof value !== "number") {
                const coerced = Number(value)
                if (!isNaN(coerced)) {
                    value = coerced
                }
            }
        }

        if (typeof value !== "number") {
            return this.createTypeParseError({
                message: `Expected number but received ${typeof value}`,
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

    public default(defaultValue: number | (() => number)): NumberSchematic {
        return withDefault(this, defaultValue)
    }

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: number, context: SchematicContext) => {
            const isValid = options?.exclusive ? value < max : value <= max
            if (!isValid) {
                let message = options?.message
                if (!message) {
                    if (options?.exclusive) {
                        message = `Expected number less than ${max} but received ${value}`
                    } else {
                        message = `Expected number less than or equal to ${max} but received ${value}`
                    }
                }
                return {
                    message,
                    max,
                    path: context.path,
                    received: value,
                    type: SchematicErrorType.TooBig
                }
            }

            return null
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: number, context: SchematicContext) => {
            const isValid = options?.exclusive ? value > min : value >= min
            if (!isValid) {
                let message = options?.message
                if (!message) {
                    if (options?.exclusive) {
                        message = `Expected number greater than ${min} but received ${value}`
                    } else {
                        message = `Expected number greater than or equal to ${min} but received ${value}`
                    }
                }
                return {
                    message,
                    min,
                    path: context.path,
                    received: value,
                    type: SchematicErrorType.TooSmall
                }
            }

            return null
        })
    }
}
