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

export class DateSchematic extends Schematic<Date> implements Coercable, Defaultable<Date> {
    defaultValue: Date | (() => Date) | undefined

    async _parseType(
        value: unknown = typeof this.defaultValue === "function"
            ? this.defaultValue()
            : this.defaultValue,
        context: SchematicContext
    ): Promise<SchematicParseResult<Date>> {
        if (this[CoerceSymbol]) {
            if (!(value instanceof Date)) {
                value = new Date(value as any)
            }
        }

        if (!(value instanceof Date) || isNaN(value.getTime())) {
            return this.createTypeParseError({
                message: `Expected Date but received ${typeof value}`,
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
                let message = options?.message
                if (!message) {
                    if (options?.exclusive) {
                        message = `Expected Date less than ${maxDate.toISOString()} but received ${value.toISOString()}`
                    } else {
                        message = `Expected Date less than or equal to ${maxDate.toISOString()} but received ${value.toISOString()}`
                    }
                }
                return {
                    message,
                    max: maxDate,
                    path: context.path,
                    received: value,
                    type: SchematicErrorType.TooBig
                }
            }

            return null
        })
    }

    public min(min: number | Date, options?: SchematicOptions & { exclusive?: boolean }) {
        const minDate = min instanceof Date ? min : new Date(min)

        return addValidationCheck(this, async (value: Date, context: SchematicContext) => {
            const isValid = options?.exclusive
                ? value.getTime() > minDate.getTime()
                : value.getTime() >= minDate.getTime()
            if (!isValid) {
                let message = options?.message
                if (!message) {
                    if (options?.exclusive) {
                        message = `Expected Date greater than ${minDate.toISOString()} but received ${value.toISOString()}`
                    } else {
                        message = `Expected Date greater than or equal to ${minDate.toISOString()} but received ${value.toISOString()}`
                    }
                }
                return {
                    message,
                    min: minDate,
                    path: context.path,
                    received: value,
                    type: SchematicErrorType.TooSmall
                }
            }

            return null
        })
    }
}
