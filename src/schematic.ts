import { addValidationCheck, clone } from "./util"
import {
    SchematicParseError,
    createInvalidExactValueError,
    createInvalidTypeError,
    createTooBigError,
    createTooSmallError
} from "./error"
import {
    CoerceSymbol,
    INVALID,
    OutputSymbol,
    ShapeSymbol,
    TypeErrorSymbol,
    ValidationCheck,
    type AnySchematic,
    type Infer,
    type SchematicContext,
    type SchematicError,
    type SchematicOptions,
    type SchematicParseResult
} from "./types"

/**
 * Base class for all Schematics
 */
export abstract class Schematic<T> {
    /**
     * @internal
     */
    public readonly [OutputSymbol]!: T
    protected [CoerceSymbol]?: boolean
    protected [TypeErrorSymbol]?: string

    /**
     * @internal
     */
    validationChecks: Array<ValidationCheck<T>> = []

    constructor(options?: SchematicOptions) {
        this[CoerceSymbol] = options?.coerce
        this[TypeErrorSymbol] = options?.message
    }

    /**
     * @internal
     */
    createTypeParseError(
        path: (string | number)[],
        type: string,
        received: any,
        message?: string
    ): SchematicParseResult<T> {
        message = message ?? this[TypeErrorSymbol]

        if (!message && typeof received === "undefined") {
            message = path.length > 0 ? `"${path.join(".")}" is required` : "Required"
        }

        return INVALID(createInvalidTypeError(path, type, received, message))
    }

    /**
     * Internal method to parse a value into the type T
     * @param value The value to parse
     * @param context Context of the parsing
     * @internal
     * @returns The result of the parsing
     */
    abstract _parseType(value: unknown, context: SchematicContext): Promise<SchematicParseResult<T>>

    /**
     * @internal
     */
    async runValidation(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<T>> {
        let result = await this._parseType(value, context)

        if (!result.isValid) {
            return result
        }

        for (const check of this.validationChecks) {
            await check(result.value, context)
        }

        if (context.errors.length > 0) {
            return INVALID(context.errors)
        }

        return result
    }

    public array<T extends AnySchematic>(): ArraySchematic<T> {
        const cloned = clone(this)
        if (cloned instanceof ArraySchematic) {
            return this as unknown as ArraySchematic<T>
        }

        return new ArraySchematic(cloned) as unknown as ArraySchematic<T>
    }

    public ensure(check: ValidationCheck<T>): this {
        return addValidationCheck(this, check)
    }

    optional(): OptionalSchematic<this> {
        const cloned = clone(this)

        if (cloned instanceof OptionalSchematic) {
            return cloned
        }

        return new OptionalSchematic(cloned)
    }

    /**
     * Parse and validate an unknown type into the type T
     * @param value The value to parse
     * @returns The parsed value
     */
    public async parse(value: unknown): Promise<T> {
        const context: SchematicContext = {
            addError: function (error: SchematicError) {
                this.errors.push(error)
            },
            data: value,
            errors: [],
            path: [],
            parent: null
        }

        let result = await this.runValidation(value, context)

        if (result.isValid) {
            return result.value
        }

        throw new SchematicParseError(result.errors)
    }
}

export class ArraySchematic<T extends AnySchematic> extends Schematic<Infer<T>[]> {
    public [ShapeSymbol]: T

    constructor(shape: T) {
        super()
        this[ShapeSymbol] = shape
    }

    async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T>[]>> {
        if (typeof value !== "object" || !Array.isArray(value)) {
            return this.createTypeParseError(context.path, "array", value)
        }

        const errors: SchematicError[] = []
        let valid = true

        const result: any[] = []

        for (let i = 0; i < value.length; i++) {
            const item = value[i]
            const childContext: SchematicContext = {
                addError: function (error) {
                    this.errors.push(error)
                },
                data: item,
                errors: [],
                path: [...context.path, i],
                parent: context
            }

            const parsed = await this[ShapeSymbol].runValidation(item, childContext)
            if (parsed.isValid) {
                result.push(parsed.value)
            } else {
                valid = false
                errors.push(...parsed.errors)
            }
        }

        if (!valid) {
            return { isValid: false, errors }
        }

        return { isValid: true, value: result }
    }

    public length(length: number, options?: SchematicOptions) {
        return addValidationCheck(this, async (value: Infer<T>[], context: SchematicContext) => {
            if (value.length !== length) {
                const defaultMessage = `Expected array with exactly ${length} elements but received ${value.length}`
                context.addError(
                    createInvalidExactValueError(
                        context.path,
                        value,
                        length,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: Infer<T>[], context: SchematicContext) => {
            const isValid = options?.exclusive ? value.length > min : value.length >= min
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected more than ${min} element${min === 1 ? "" : "s"} but received ${value.length}`
                    : `Expected at least ${min} element${min === 1 ? "" : "s"} but received ${value.length}`
                context.addError(
                    createTooSmallError(
                        context.path,
                        value.length,
                        min,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public max(max: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addValidationCheck(this, async (value: Infer<T>[], context: SchematicContext) => {
            const isValid = options?.exclusive ? value.length < max : value.length <= max
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected array with less than ${max} element${max === 1 ? "" : "s"} but received ${value.length}`
                    : `Expected array with at most ${max} element${max === 1 ? "" : "s"} but received ${value.length}`

                context.addError(
                    createTooBigError(
                        context.path,
                        value.length,
                        max,
                        options?.exclusive,
                        options?.message ?? defaultMessage
                    )
                )
            }
        })
    }

    public nonempty(options?: SchematicOptions) {
        return this.min(1, options)
    }
}

export class OptionalSchematic<T extends AnySchematic> extends Schematic<Infer<T> | undefined> {
    public readonly [ShapeSymbol]: T

    constructor(readonly schematic: T) {
        super()

        this[ShapeSymbol] = schematic
    }

    /**
     * @internal
     */
    async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | undefined>> {
        if (value === undefined) {
            return {
                isValid: true,
                value: undefined
            }
        }

        return this[ShapeSymbol]._parseType(value, context)
    }

    public required<T extends AnySchematic = this[typeof ShapeSymbol]>(): T {
        return this[ShapeSymbol] as unknown as T
    }
}
