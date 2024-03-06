import { createUnrecognizedValueError } from "./error"
import { Schematic } from "./schematic"
import {
    EnumType,
    VALID,
    SchematicContext,
    SchematicParseResult,
    INVALID,
    Defaultable,
    DefaultValueSymbol
} from "./types"
import { withDefault } from "./util"

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
    async _parse(
        value: unknown = typeof this[DefaultValueSymbol] === "function"
            ? this[DefaultValueSymbol]()
            : this[DefaultValueSymbol],
        context: SchematicContext
    ): Promise<SchematicParseResult<EnumKeys<T>>> {
        if (typeof value === "string" || typeof value === "number") {
            if (Object.values(this.enumeration).includes(value)) {
                return VALID(value as EnumKeys<T>)
            }
        }

        if (typeof value === "undefined") {
            return this._createTypeParseError(context.path, "enum", value)
        }

        return INVALID(createUnrecognizedValueError(context.path, value, this.enumeration))
    }

    public default(defaultValue: EnumKeys<T> | (() => EnumKeys<T>)): EnumSchematic<T> {
        return withDefault(this, defaultValue)
    }
}
