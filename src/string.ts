import { IntersectionSchematic } from "./intersection"
import { AnySchematic, Schematic } from "./schematic"

export class StringSchematic extends Schematic<string> {
    private validators: Array<(value: string) => void> = []

    constructor() {
        super()
    }

    public async parse(value: unknown): Promise<string> {
        if (typeof value !== "string") {
            throw this.raiseParseError(
                `expected value to be of type 'string' but got '${typeof value}'`
            )
        }

        for (const validator of this.validators) {
            validator(value)
        }

        return value
    }

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }

    public min(min: number): this {
        this.addValidator((value) => {
            if (value.length < min) {
                throw this.raiseParseError(
                    `expected value to be at least ${min} characters long but got ${value.length}`
                )
            }
        })

        return this
    }

    public regex(regex: RegExp): this {
        this.addValidator((value) => {
            if (!regex.test(value)) {
                throw this.raiseParseError(
                    `expected value to match regex '${regex}' but got '${value}'`
                )
            }
        })

        return this
    }

    protected addValidator(validator: (value: string) => void): void {
        this.validators.push(validator)
    }
}
