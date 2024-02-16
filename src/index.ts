import { NumberSchematic } from "./number"
import { ObjectSchematic, ObjectSchematicOptions } from "./object"
import { ObjectShape } from "./schematic"
import { StringSchematic } from "./string"

export const number = () => new NumberSchematic()
export const object = <T extends ObjectShape>(shape: T, options?: ObjectSchematicOptions<T>) =>
    new ObjectSchematic<T>(shape, options)
export const string = () => new StringSchematic()
