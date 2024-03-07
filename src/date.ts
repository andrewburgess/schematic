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

export class DateSchematic extends Schematic<Date> implements Coercable, Defaultable<Date> {
    /** @internal */
    _coerce: boolean = false
    /** @internal */
    _defaultValue: Date | (() => Date) | undefined

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Date>> {
        const context = this._getInputContext(input)
        let value = context.data
        if (typeof value === "undefined" && this._defaultValue !== undefined) {
            value =
                typeof this._defaultValue === "function" ? this._defaultValue() : this._defaultValue
        }
        if (value === null || value === undefined) {
            addErrorToContext(context, createInvalidTypeError(context.path, "Date", value))
            return INVALID
        }

        if (this._coerce) {
            if (
                (!(value instanceof Date) && typeof value === "string") ||
                typeof value === "number"
            ) {
                value = new Date(value as any)
            }
        }

        if (!(value instanceof Date) || isNaN(value.getTime())) {
            addErrorToContext(context, createInvalidTypeError(context.path, "Date", value))
            return INVALID
        }

        return VALID(value)
    }

    public coerce(): this {
        return withCoerce(this)
    }

    public default(defaultValue: Date | (() => Date)): DateSchematic {
        return withDefault(this, defaultValue)
    }

    public max(max: number | Date, options?: SchematicOptions & { exclusive?: boolean }) {
        const maxDate = max instanceof Date ? max : new Date(max)

        return addCheck(this, async (value: Date, context) => {
            const isValid = options?.exclusive
                ? value.getTime() < maxDate.getTime()
                : value.getTime() <= maxDate.getTime()
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected Date before ${maxDate.toISOString()} but received ${value.toISOString()}`
                    : `Expected Date before or on ${maxDate.toISOString()} but received ${value.toISOString()}`
                context.addError(
                    createTooBigError(
                        value,
                        max,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public min(min: number | Date, options?: SchematicOptions & { exclusive?: boolean }) {
        const minDate = min instanceof Date ? min : new Date(min)

        return addCheck(this, async (value: Date, context: SchematicTestContext) => {
            const isValid = options?.exclusive
                ? value.getTime() > minDate.getTime()
                : value.getTime() >= minDate.getTime()
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected Date after ${minDate.toISOString()} but received ${value.toISOString()}`
                    : `Expected Date on or after ${minDate.toISOString()} but received ${value.toISOString()}`
                context.addError(
                    createTooSmallError(
                        value,
                        min,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }
}
