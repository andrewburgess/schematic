import { BooleanSchematic } from "./boolean"
import { EnumSchematic } from "./enum"
import { EnumType, Infer, SchematicObjectShape } from "./types"
import { NumberSchematic } from "./number"
import { ObjectSchematic, SchematicObjectOptions, UnknownKeys } from "./object"
import { StringSchematic } from "./string"

export type {
    BooleanSchematic,
    EnumSchematic,
    Infer,
    NumberSchematic,
    ObjectSchematic,
    SchematicObjectOptions,
    UnknownKeys
}

const enumeration = <T extends EnumType>(enumeration: T) => new EnumSchematic(enumeration)

export { enumeration as enum }
export const boolean = () => new BooleanSchematic()
export const number = () => new NumberSchematic()
export const object = <T extends SchematicObjectShape>(
    shape: T,
    options?: SchematicObjectOptions
) => new ObjectSchematic(shape, options)
export const string = () => new StringSchematic()
