import { Schematic } from "./schematic"

export class NumberSchematic extends Schematic<number> {
    constructor() {
        super()
    }

    public async parse(value: unknown): Promise<number> {
        if (typeof value !== "number") {
            throw this.raiseParseError(
                `expected value to be of type 'number' but got '${typeof value}'`
            )
        }

        return value
    }
}
