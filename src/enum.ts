import { Schematic } from "./schematic"
import {
    EnumType,
    VALID,
    SchematicContext,
    SchematicParseResult,
    SchematicErrorType
} from "./types"

type EnumKeys<TEnum> = TEnum extends { readonly [key: string]: string | number }
    ? TEnum[keyof TEnum]
    : TEnum extends { readonly [key: number]: string | number }
      ? keyof TEnum
      : never

export class EnumSchematic<T extends EnumType> extends Schematic<EnumKeys<T>> {
    constructor(private readonly enumeration: T) {
        super()
    }

    async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<EnumKeys<T>>> {
        if (typeof value === "string" || typeof value === "number") {
            if (Object.values(this.enumeration).includes(value)) {
                return VALID(value as EnumKeys<T>)
            }
        }

        return this.createTypeParseError({
            expected: Object.values(this.enumeration),
            message: `Unexpected value ${value} for enum "${Object.values(this.enumeration).join(" | ")}"`,
            path: context.path,
            received: value,
            type: SchematicErrorType.UnrecognizedValue
        })
    }
}
