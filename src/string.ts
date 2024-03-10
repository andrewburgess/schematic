import {
    createInvalidExactValueError,
    createInvalidStringError,
    createInvalidTypeError,
    createTooBigError,
    createTooSmallError
} from "./error"
import { Schematic } from "./schematic"
import {
    Allowable,
    Coercable,
    Defaultable,
    INVALID,
    SchematicInput,
    SchematicOptions,
    SchematicParseReturnType,
    SchematicTestContext,
    VALID
} from "./types"
import { addCheck, addErrorToContext, clone, withAllow, withCoerce, withDefault } from "./util"

const EMAIL_REGEX =
    /^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

export class StringSchematic
    extends Schematic<string>
    implements Allowable<string>, Coercable, Defaultable<string>
{
    /** @internal */
    _allowed: string[] = []
    /** @internal */
    _coerce: boolean = false
    /** @internal */
    _defaultValue: string | (() => string) | undefined

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<string>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (typeof value === "undefined" && this._defaultValue !== undefined) {
            value =
                typeof this._defaultValue === "function" ? this._defaultValue() : this._defaultValue
        }

        if (typeof value !== "string" && this._coerce) {
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
            addErrorToContext(context, createInvalidTypeError(context.path, "string", value))
            return INVALID
        }

        return VALID(value)
    }

    allow(values: string | string[], message?: string | undefined): Schematic<string> {
        return withAllow(this, values, message)
    }

    public coerce(): this {
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
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            if (!value.endsWith(suffix)) {
                context.addError(
                    createInvalidStringError(
                        value,
                        options?.message ??
                            `Expected string to end with ${suffix} but received ${value}`
                    )
                )
            }
        })
    }

    public includes(substring: string, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            if (!value.includes(substring)) {
                context.addError(
                    createInvalidStringError(
                        value,
                        options?.message ??
                            `Expected string to include ${substring} but received ${value}`
                    )
                )
            }
        })
    }

    public length(length: number, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            if (value.length !== length) {
                context.addError(
                    createInvalidExactValueError(
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
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            const isValid = options?.exclusive ? value.length > min : value.length >= min
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected string with length more than ${min} but received string with length ${value.length}`
                    : `Expected string with length at least ${min} but received string with length ${value.length}`
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

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            const isValid = options?.exclusive ? value.length < max : value.length <= max
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected string with length less than ${max} but received string with length ${value.length}`
                    : `Expected string with length at most ${max} but received string with length ${value.length}`
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

    public regex(regex: RegExp, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            if (!regex.test(value)) {
                context.addError(
                    createInvalidStringError(
                        value,
                        options?.message ??
                            `Expected string to match ${regex} but received ${value}`
                    )
                )
            }
        })
    }

    public startsWith(prefix: string, options?: SchematicOptions) {
        return addCheck(this, async (value: string, context: SchematicTestContext) => {
            if (!value.startsWith(prefix)) {
                context.addError(
                    createInvalidStringError(
                        value,
                        options?.message ??
                            `Expected string to start with ${prefix} but received ${value}`
                    )
                )
            }
        })
    }

    public toLowerCase() {
        const cloned = clone(this)
        cloned._mutations.push((value) => value.toLowerCase())
        return cloned
    }

    public toUpperCase() {
        const cloned = clone(this)
        cloned._mutations.push((value) => value.toUpperCase())
        return cloned
    }

    public trim() {
        const cloned = clone(this)
        cloned._mutations.push((value) => value.trim())
        return cloned
    }
}
