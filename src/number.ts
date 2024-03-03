import { createTooBigError, createTooSmallError } from "./error"
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
                context.addError(createTooBigError(context.path, value, max, options?.exclusive))
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: number, context: SchematicContext) => {
            const isValid = options?.exclusive ? value > min : value >= min
            if (!isValid) {
                context.addError(createTooSmallError(context.path, value, min, options?.exclusive))
            }
        })
    }
}
