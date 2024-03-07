import { addErrorToContext } from "./util"
import { createInvalidTypeError } from "./error"
import { Schematic } from "./schematic"
import {
    AnySchematic,
    DIRTY,
    INVALID,
    isDirty,
    isInvalid,
    KeySchemaSymbol,
    SchematicInput,
    SchematicInputChild,
    SchematicOptions,
    SchematicParseReturnType,
    VALID,
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
        input: SchematicInput
    ): Promise<SchematicParseReturnType<Record<string | number, TValue>>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (typeof value !== "object" || value === null) {
            addErrorToContext(context, createInvalidTypeError(context.path, "object", value))
            return INVALID
        }

        const result: Record<string | number, TValue> = {} as Record<string | number, TValue>
        const keys = Object.keys(value)
        let status: SchematicParseReturnType["status"] = "valid"

        for (const key of keys) {
            const keyResult = await this[KeySchemaSymbol].runValidation(
                new SchematicInputChild(context, key, context.path, key)
            )
            if (isInvalid(keyResult)) {
                status = "invalid"

                continue
            } else if (isDirty(keyResult)) {
                status = "dirty"
            }

            const valueResult = await this[ValueSchemaSymbol].runValidation(
                new SchematicInputChild(context, value[key], context.path, key)
            )

            if (isInvalid(valueResult)) {
                status = "invalid"
                continue
            } else if (isDirty(valueResult)) {
                status = "dirty"
            }

            result[keyResult.value as any] = valueResult.value
        }

        if (status === "invalid") {
            return INVALID
        }

        if (status === "dirty") {
            return DIRTY(result)
        }

        return VALID(result)
    }
}
