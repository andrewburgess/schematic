import { addErrorToContext, SchematicInputChild } from "./util"
import { createInvalidTypeError } from "./error"
import { Schematic } from "./schematic"
import {
    AnySchematic,
    DIRTY,
    Infer,
    INVALID,
    isDirty,
    isInvalid,
    RecordKey,
    SchematicInput,
    SchematicOptions,
    SchematicParseReturnType,
    VALID
} from "./types"
import { EnumSchematic } from "./enum"

type RecordOutput<TKeySchema extends AnySchematic, TValueSchema extends AnySchematic> =
    TKeySchema extends EnumSchematic<any>
        ? Partial<Record<RecordKey<Infer<TKeySchema>>, Infer<TValueSchema | undefined>>>
        : Record<RecordKey<Infer<TKeySchema>>, Infer<TValueSchema>>

export class RecordSchematic<
    TKeySchema extends AnySchematic,
    TValueSchema extends AnySchematic
> extends Schematic<RecordOutput<TKeySchema, TValueSchema>> {
    /** @internal */
    _keySchema: TKeySchema
    /** @internal */
    _valueSchema: TValueSchema

    constructor(keySchema: TKeySchema, valueSchema: TValueSchema, options?: SchematicOptions) {
        super(options)

        this._keySchema = keySchema
        this._valueSchema = valueSchema
    }

    public get keySchema(): TKeySchema {
        return this._keySchema
    }

    public get valueSchema(): Schematic<TValueSchema> {
        return this._valueSchema
    }

    /**
     * @internal
     */
    async _parse(
        input: SchematicInput
    ): Promise<SchematicParseReturnType<RecordOutput<TKeySchema, TValueSchema>>> {
        const context = this._getInputContext(input)
        let value = context.data

        if (typeof value !== "object" || value === null) {
            addErrorToContext(context, createInvalidTypeError(context.path, "object", value))
            return INVALID
        }

        const result: RecordOutput<TKeySchema, TValueSchema> = {} as RecordOutput<
            TKeySchema,
            TValueSchema
        >
        let keys: IterableIterator<any> | string[]
        if (Array.isArray(value) || value instanceof Map) {
            keys = value.keys()
        } else {
            keys = Object.keys(value)
        }

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

            let itemValue: any
            if (value instanceof Map) {
                itemValue = value.get(key)
            } else {
                itemValue = value[key]
            }

            const valueResult = await this._valueSchema.runValidation(
                new SchematicInputChild(context, itemValue, context.path, key)
            )

            if (isInvalid(valueResult)) {
                status = "invalid"
                continue
            } else if (isDirty(valueResult)) {
                status = "dirty"
            }

            result[keyResult.value as Infer<TKeySchema>] = valueResult.value
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
