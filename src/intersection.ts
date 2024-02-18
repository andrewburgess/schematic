import { AnySchematic, Flat, Infer, Schematic } from "./schematic"

export class IntersectionSchematic<
    T extends AnySchematic,
    U extends AnySchematic
> extends Schematic<Flat<Infer<T> & Infer<U>>> {
    constructor(
        readonly left: T,
        readonly right: U
    ) {
        super()
    }

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }

    public async parse(value: unknown): Promise<Flat<Infer<T> & Infer<U>>> {
        const result = await Promise.allSettled([this.left.parse(value), this.right.parse(value)])

        if (result.every((inner) => inner.status === "fulfilled")) {
            return value as Flat<Infer<T> & Infer<U>>
        }

        const errors = result
            .filter((inner) => inner.status === "rejected")
            .map((inner) => (inner.status === "rejected" ? inner.reason : null))

        throw this.raiseParseError(errors.map((error) => error.message).join(", "))
    }
}
