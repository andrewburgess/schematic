import { Schematic } from "./schematic"

export type EnumLike = {
    [Key: string]: string | number
    [Number: number]: string
}

export class EnumType<T extends EnumLike> extends Schematic<T[keyof T]> {
    private values: T[keyof T][] = []

    constructor(enumeration: T) {
        super()

        this.values = Object.values(enumeration as any)
    }

    async parse(value: unknown): Promise<T[keyof T]> {
        if (!Object.values(this.values).includes(value as any)) {
            throw this.raiseParseError(
                `expected value to be one of [${Object.values(this.values).join(", ")}] but got '${value}'`
            )
        }

        return value as T[keyof T]
    }
}
