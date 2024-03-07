import { addErrorToContext, SchematicInputChild } from "./util"
import { createInvalidTypeError } from "./error"
import { Schematic } from "./schematic"
import {
    AnySchematic,
    DIRTY,
    INVALID,
    isDirty,
    isInvalid,
    SchematicInput,
    SchematicOptions,
    SchematicParseReturnType,
    VALID
} from "./types"

export class RecordSchematic<TKeySchema extends AnySchematic, TValue = any> extends Schematic<
    Record<string | number, TValue>
> {
    /** @internal */
    private readonly _keySchema: TKeySchema
    /** @internal */
    private readonly _valueSchema: Schematic<TValue>

    constructor(keySchema: TKeySchema, valueSchema: Schematic<TValue>, options?: SchematicOptions) {
        super(options)

        this._keySchema = keySchema
        this._valueSchema = valueSchema
    }

    public get keySchema(): TKeySchema {
        return this._keySchema
    }

    public get valueSchema(): Schematic<TValue> {
        return this._valueSchema
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
            const keyResult = await this._keySchema.runValidation(
                new SchematicInputChild(context, key, context.path, key)
            )
            if (isInvalid(keyResult)) {
                status = "invalid"

                continue
            } else if (isDirty(keyResult)) {
                status = "dirty"
            }

            const valueResult = await this._valueSchema.runValidation(
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
