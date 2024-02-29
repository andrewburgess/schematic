import { Schematic, SchematicPrimitiveType } from "./schematic"
import { SchematicContext, SchematicErrorType, SchematicParseResult } from "./types"

export class StringSchematic extends SchematicPrimitiveType(Schematic<string>) {
    constructor() {
        super()
    }

    /**
     * @internal
     */
    public async parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<string>> {
        if (typeof value !== "string") {
            return this.createSchematicError({
                message: `Expected a string but received a ${typeof value}`,
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
