import { Schematic } from "./schematic"
import {
    AnySchematic,
    KeySchemaSymbol,
    SchematicContext,
    SchematicError,
    SchematicOptions,
    SchematicParseResult,
    ValueSchemaSymbol
} from "./types"

export class RecordSchematic<TKeySchema extends AnySchematic, TValue = any> extends Schematic<
    Record<string | number, TValue>
> {
    protected [KeySchemaSymbol]: TKeySchema
    protected [ValueSchemaSymbol]: Schematic<TValue>

    constructor(keySchema: TKeySchema, valueSchema: Schematic<TValue>, options?: SchematicOptions) {
        super(options)

        this[KeySchemaSymbol] = keySchema
        this[ValueSchemaSymbol] = valueSchema
    }

    /**
     * @internal
     */
    async _parse(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<Record<string | number, TValue>>> {
        if (typeof value !== "object" || value === null) {
            return this._createTypeParseError(context.path, "object", value)
        }

        const errors: SchematicError[] = []
        let valid = true

        const result: Record<string | number, TValue> = {} as Record<string | number, TValue>
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

            result[keyResult.value as any] = valueResult.value
        }

        if (!valid) {
            return {
                errors,
                isValid: false
            }
        }

        return {
            isValid: true,
            value: value as Record<string | number, TValue>
        }
    }
}
