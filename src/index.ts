import { BooleanSchematic } from "./boolean"
import { SchematicObject, SchematicObjectOptions, UnknownKeys } from "./object"
import { SchematicObjectShape } from "./types"

export type { SchematicObjectOptions, UnknownKeys }

export const boolean = () => new BooleanSchematic()
export const object = <T extends SchematicObjectShape>(
    shape: T,
    options?: SchematicObjectOptions
) => new SchematicObject(shape, options)
