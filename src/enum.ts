import { Schematic } from "./schematic"
import {
    EnumType,
    VALID,
    SchematicContext,
    SchematicParseResult,
    SchematicErrorType
} from "./types"

export class EnumSchematic<T extends EnumType> extends Schematic<T[keyof T]> {
    constructor(private readonly enumeration: T) {
        super()
    }

    async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<T[keyof T]>> {
        if (typeof value === "string" || typeof value === "number") {
            if (Object.values(this.enumeration).includes(value)) {
                return VALID(value as T[keyof T])
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
