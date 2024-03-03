import { SchematicParseError } from "./error"
import {
    CoerceSymbol,
    SchematicErrorType,
    TypeErrorSymbol,
    ValidationCheck,
    type AnySchematic,
    type Infer,
    type SchematicContext,
    type SchematicError,
    type SchematicOptions,
    type SchematicParseResult,
    INVALID
} from "./types"
import { addValidationCheck } from "./util"

/**
 * Base class for all Schematics
 */
export abstract class Schematic<T> {
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
    createTypeParseError(issue: SchematicError): SchematicParseResult<T> {
        let message = issue.message

        switch (issue.type) {
            case SchematicErrorType.InvalidType:
                message = this[TypeErrorSymbol] || message
                break
        }

        return INVALID([
            {
                ...issue,
                message
            }
        ])
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

    public optional() {
        if (this instanceof OptionalSchematic) {
            return this as OptionalSchematic<Schematic<T>>
        }
        return new OptionalSchematic<Schematic<T>>(this)
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
    constructor(readonly schematic: T) {
        super()
    }

    public async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Infer<T> | undefined>> {
        if (value === undefined) {
            return {
                isValid: true,
                value: undefined
            }
        }

        return this.schematic._parseType(value, context)
    }
}
