import { IntersectionSchematic } from "./intersection"
import { AnySchematic, Schematic } from "./schematic"

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

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }
}
