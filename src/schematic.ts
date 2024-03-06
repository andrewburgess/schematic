import { addCheck, clone, mergeValues } from "./util"
import {
    createInvalidExactValueError,
    createInvalidTypeError,
    createTooBigError,
    createTooSmallError,
    SchematicParseError
} from "./error"
import {
    CoerceSymbol,
    INVALID,
    OutputSymbol,
    ShapeSymbol,
    SchematicErrorType,
    TestCheck,
    TransformFn,
    TypeErrorSymbol,
    ValidationCheck,
    type AnySchematic,
    type Infer,
    type SchematicContext,
    type SchematicError,
    type SchematicOptions,
    type SchematicParseResult,
    VALID,
    SchematicTestContext
} from "./types"

/**
 * Base class for all Schematics
 */
export abstract class Schematic<T> {
    public readonly [OutputSymbol]!: T
    protected [CoerceSymbol]?: boolean
    protected [TypeErrorSymbol]?: string

    /**
     * @internal
     */
    checks: Array<ValidationCheck<any>> = []

    constructor(options?: SchematicOptions) {
        this[CoerceSymbol] = options?.coerce
        this[TypeErrorSymbol] = options?.message
    }

    /**
     * @internal
     */
    protected _createTypeParseError(
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
    abstract _parse(value: unknown, context: SchematicContext): Promise<SchematicParseResult<T>>

    /**
     * @internal
     */
    async runValidation(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<T>> {
        let result = await this._parse(value, context)

        if (!result.isValid) {
            return result
        }

        for (const check of this.checks) {
            await check(result.value, context)
        }

        if (context.errors.length > 0) {
            return INVALID(context.errors)
        }

        return result
    }

    public and<T extends AnySchematic>(schema: T): IntersectionSchematic<this, T> {
        return new IntersectionSchematic(clone(this), clone(schema))
    }

    public array<T extends AnySchematic = this>(): ArraySchematic<T> {
        const cloned = clone(this)
        if (cloned instanceof ArraySchematic) {
            return this as unknown as ArraySchematic<T>
        }

        return new ArraySchematic(cloned) as unknown as ArraySchematic<T>
    }

    public ensure(check: ValidationCheck<T>): this {
        return addCheck(this, check)
    }

    public nullable(): NullableSchematic<this> {
        const cloned = clone(this)

        if (cloned instanceof NullableSchematic) {
            return cloned
        }

        return new NullableSchematic(cloned)
    }

    public optional(): OptionalSchematic<this> {
        const cloned = clone(this)

        if (cloned instanceof OptionalSchematic) {
            return cloned
        }

        return new OptionalSchematic(cloned)
    }

    public or<T extends AnySchematic>(schema: T): UnionSchematic<[this, T]> {
        return new UnionSchematic([clone(this), clone(schema)])
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

    public async safeParse(value: unknown): Promise<SchematicParseResult<T>> {
        try {
            const result = await this.parse(value)
            return VALID(result)
        } catch (error) {
            if (error instanceof SchematicParseError) {
                return INVALID(error.errors)
            }

            throw error
        }
    }

    /**
     * Allows taking the result of an input schematic and piping it through a new schematic
     * to run additional validation
     * @param targetSchema New schema to use for validation
     * @returns Piped schematic
     */
    public pipe<TOutput extends AnySchematic>(
        targetSchema: TOutput
    ): PipedSchematic<typeof this, TOutput> {
        return new PipedSchematic(this, targetSchema)
    }

    public test(check: TestCheck<T>, message?: string): this {
        return addCheck(this, async (value: T, context: SchematicTestContext) => {
            const result = await check(value)
            if (!result) {
                context.addError({
                    message: message ?? "Value did not pass test",
                    path: context.path,
                    type: SchematicErrorType.ValidationError
                })
            }
        })
    }

    /**
     * Transforms an input value into a new output value
     * @param fn Function to transform the input value to a new output value
     * @returns Transformation schematic
     */
    public transform<TSchematic = this, TOutput = any>(
        fn: TransformFn<TSchematic, TOutput>
    ): Schematic<TOutput> {
        return new TransformSchematic(this, fn)
    }
}

export class AnyValueSchematic extends Schematic<any> {
    protected readonly _any = true as const

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<unknown>> {
        return VALID(value)
    }
}

export class ArraySchematic<T extends AnySchematic> extends Schematic<Infer<T>[]> {
    /**
     * @internal
     */
    public [ShapeSymbol]: T

    constructor(shape: T) {
        super()
        this[ShapeSymbol] = shape
    }

    public get shape(): T {
        return this[ShapeSymbol]
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T>[]>> {
        if (typeof value !== "object" || !Array.isArray(value)) {
            return this._createTypeParseError(context.path, "array", value)
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
        return addCheck(this, async (value: Infer<T>[], context: SchematicTestContext) => {
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
        return addCheck(this, async (value: Infer<T>[], context: SchematicTestContext) => {
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
        return addCheck(this, async (value: Infer<T>[], context: SchematicTestContext) => {
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

export class IntersectionSchematic<
    T extends AnySchematic,
    U extends AnySchematic
> extends Schematic<T[typeof OutputSymbol] & U[typeof OutputSymbol]> {
    private readonly leftSchema: T
    private readonly rightSchema: U

    constructor(left: T, right: U) {
        super()

        this.leftSchema = left
        this.rightSchema = right
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<T[typeof OutputSymbol] & U[typeof OutputSymbol]>> {
        const leftContext: SchematicContext = {
            addError: function (error) {
                this.errors.push(error)
            },
            data: value,
            errors: [],
            path: context.path,
            parent: context
        }

        const rightContext: SchematicContext = {
            addError: function (error) {
                this.errors.push(error)
            },
            data: value,
            errors: [],
            path: context.path,
            parent: context
        }

        const [left, right] = await Promise.all([
            this.leftSchema.runValidation(value, leftContext),
            this.rightSchema.runValidation(value, rightContext)
        ])

        if (!left.isValid || !right.isValid) {
            const intersectionErrors = [left, right].flatMap((result) =>
                result.isValid ? [] : result.errors
            )
            return INVALID(intersectionErrors)
        }

        const merged = mergeValues(left.value, right.value, context)
        if (!merged.isValid) {
            return INVALID(merged.errors)
        }

        return merged
    }
}

export class LiteralSchematic<T extends string | number | boolean> extends Schematic<T> {
    private readonly value: T

    constructor(value: T) {
        super()
        this.value = value
    }

    /**
     * @internal
     */
    async _parse(value: unknown, context: SchematicContext): Promise<SchematicParseResult<T>> {
        if (value !== this.value) {
            return INVALID(createInvalidExactValueError(context.path, value, this.value))
        }

        return {
            isValid: true,
            value: this.value
        }
    }
}

export class NullableSchematic<T extends AnySchematic> extends Schematic<Infer<T> | null> {
    protected readonly _nullable = true as const
    public readonly [ShapeSymbol]: T

    constructor(schematic: T) {
        super()

        this[ShapeSymbol] = schematic
    }

    public get shape(): T {
        return this[ShapeSymbol]
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | null>> {
        if (value === null) {
            return {
                isValid: true,
                value: null
            }
        }

        return this[ShapeSymbol]._parse(value, context)
    }

    async runValidation(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | null>> {
        if (value === null) {
            return {
                isValid: true,
                value: null
            }
        }

        if (value === undefined && !(this[ShapeSymbol] instanceof OptionalSchematic)) {
            return this._createTypeParseError(context.path, "nullable", value)
        }

        return this[ShapeSymbol].runValidation(value, context)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this[ShapeSymbol]

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        return this[ShapeSymbol] as unknown as T
    }
}

export class OptionalSchematic<T extends AnySchematic> extends Schematic<Infer<T> | undefined> {
    protected readonly _optional = true as const
    /**
     * @internal
     */
    public readonly [ShapeSymbol]: T

    constructor(schematic: T) {
        super()

        this[ShapeSymbol] = schematic
    }

    public get shape(): T {
        return this[ShapeSymbol]
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | undefined>> {
        if (value === undefined) {
            return {
                isValid: true,
                value: undefined
            }
        }

        return this[ShapeSymbol]._parse(value, context)
    }

    async runValidation(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | undefined>> {
        if (value === undefined) {
            return {
                isValid: true,
                value: undefined
            }
        }

        return this[ShapeSymbol].runValidation(value, context)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this[ShapeSymbol]

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        return this[ShapeSymbol] as unknown as T
    }
}

export class PipedSchematic<
    TInput extends AnySchematic,
    TOutput extends AnySchematic
> extends Schematic<Infer<TOutput>> {
    private readonly inputSchema: TInput
    private readonly outputSchema: TOutput

    constructor(input: TInput, output: TOutput) {
        super()

        this.inputSchema = input
        this.outputSchema = output
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<TOutput>>> {
        const parsed = await this.inputSchema.runValidation(value, context)

        if (!parsed.isValid) {
            return INVALID(parsed.errors)
        }

        return this.outputSchema.runValidation(parsed.value, context)
    }
}
export class TransformSchematic<TInput extends AnySchematic, TOutput> extends Schematic<TOutput> {
    private readonly schema: AnySchematic
    private readonly transformFn: TransformFn<TInput, TOutput>

    constructor(schema: AnySchematic, transform: TransformFn<TInput, TOutput>) {
        super()

        this.schema = schema
        this.transformFn = transform
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<TOutput>> {
        const childContext: SchematicContext = {
            addError: function (error) {
                this.errors.push(error)
            },
            data: value,
            errors: [],
            path: context.path,
            parent: context
        }

        const result = await this.schema.runValidation(value, childContext)

        if (!result.isValid) {
            return result
        }

        const transformed = await this.transformFn(result.value, childContext)
        if (childContext.errors.length > 0) {
            return INVALID(childContext.errors)
        }

        return {
            isValid: true,
            value: transformed
        }
    }
}

export class UnionSchematic<
    T extends Readonly<[AnySchematic, ...AnySchematic[]]>
> extends Schematic<T[number][typeof OutputSymbol]> {
    /**
     * @internal
     */
    private readonly schemas: T

    constructor(schemas: T) {
        super()

        this.schemas = schemas
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<T[number][typeof OutputSymbol]>> {
        const results = await Promise.all(
            this.schemas.map((schema) => {
                const childContext: SchematicContext = {
                    addError: function (error) {
                        this.errors.push(error)
                    },
                    data: value,
                    errors: [],
                    path: context.path,
                    parent: context
                }
                return schema.runValidation(value, childContext)
            })
        )

        for (const result of results) {
            if (result.isValid) {
                return result
            }
        }

        const unionErrors = results.flatMap((result) => (result.isValid ? [] : result.errors))

        return INVALID([
            {
                message: this[TypeErrorSymbol] ?? "Value did not match any types",
                path: context.path,
                received: value,
                type: SchematicErrorType.InvalidUnion
            },
            ...unionErrors
        ])
    }
}
