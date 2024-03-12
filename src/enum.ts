import { createInvalidTypeError, createUnrecognizedValueError } from "./error"
import { Schematic } from "./schematic"
import {
    Allowable,
    Defaultable,
    EnumKeys,
    EnumType,
    INVALID,
    SchematicInput,
    SchematicParseReturnType,
    VALID
} from "./types"
import { addErrorToContext, withAllow, withDefault } from "./util"

export class EnumSchematic<T extends EnumType>
    extends Schematic<EnumKeys<T>>
    implements Allowable<EnumKeys<T>>, Defaultable<EnumKeys<T>>
{
    /** @internal */
    _defaultValue: EnumKeys<T> | (() => EnumKeys<T>) | undefined
    /** @internal */
    _enumeration: T

    constructor(enumeration: T) {
        super()

        this._enumeration = enumeration
    }

    public get shape(): T {
        return this._enumeration
    }

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<EnumKeys<T>>> {
        const context = this._getInputContext(input)
        let value = context.data
        if (typeof value === "undefined" && this._defaultValue !== undefined) {
            value =
                typeof this._defaultValue === "function" ? this._defaultValue() : this._defaultValue
        }

        if (typeof value === "string" || typeof value === "number") {
            if (Object.values(this.shape).includes(value)) {
                return VALID(value as EnumKeys<T>)
            }
        }

        if (typeof value === "undefined") {
            addErrorToContext(context, createInvalidTypeError(context.path, "enum", value))
            return INVALID
        }

        addErrorToContext(context, createUnrecognizedValueError(value, this.shape))
        return INVALID
    }

    allow(values: EnumKeys<T>[], message?: string | undefined): Schematic<EnumKeys<T>> {
        return withAllow(this, values, message)
    }

    public default(defaultValue: EnumKeys<T> | (() => EnumKeys<T>)): EnumSchematic<T> {
        return withDefault(this, defaultValue)
    }
}
