import { Schematic } from "./schematic"

export class BooleanSchematic extends Schematic<boolean> {
    constructor() {
        super()
    }

    public async parse(value: unknown): Promise<boolean> {
        if (typeof value !== "boolean") {
            throw this.raiseParseError(
                `expected value to be of type 'number' but got '${typeof value}'`
            )
        }

        return value
    }
}
