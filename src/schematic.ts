import { addCheck, addErrorToContext, clone, mergeValues, SchematicInputChild } from "./util"
import {
    createInvalidExactValueError,
    createTooBigError,
    createTooSmallError,
    SchematicParseError
} from "./error"
import {
    DIRTY,
    INVALID,
    isDirty,
    isInvalid,
    isValid,
    OutputSymbol,
    SchematicErrorType,
    SchematicInput,
    SchematicParseReturnType,
    SchematicTestContext,
    SchematicTestError,
    TestCheck,
    TransformFn,
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
    /** @internal */
    protected typeErrorMessage?: string

    /**
     * @internal
     */
    _checks: Array<ValidationCheck<any>> = []

    /** @internal */
    _mutations: Array<TransformFn<Schematic<T>, T>> = []

    constructor(options?: SchematicOptions) {
        this.typeErrorMessage = options?.message
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

        for (const mutation of this._mutations) {
            const context = this._getContext(input)
            const transformed = await mutation(result.value, {
                addError: (error) => addErrorToContext(context, error),
                path: context.path
            })
            result = VALID(transformed)
        }

        let context: SchematicContext | undefined
        let dirty = false
        for (const check of this._checks) {
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

    public nullable(this: AnyValueSchematic): AnyValueSchematic
    public nullable(): NullableSchematic<this>
    public nullable(): any {
        if (this instanceof NullableSchematic) {
            const shape = this.shape
            return new NullableSchematic(clone(shape))
        }

        if (this instanceof AnyValueSchematic) {
            return clone(this)
        }

        return new NullableSchematic(clone(this))
    }

    public optional(this: AnyValueSchematic): AnyValueSchematic
    public optional(): OptionalSchematic<this>
    public optional(): any {
        if (this instanceof OptionalSchematic) {
            const shape = this.shape
            return new OptionalSchematic(clone(shape))
        }

        if (this instanceof AnyValueSchematic) {
            return clone(this)
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

    public test(
        check: TestCheck<T>,
        message?: string | SchematicTestError | ((arg: T) => SchematicTestError)
    ): this {
        const getErrorData = (value: T): SchematicTestError | undefined => {
            if (typeof message === "function") {
                return message(value)
            }

            if (typeof message === "string") {
                return {
                    message
                }
            }

            return message
        }

        return this.ensure(async (value, context) => {
            const result = await check(value)
            if (!result) {
                context.addError({
                    message: "Value did not pass test",
                    type: SchematicErrorType.ValidationError,
                    ...getErrorData(value)
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
    /** @internal */
    _any = true as const

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<any>> {
        return VALID(input.value)
    }
}

export class ArraySchematic<T extends AnySchematic> extends Schematic<Infer<T>[]> {
    /** @internal */
    _shape: T

    constructor(shape: T) {
        super()
        this._shape = shape
    }

    public get shape(): T {
        return this._shape
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
                return this.shape.runValidation(childContext)
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
    /** @internal */
    _leftSchema: T
    /** @internal */
    _rightSchema: U

    constructor(left: T, right: U) {
        super()

        this._leftSchema = left
        this._rightSchema = right
    }

    /** @internal */
    async _parse(
        input: SchematicInput
    ): Promise<SchematicParseReturnType<T[typeof OutputSymbol] & U[typeof OutputSymbol]>> {
        const context = this._getInputContext(input)
        const [left, right] = await Promise.all([
            this._leftSchema.runValidation({
                path: context.path,
                parent: context,
                value: context.data
            }),
            this._rightSchema.runValidation({
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
    /** @internal */
    _value: T

    constructor(value: T) {
        super()
        this._value = value
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<T>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (value !== this._value) {
            addErrorToContext(context, {
                type: SchematicErrorType.InvalidExactValue,
                expected: this._value,
                received: input.value
            })
            return INVALID
        }

        return VALID(this._value)
    }
}

export class NullableSchematic<T extends AnySchematic> extends Schematic<Infer<T> | null> {
    protected readonly _nullable = true as const
    /** @internal */
    _shape: T

    constructor(schematic: T) {
        super()

        this._shape = schematic
    }

    public get shape(): T {
        return this._shape
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<T> | null>> {
        if (input.value === null) {
            return VALID(null)
        }

        const shape = this.shape
        return shape._parse(input)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this.shape

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        const cloned = clone(shape) as unknown as T
        cloned._checks = [...cloned._checks, ...this._checks]

        return cloned
    }
}

export class OptionalSchematic<T extends AnySchematic> extends Schematic<Infer<T> | undefined> {
    protected readonly _optional = true as const
    /** @internal */
    _shape: T

    constructor(schematic: T) {
        super()

        this._shape = schematic
    }

    public get shape(): T {
        return this._shape
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<T> | undefined>> {
        const { value } = input
        if (value === undefined) {
            return VALID(undefined)
        }

        const shape = this.shape
        return shape._parse(input)
    }

    public required<T extends AnySchematic = this["shape"]>(): T {
        const shape = this.shape

        if (shape instanceof NullableSchematic || shape instanceof OptionalSchematic) {
            return shape.required()
        }

        const cloned = clone(shape) as unknown as T
        cloned._checks = [...cloned._checks, ...this._checks]

        return cloned
    }
}

export class PipedSchematic<
    TInput extends AnySchematic,
    TOutput extends AnySchematic
> extends Schematic<Infer<TOutput>> {
    /** @internal */
    _input: TInput
    /** @internal */
    _output: TOutput

    constructor(input: TInput, output: TOutput) {
        super()

        this._input = input
        this._output = output
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<Infer<TOutput>>> {
        const parsed = await this._input.runValidation(input)

        if (isInvalid(parsed)) {
            return INVALID
        }

        if (isDirty(parsed)) {
            return DIRTY(parsed.value)
        }

        return this._output.runValidation({
            value: parsed.value,
            path: input.path,
            parent: input.parent
        })
    }
}
export class TransformSchematic<TInput extends AnySchematic, TOutput> extends Schematic<TOutput> {
    /** @internal */
    _input: AnySchematic
    /** @internal */
    _transform: TransformFn<TInput, TOutput>

    constructor(schema: AnySchematic, transform: TransformFn<TInput, TOutput>) {
        super()

        this._input = schema
        this._transform = transform
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<TOutput>> {
        const context = this._getInputContext(input)
        const result = await this._input.runValidation(input)

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
        const transformed = await this._transform(result.value, transformContext)

        if (isDirty(result) || dirty) {
            return DIRTY(transformed)
        }

        return VALID(transformed)
    }
}

export class UnionSchematic<
    T extends Readonly<[AnySchematic, ...AnySchematic[]]>
> extends Schematic<T[number][typeof OutputSymbol]> {
    /** @internal */
    _schemas: T

    constructor(schemas: T) {
        super()

        this._schemas = schemas
    }

    /** @internal */
    async _parse(
        input: SchematicInput
    ): Promise<SchematicParseReturnType<T[number][typeof OutputSymbol]>> {
        const context = this._getInputContext(input)
        const results = await Promise.all(
            this._schemas.map((schema) => {
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
