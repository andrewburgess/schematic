import { ValidationError } from "./errors"
import { KeySignatureSymbol } from "./symbols"

type Eval<T> = T extends any[] | Date | unknown ? T : Flat<T>
type Flat<T> = T extends {} ? (T extends Date ? T : { [key in keyof T]: T[key] }) : T
type InferKeySignature<T extends ObjectShape> = T extends { [KeySignatureSymbol]: AnySchematic }
    ? T extends { [KeySignatureSymbol]: infer KeySig }
        ? KeySig extends AnySchematic
            ? { [key: string]: Infer<KeySig> }
            : {}
        : {}
    : {}
type OptionalKeys<T extends ObjectShape> = {
    [key in keyof T]: undefined extends Infer<T[key]> ? (key extends symbol ? never : key) : never
}[keyof T]
type RequiredKeys<T extends ObjectShape> = Exclude<string & keyof T, OptionalKeys<T>>

export type AnySchematic = Schematic<any>
export type ObjectShape = {
    [key: string]: AnySchematic
    [KeySignatureSymbol]?: AnySchematic
}

export type Infer<T> = T extends AnySchematic ? (T extends Schematic<infer K> ? K : any) : T
export type InferObjectShape<T extends ObjectShape> = Flat<
    Eval<
        InferKeySignature<T> & {
            [key in OptionalKeys<T>]?: T[key] extends Schematic<infer K> ? K : any
        } & {
            [key in RequiredKeys<T>]: T[key] extends Schematic<infer K> ? K : any
        }
    >
>

function clone<T>(value: T): T {
    if (typeof value !== "object" || value === null) {
        return value
    }
    if (Array.isArray(value)) {
        return value.map((elem) => clone(elem)) as any
    }
    const cpy: any = Object.create(null)
    for (const k in value) {
        cpy[k] = clone(value[k])
    }
    for (const s of Object.getOwnPropertySymbols(value)) {
        cpy[s] = clone((value as any)[s])
    }
    Object.setPrototypeOf(cpy, Object.getPrototypeOf(value))
    return cpy
}

export abstract class Schematic<T> {
    constructor() {}

    public abstract parse(value: unknown): Promise<T>

    public nullable(this: OptionalSchematic<any>): OptionalSchematic<this>
    public nullable(this: NullableSchematic<any>): this
    public nullable(): NullableSchematic<this>
    public nullable(): any {
        if (this instanceof NullableSchematic) {
            return clone(this)
        }
        return new NullableSchematic(this)
    }

    public optional(this: NullableSchematic<any>): OptionalSchematic<this>
    public optional(this: OptionalSchematic<any>): this
    public optional(): OptionalSchematic<this>
    public optional(): any {
        if (this instanceof OptionalSchematic) {
            return clone(this)
        }
        return new OptionalSchematic(this)
    }

    protected raiseParseError(message: string): ValidationError {
        return new ValidationError(message)
    }
}

export class NullableSchematic<T extends AnySchematic> extends Schematic<Infer<T> | null> {
    constructor(readonly schematic: T) {
        super()
    }

    public async parse(value: unknown): Promise<Infer<T> | null> {
        if (value === null) {
            return null
        }

        return this.schematic.parse(value)
    }
}

export class OptionalSchematic<T extends AnySchematic> extends Schematic<Infer<T> | undefined> {
    constructor(readonly schematic: T) {
        super()
    }

    public async parse(value: unknown): Promise<Infer<T> | undefined> {
        if (value === undefined) {
            return undefined
        }

        return this.schematic.parse(value)
    }
}
