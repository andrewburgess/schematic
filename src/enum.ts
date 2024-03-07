import { createInvalidTypeError, createUnrecognizedValueError } from "./error"
import { Schematic } from "./schematic"
import {
    Defaultable,
    DefaultValueSymbol,
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
    /**
     * @internal
     */
    [DefaultValueSymbol]: EnumKeys<T> | (() => EnumKeys<T>) | undefined

    constructor(private readonly enumeration: T) {
        super()
    }

    public get shape(): T {
        return this.enumeration
    }

    /**
     * @internal
     */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<EnumKeys<T>>> {
        const context = this._getInputContext(input)
        let value = context.data
        if (typeof value === "undefined" && this[DefaultValueSymbol] !== undefined) {
            value =
                typeof this[DefaultValueSymbol] === "function"
                    ? this[DefaultValueSymbol]()
                    : this[DefaultValueSymbol]
        }

        if (typeof value === "string" || typeof value === "number") {
            if (Object.values(this.enumeration).includes(value)) {
                return VALID(value as EnumKeys<T>)
            }
        }

        if (typeof value === "undefined") {
            addErrorToContext(context, createInvalidTypeError(context.path, "enum", value))
            return INVALID
        }

        addErrorToContext(context, createUnrecognizedValueError(value, this.enumeration))
        return INVALID
    }

    public default(defaultValue: EnumKeys<T> | (() => EnumKeys<T>)): EnumSchematic<T> {
        return withDefault(this, defaultValue)
    }
}
