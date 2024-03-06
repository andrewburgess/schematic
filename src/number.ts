import { createInvalidTypeError, createTooBigError, createTooSmallError } from "./error"
import { Schematic } from "./schematic"
import {
    Coercable,
    CoerceSymbol,
    DefaultValueSymbol,
    Defaultable,
    SchematicContext,
    SchematicOptions,
    SchematicParseResult,
    SchematicTestContext
} from "./types"
import { addCheck, withCoerce, withDefault } from "./util"

export class NumberSchematic extends Schematic<number> implements Coercable, Defaultable<number> {
    /**
     * @internal
     */
    [DefaultValueSymbol]: number | (() => number) | undefined

    /**
     * @internal
     */
    async _parse(
        value: unknown = typeof this[DefaultValueSymbol] === "function"
            ? this[DefaultValueSymbol]()
            : this[DefaultValueSymbol],
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
            return this._createTypeParseError(context.path, "number", value)
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

    public int() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value % 1 !== 0) {
                context.addError(createInvalidTypeError(context.path, "integer", value))
            }
        })
    }

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            const isValid = options?.exclusive ? value < max : value <= max
            if (!isValid) {
                context.addError(createTooBigError(context.path, value, max, options?.exclusive))
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            const isValid = options?.exclusive ? value > min : value >= min
            if (!isValid) {
                context.addError(createTooSmallError(context.path, value, min, options?.exclusive))
            }
        })
    }

    public negative() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value > 0) {
                context.addError(createTooBigError(context.path, value, 0, false))
            }
        })
    }

    public nonnegative() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value < 0) {
                context.addError(createTooSmallError(context.path, value, 0, true))
            }
        })
    }

    public positive() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value < 0) {
                context.addError(createTooSmallError(context.path, value, 0, false))
            }
        })
    }
}
