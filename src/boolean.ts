import { Schematic } from "./schematic"
import {
    Coercable,
    CoerceSymbol,
    Defaultable,
    SchematicContext,
    SchematicParseResult
} from "./types"
import { withCoerce, withDefault } from "./util"

export class BooleanSchematic
    extends Schematic<boolean>
    implements Coercable, Defaultable<boolean>
{
    defaultValue: boolean | (() => boolean) | undefined

    async _parseType(
        value: unknown = typeof this.defaultValue === "function"
            ? this.defaultValue()
            : this.defaultValue,
        context: SchematicContext
    ): Promise<SchematicParseResult<boolean>> {
        if (this[CoerceSymbol]) {
            switch (typeof value) {
                case "string": {
                    let lowered = value.toLowerCase()
                    if (lowered === "true") {
                        value = true
                    } else if (lowered === "false") {
                        value = false
                    }
                    break
                }
                case "number":
                    if (value === 1) {
                        value = true
                    } else if (value === 0) {
                        value = false
                    }
                    break
            }
        }

        if (typeof value !== "boolean") {
            return this.createTypeParseError(context.path, "boolean", value)
        }

        return {
            isValid: true,
            value
        }
    }

    public coerce() {
        return withCoerce(this)
    }

    default(defaultValue: boolean | (() => boolean)): BooleanSchematic {
        return withDefault(this, defaultValue)
    }
}
