import { BooleanSchematic } from "./boolean"
import { EnumSchematic } from "./enum"
import { EnumType, Infer, SchematicObjectShape, SchematicError, SchematicOptions } from "./types"
import { NumberSchematic } from "./number"
import { ObjectSchematic, SchematicObjectOptions, UnknownKeys } from "./object"
import { StringSchematic } from "./string"

export type {
    BooleanSchematic,
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
export const number = () => new NumberSchematic()
export const object = <T extends SchematicObjectShape>(
    shape: T,
    options?: SchematicObjectOptions
) => new ObjectSchematic(shape, options)
export const string = () => new StringSchematic()
