import { BooleanSchematic } from "./boolean"
import { NumberSchematic } from "./number"
import { SchematicObject, SchematicObjectOptions, UnknownKeys } from "./object"
import { SchematicObjectShape } from "./types"
import { StringSchematic } from "./string"

export type { SchematicObjectOptions, UnknownKeys }

export const boolean = () => new BooleanSchematic()
export const number = () => new NumberSchematic()
export const object = <T extends SchematicObjectShape>(
    shape: T,
    options?: SchematicObjectOptions
) => new SchematicObject(shape, options)
export const string = () => new StringSchematic()
