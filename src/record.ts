import { Schematic } from "./schematic"
import {
    KeySchemaSymbol,
    SchematicContext,
    SchematicError,
    SchematicOptions,
    SchematicParseResult,
    ValueSchemaSymbol
} from "./types"

export class RecordSchematic<TKey extends string | number = string, TValue = any> extends Schematic<
    Record<TKey, TValue>
> {
    protected [KeySchemaSymbol]: Schematic<TKey>
    protected [ValueSchemaSymbol]: Schematic<TValue>

    constructor(
        keySchema: Schematic<TKey>,
        valueSchema: Schematic<TValue>,
        options?: SchematicOptions
    ) {
        super(options)

        this[KeySchemaSymbol] = keySchema
        this[ValueSchemaSymbol] = valueSchema
    }

    /**
     * @internal
     */
    async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Record<TKey, TValue>>> {
        if (typeof value !== "object" || value === null) {
            return this.createTypeParseError(context.path, "object", value)
        }

        const errors: SchematicError[] = []
        let valid = true

        const result: Record<TKey, TValue> = {} as Record<TKey, TValue>
        const keys = Object.keys(value)

        for (const key of keys) {
            const childContext: SchematicContext = {
                addError: function (error) {
                    this.errors.push(error)
                },
                data: value,
                errors: [],
                path: context.path.concat(key),
                parent: context
            }

            const keyResult = await this[KeySchemaSymbol].runValidation(key, childContext)
            if (!keyResult.isValid) {
                valid = false
                errors.push(...keyResult.errors)
                continue
            }

            const valueResult = await this[ValueSchemaSymbol].runValidation(
                (value as any)[key],
                childContext
            )
            if (!valueResult.isValid) {
                valid = false
                errors.push(...valueResult.errors)
                continue
            }

            result[keyResult.value] = valueResult.value
        }

        if (!valid) {
            return {
                errors,
                isValid: false
            }
        }

        return {
            isValid: true,
            value: value as Record<TKey, TValue>
        }
    }
}
