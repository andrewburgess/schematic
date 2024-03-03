import { BooleanSchematic } from "./boolean"
import { DateSchematic } from "./date"
import { EnumSchematic } from "./enum"
import { EnumType, Infer, SchematicObjectShape, SchematicError, SchematicOptions } from "./types"
import { NumberSchematic } from "./number"
import { ObjectSchematic, SchematicObjectOptions, UnknownKeys } from "./object"
import { RecordSchematic } from "./record"
import { Schematic } from "./schematic"
import { StringSchematic } from "./string"

export type {
    BooleanSchematic,
    DateSchematic,
    EnumSchematic,
    Infer,
    NumberSchematic,
    ObjectSchematic,
    SchematicError,
    SchematicObjectOptions,
    UnknownKeys
}

export { SchematicParseError } from "./error"

const enumeration = <T extends EnumType>(enumeration: T) => new EnumSchematic(enumeration)

export { enumeration as enum }
export const boolean = (opts?: SchematicOptions) => new BooleanSchematic(opts)
export const date = (opts?: SchematicOptions) => new DateSchematic(opts)
export const number = (opts?: SchematicOptions) => new NumberSchematic(opts)
export const object = <T extends SchematicObjectShape>(
    shape: T,
    options?: SchematicObjectOptions
) => new ObjectSchematic(shape, options)

export function record<TKey extends string | number, TValue>(
    keySchema: Schematic<TKey>,
    valueSchema: Schematic<TValue>,
    options?: SchematicOptions
): RecordSchematic<TKey, TValue>
export function record<TValue>(
    valueSchema: Schematic<TValue>,
    options?: SchematicOptions
): RecordSchematic<string, TValue>
export function record() {
    let [keySchema, valueSchema, options] = Array.from(arguments)
    if (keySchema instanceof Schematic && valueSchema instanceof Schematic) {
        return new RecordSchematic(keySchema, valueSchema, options)
    } else {
        return new RecordSchematic(new StringSchematic(), keySchema, valueSchema)
    }
}
export const string = (opts?: SchematicOptions) => new StringSchematic(opts)
