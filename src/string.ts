import {
    createInvalidExactValueError,
    createInvalidStringError,
    createTooBigError,
    createTooSmallError
} from "./error"
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
import { addCheck, withCoerce, withDefault } from "./util"

const EMAIL_REGEX =
    /^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

export class StringSchematic extends Schematic<string> implements Coercable, Defaultable<string> {
    /**
     * @internal
     */
    [DefaultValueSymbol]: string | (() => string) | undefined

    /**
     * @internal
     */
    public async _parse(
        value: unknown = typeof this[DefaultValueSymbol] === "function"
            ? this[DefaultValueSymbol]()
            : this[DefaultValueSymbol],
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

    public email(options?: SchematicOptions) {
        return this.regex(EMAIL_REGEX, {
            ...options,
            message: options?.message ?? "Expected string to be a valid email address"
        })
    }

    public endsWith(suffix: string, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
            if (!value.endsWith(suffix)) {
                context.addError(
                    createInvalidStringError(
                        context.path,
                        value,
                        options?.message ??
                            `Expected string to end with ${suffix} but received ${value}`
                    )
                )
            }
        })
    }

    public includes(substring: string, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
            if (!value.includes(substring)) {
                context.addError(
                    createInvalidStringError(
                        context.path,
                        value,
                        options?.message ??
                            `Expected string to include ${substring} but received ${value}`
                    )
                )
            }
        })
    }

    public length(length: number, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
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
        return addCheck(this, async (value: string, context: SchematicContext) => {
            const isValid = options?.exclusive ? value.length > min : value.length >= min
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected string with length more than ${min} but received string with length ${value.length}`
                    : `Expected string with length at least ${min} but received string with length ${value.length}`
                context.addError(
                    createTooSmallError(
                        context.path,
                        value,
                        min,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
            const isValid = options?.exclusive ? value.length < max : value.length <= max
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected string with length less than ${max} but received string with length ${value.length}`
                    : `Expected string with length at most ${max} but received string with length ${value.length}`
                context.addError(
                    createTooBigError(
                        context.path,
                        value,
                        max,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public regex(regex: RegExp, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
            if (!regex.test(value)) {
                context.addError(
                    createInvalidStringError(
                        context.path,
                        value,
                        options?.message ??
                            `Expected string to match ${regex} but received ${value}`
                    )
                )
            }
        })
    }

    public startsWith(prefix: string, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicContext) => {
            if (!value.startsWith(prefix)) {
                context.addError(
                    createInvalidStringError(
                        context.path,
                        value,
                        options?.message ??
                            `Expected string to start with ${prefix} but received ${value}`
                    )
                )
            }
        })
    }
}
