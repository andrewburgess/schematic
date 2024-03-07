import { createInvalidTypeError, createUnrecognizedValueError } from "./error"
import { Schematic } from "./schematic"
import {
    Defaultable,
    EnumType,
    INVALID,
    SchematicInput,
    SchematicParseReturnType,
    VALID
} from "./types"
import { addErrorToContext, withDefault } from "./util"

type EnumKeys<TEnum> = TEnum extends readonly (string | number)[]
    ? TEnum[number]
    : TEnum extends { readonly [key: string]: string | number }
      ? TEnum[keyof TEnum]
      : TEnum extends { readonly [key: number]: string | number }
        ? keyof TEnum
        : never

export class EnumSchematic<T extends EnumType>
    extends Schematic<EnumKeys<T>>
    implements Defaultable<EnumKeys<T>>
{
    /** @internal */
    _defaultValue: EnumKeys<T> | (() => EnumKeys<T>) | undefined
    /** @internal */
    private readonly _enumeration: T

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

    public default(defaultValue: EnumKeys<T> | (() => EnumKeys<T>)): EnumSchematic<T> {
        return withDefault(this, defaultValue)
    }
}
