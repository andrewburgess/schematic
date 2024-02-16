import { Schematic } from "./schematic"

export class StringSchematic extends Schematic<string> {
    constructor() {
        super()

        return this
    }

    public async parse(value: unknown): Promise<string> {
        if (typeof value !== "string") {
            throw this.raiseParseError(
                `expected value to be of type 'string' but got '${typeof value}'`
            )
        }

        return value
    }
}
