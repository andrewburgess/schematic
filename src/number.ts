import { createInvalidTypeError, createTooBigError, createTooSmallError } from "./error"
import { Schematic } from "./schematic"
import {
    Coercable,
    Defaultable,
    INVALID,
    SchematicInput,
    SchematicOptions,
    SchematicParseReturnType,
    SchematicTestContext,
    VALID
} from "./types"
import { addCheck, addErrorToContext, withCoerce, withDefault } from "./util"

export class NumberSchematic extends Schematic<number> implements Coercable, Defaultable<number> {
    /** @internal */
    _coerce: boolean = false
    /** @internal */
    _defaultValue: number | (() => number) | undefined

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<number>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (typeof value === "undefined" && this._defaultValue !== undefined) {
            value =
                typeof this._defaultValue === "function" ? this._defaultValue() : this._defaultValue
        }

        if (this._coerce) {
            if (typeof value !== "number") {
                const coerced = Number(value)
                if (!isNaN(coerced)) {
                    value = coerced
                }
            }
        }

        if (typeof value !== "number") {
            addErrorToContext(context, createInvalidTypeError(context.path, "number", value))
            return INVALID
        }

        return VALID(value)
    }

    public coerce(): this {
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
                context.addError(createTooBigError(value, max, options?.exclusive))
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            const isValid = options?.exclusive ? value > min : value >= min
            if (!isValid) {
                context.addError(createTooSmallError(value, min, options?.exclusive))
            }
        })
    }

    public negative() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value >= 0) {
                context.addError(createTooBigError(value, 0, false))
            }
        })
    }

    public nonnegative() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value < 0) {
                context.addError(createTooSmallError(value, 0, true))
            }
        })
    }

    public positive() {
        return addCheck(this, async (value: number, context: SchematicTestContext) => {
            if (value <= 0) {
                context.addError(createTooSmallError(value, 0, false))
            }
        })
    }
}
