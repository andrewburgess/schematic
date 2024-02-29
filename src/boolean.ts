import { Schematic } from "./schematic"
import { SchematicContext, SchematicErrorType, SchematicParseResult } from "./types"

export class BooleanSchematic extends Schematic<boolean> {
    constructor() {
        super()
    }

    /**
     * @internal
     */
    public async parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<boolean>> {
        if (typeof value !== "boolean") {
            return this.createSchematicError({
                message: `Expected a boolean but received a ${typeof value}`,
                path: context.path,
                type: SchematicErrorType.InvalidType
            })
        }

        return {
            isValid: true,
            value
        }
    }
}
