import { addCheck, addErrorToContext, clone, mergeValues } from "./util"
import {
    createInvalidExactValueError,
    createTooBigError,
    createTooSmallError,
    SchematicParseError
} from "./error"
import {
    CoerceSymbol,
    DIRTY,
    INVALID,
    isDirty,
    isInvalid,
    isValid,
    OutputSymbol,
    SchematicErrorType,
    SchematicInput,
    SchematicInputChild,
    SchematicParseReturnType,
    SchematicTestContext,
    ShapeSymbol,
    TestCheck,
    TransformFn,
    TypeErrorSymbol,
    VALID,
    ValidationCheck,
    type AnySchematic,
    type Infer,
    type SchematicContext,
    type SchematicError,
    type SchematicOptions
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
    protected _getContext(
        input: SchematicInput,
        context?: SchematicContext | null
    ): SchematicContext {
        return (
            context ?? {
                data: input.value,
                parent: input.parent,
                path: input.path,
                root: input.parent.root
            }
        )
    }

    /**
     * @interal
     */
    protected _getInputContext(input: SchematicInput): SchematicContext {
        return {
            data: input.value,
            path: input.path,
            parent: input.parent,
            root: input.parent.root
        }
    }

    /**
     * Internal method to parse a value into the type T
     * @param input Input context to use for parsing
     * @internal
     * @returns The result of the parsing
     */
    abstract _parse(input: SchematicInput): Promise<SchematicParseReturnType<T>>

    /**
     * @internal
     */
    async runValidation(input: SchematicInput): Promise<SchematicParseReturnType<T>> {
        let result = await this._parse(input)

        if (isInvalid(result)) {
            return result
        }

        let context: SchematicContext | undefined
        let dirty = false
        for (const check of this.checks) {
            context = this._getContext(input, context)
            const checkContext: SchematicTestContext = {
                addError: (error) => {
                    addErrorToContext(context!, error)
                    dirty = true
                },
                get path() {
                    return context!.path
                }
            }
            await check(result.value, checkContext)
        }

        if (isDirty(result) || dirty) {
            return DIRTY(result.value)
        }

        return VALID(result.value)
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
        if (this instanceof NullableSchematic) {
            const shape = this[ShapeSymbol]
            return new NullableSchematic(clone(shape))
        }

        return new NullableSchematic(clone(this))
    }

    public optional(): OptionalSchematic<this> {
        if (this instanceof OptionalSchematic) {
            const shape = this[ShapeSymbol]
            return new OptionalSchematic(clone(shape))
        }

        return new OptionalSchematic(clone(this))
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
            data: value,
            path: [],
            parent: null,
            root: {
                errors: []
            }
        }

        let result = await this.runValidation({ value, path: context.path, parent: context })

        if (isValid(result)) {
            return result.value
        }

        throw new SchematicParseError(context.root.errors)
    }

    public async safeParse(
        value: unknown
    ): Promise<{ isValid: true; value: T } | { isValid: false; errors: SchematicError[] }> {
        try {
            const result = await this.parse(value)
            return {
                isValid: true,
                value: result
            }
        } catch (error) {
            if (error instanceof SchematicParseError) {
                return {
                    isValid: false,
                    errors: error.errors
                }
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
        return this.ensure(async (value, context) => {
            const result = await check(value)
            if (!result) {
                context.addError({
                    message: message ?? "Value did not pass test",
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<any>> {
        return VALID(input.value)
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<T>[]>> {
        const context = this._getInputContext(input)
        let value = context.data
        if (typeof value !== "object" || !Array.isArray(value)) {
            addErrorToContext(context, {
                type: SchematicErrorType.InvalidType,
                expected: "array",
                received: value
            })

            return INVALID
        }

        const results = await Promise.all(
            ([...context.data] as any[]).map((item, i) => {
                const childContext = new SchematicInputChild(context, item, context.path, i)
                return this[ShapeSymbol].runValidation(childContext)
            })
        )

        const parsed: Infer<T>[] = []
        let valid = true
        for (const result of results) {
            if (isInvalid(result)) {
                return INVALID
            }

            if (isDirty(result)) {
                valid = false
            }

            parsed.push(result.value)
        }

        if (!valid) {
            return DIRTY(parsed)
        }

        return VALID(parsed)
    }

    public length(length: number, options?: SchematicOptions) {
        return addCheck(this, async (value: Infer<T>[], context) => {
            if (value.length !== length) {
                const defaultMessage = `Expected array with exactly ${length} elements but received ${value.length}`
                context.addError(
                    createInvalidExactValueError(value, length, options?.message ?? defaultMessage)
                )
            }
        })
    }

    public min(min: number, options?: SchematicOptions & { exclusive?: boolean }) {
        return addCheck(this, async (value: Infer<T>[], context) => {
            const isValid = options?.exclusive ? value.length > min : value.length >= min
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected more than ${min} element${min === 1 ? "" : "s"} but received ${value.length}`
                    : `Expected at least ${min} element${min === 1 ? "" : "s"} but received ${value.length}`
                context.addError(
                    createTooSmallError(
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
        return addCheck(this, async (value: Infer<T>[], context) => {
            const isValid = options?.exclusive ? value.length < max : value.length <= max
            if (!isValid) {
                const defaultMessage = options?.exclusive
                    ? `Expected array with less than ${max} element${max === 1 ? "" : "s"} but received ${value.length}`
                    : `Expected array with at most ${max} element${max === 1 ? "" : "s"} but received ${value.length}`

                context.addError(
                    createTooBigError(
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
        input: SchematicInput
    ): Promise<SchematicParseReturnType<T[typeof OutputSymbol] & U[typeof OutputSymbol]>> {
        const context = this._getInputContext(input)
        const [left, right] = await Promise.all([
            this.leftSchema.runValidation({
                path: context.path,
                parent: context,
                value: context.data
            }),
            this.rightSchema.runValidation({
                path: context.path,
                parent: context,
                value: context.data
            })
        ])

        if (isInvalid(left) || isInvalid(right)) {
            return INVALID
        }

        const merged = mergeValues(left.value, right.value)
        if (!merged.isValid) {
            addErrorToContext(context, {
                received: input.value,
                type: SchematicErrorType.InvalidIntersection
            })

            return INVALID
        }

        if (isDirty(left) || isDirty(right)) {
            return DIRTY(merged.value)
        }

        return VALID(merged.value)
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<T>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (value !== this.value) {
            addErrorToContext(context, {
                type: SchematicErrorType.InvalidExactValue,
                expected: this.value,
                received: input.value
            })
            return INVALID
        }

        return VALID(this.value)
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<T> | null>> {
        if (input.value === null) {
            return VALID(null)
        }

        const shape = this[ShapeSymbol]
        return shape._parse(input)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this[ShapeSymbol]

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        const cloned = clone(shape) as unknown as T
        cloned.checks = [...cloned.checks, ...this.checks]

        return cloned
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<T> | undefined>> {
        const { value } = input
        if (value === undefined) {
            return VALID(undefined)
        }

        const shape = this[ShapeSymbol]
        return shape._parse(input)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this[ShapeSymbol]

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        const cloned = clone(shape) as unknown as T
        cloned.checks = [...cloned.checks, ...this.checks]

        return cloned
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<TOutput>>> {
        const parsed = await this.inputSchema.runValidation(input)

        if (isInvalid(parsed)) {
            return INVALID
        }

        if (isDirty(parsed)) {
            return DIRTY(parsed.value)
        }

        return this.outputSchema.runValidation({
            value: parsed.value,
            path: input.path,
            parent: input.parent
        })
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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<TOutput>> {
        const context = this._getInputContext(input)
        const result = await this.schema.runValidation(input)

        if (isInvalid(result)) {
            return result
        }

        let dirty = false
        const transformContext: SchematicTestContext = {
            addError: (error) => {
                addErrorToContext(context, error)
                dirty = true
            },
            get path() {
                return context.path
            }
        }
        const transformed = await this.transformFn(result.value, transformContext)

        if (isDirty(result) || dirty) {
            return DIRTY(transformed)
        }

        return VALID(transformed)
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
        input: SchematicInput
    ): Promise<SchematicParseReturnType<T[number][typeof OutputSymbol]>> {
        const context = this._getInputContext(input)
        const results = await Promise.all(
            this.schemas.map((schema) => {
                const childContext: SchematicContext = {
                    ...context,
                    parent: null,
                    root: {
                        ...context.root,
                        errors: []
                    }
                }
                return schema
                    .runValidation({
                        value: context.data,
                        path: context.path,
                        parent: childContext
                    })
                    .then((result) => ({
                        result,
                        context: childContext
                    }))
            })
        )

        for (const result of results) {
            if (isValid(result.result)) {
                return result.result
            }
        }

        for (const result of results) {
            if (isDirty(result.result)) {
                context.root.errors.push(...result.context.root.errors)
                return result.result
            }
        }

        const unionErrors = results.flatMap((result) => result.context.root.errors)
        addErrorToContext(context, {
            message: "Value did not match any types",
            received: input.value,
            unionErrors,
            type: SchematicErrorType.InvalidUnion
        })

        return INVALID
    }
}
