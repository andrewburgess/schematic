import { createTooBigError, createTooSmallError } from "./error"
import { Schematic } from "./schematic"
import {
    Coercable,
    CoerceSymbol,
    DefaultValueSymbol,
    Defaultable,
    SchematicContext,
    SchematicOptions,
    SchematicParseResult
} from "./types"
import { addValidationCheck, withCoerce, withDefault } from "./util"

export class DateSchematic extends Schematic<Date> implements Coercable, Defaultable<Date> {
    [DefaultValueSymbol]: Date | (() => Date) | undefined

    /**
     * @internal
     */
    async _parseType(
        value: unknown = typeof this[DefaultValueSymbol] === "function"
            ? this[DefaultValueSymbol]()
            : this[DefaultValueSymbol],
        context: SchematicContext
    ): Promise<SchematicParseResult<Date>> {
        if (this[CoerceSymbol]) {
            if (!(value instanceof Date)) {
                value = new Date(value as any)
            }
        }

        if (!(value instanceof Date) || isNaN(value.getTime())) {
            return this.createTypeParseError(context.path, "Date", value)
        }

        return {
            isValid: true,
            value
        }
    }

    public coerce() {
        return withCoerce(this)
    }

    public default(defaultValue: Date | (() => Date)): DateSchematic {
        return withDefault(this, defaultValue)
    }

    public max(max: number | Date, options?: SchematicOptions & { exclusive?: boolean }) {
        const maxDate = max instanceof Date ? max : new Date(max)

        return addValidationCheck(this, async (value: Date, context: SchematicContext) => {
            const isValid = options?.exclusive
                ? value.getTime() < maxDate.getTime()
                : value.getTime() <= maxDate.getTime()
            if (!isValid) {
                context.addError(createTooBigError(context.path, value, max, options?.exclusive))
            }
        })
    }

    public min(min: number | Date, options?: SchematicOptions & { exclusive?: boolean }) {
        const minDate = min instanceof Date ? min : new Date(min)

        return addValidationCheck(this, async (value: Date, context: SchematicContext) => {
            const isValid = options?.exclusive
                ? value.getTime() > minDate.getTime()
                : value.getTime() >= minDate.getTime()
            if (!isValid) {
                context.addError(createTooSmallError(context.path, value, min, options?.exclusive))
            }
        })
    }
}
