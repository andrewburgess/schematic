import { addValidationCheck, clone } from "./util"
import { SchematicParseError, createInvalidTypeError } from "./error"
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
