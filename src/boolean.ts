import { createInvalidTypeError } from "./error"
import { Schematic } from "./schematic"
import {
    Coercable,
    Defaultable,
    INVALID,
    SchematicInput,
    SchematicParseReturnType,
    VALID
} from "./types"
import { addErrorToContext, withCoerce, withDefault } from "./util"

export class BooleanSchematic
    extends Schematic<boolean>
    implements Coercable, Defaultable<boolean>
{
    /** @internal */
    _coerce: boolean = false
    /** @internal */
    _defaultValue: boolean | (() => boolean) | undefined

    /** @internal */
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<boolean>> {
        const context = this._getInputContext(input)
        let value = context.data
        if (typeof value === "undefined" && this._defaultValue !== undefined) {
            value =
                typeof this._defaultValue === "function" ? this._defaultValue() : this._defaultValue
        }

        if (this._coerce) {
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
            addErrorToContext(context, createInvalidTypeError(context.path, "boolean", value))
            return INVALID
        }

        return VALID(value)
    }

    public coerce(): this {
        return withCoerce(this)
    }

    default(defaultValue: boolean | (() => boolean)): BooleanSchematic {
        return withDefault(this, defaultValue)
    }
}
