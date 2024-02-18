import { IntersectionSchematic } from "./intersection"
import { AnySchematic, Defaultable, Schematic } from "./schematic"
import { clone } from "./utils"

export class BooleanSchematic extends Schematic<boolean> implements Defaultable<boolean> {
    constructor(private defaultValue?: boolean | (() => boolean)) {
        super()
    }

    public async parse(
        value: unknown = typeof this.defaultValue === "function"
            ? this.defaultValue()
            : this.defaultValue
    ): Promise<boolean> {
        if (typeof value !== "boolean") {
            throw this.raiseParseError(
                `expected value to be of type 'boolean' but got '${typeof value}'`
            )
        }

        return value
    }

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }

    public default(value: boolean | (() => boolean)): BooleanSchematic {
        const copy = clone(this)
        copy.defaultValue = value

        return copy
    }
}
