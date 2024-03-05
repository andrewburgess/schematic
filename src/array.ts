import { createInvalidExactValueError, createTooBigError, createTooSmallError } from "./error"
import { Schematic } from "./schematic"
import {
    AnySchematic,
    Infer,
    SchematicContext,
    SchematicError,
    SchematicOptions,
    SchematicParseResult,
    ShapeSymbol
} from "./types"
import { addValidationCheck } from "./util"

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
