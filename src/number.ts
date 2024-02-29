import { Schematic } from "./schematic"
import { SchematicContext, SchematicErrorType, SchematicParseResult } from "./types"

export class NumberSchematic extends Schematic<number> {
    constructor() {
        super()
    }

    /**
     * @internal
     */
    public async parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<number>> {
        if (typeof value !== "number") {
            return this.createSchematicError({
                message: `Expected a number but received a ${typeof value}`,
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
