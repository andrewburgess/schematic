import { ValidationError } from "./errors"

export type AnySchematic = Schematic<any>
export type ObjectShape = {
    [key: string]: AnySchematic
}

export type Infer<T> = T extends AnySchematic ? (T extends Schematic<infer U> ? U : any) : T

export type InferObjectShape<T extends ObjectShape> = {
    [key in keyof T]: T[key] extends Schematic<infer U> ? U : never
}

export abstract class Schematic<T> {
    constructor() {}

    public abstract parse(value: unknown): Promise<T>

    protected raiseParseError(message: string): ValidationError {
        return new ValidationError(message)
    }
}
