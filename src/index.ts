import { NumberSchematic } from "./number"
import { ObjectSchematic, ObjectSchematicOptions } from "./object"
import { AnySchematic, ObjectShape, Schematic } from "./schematic"
import { StringSchematic } from "./string"
import { KeySignatureSymbol } from "./symbols"

export const number = () => new NumberSchematic()
export const object = <T extends ObjectShape>(shape: T, options?: ObjectSchematicOptions<T>) =>
    new ObjectSchematic<T>(shape, options)
export const record = <TKey extends Schematic<string | number>, TValue extends AnySchematic>(
    key: TKey,
    value: TValue
) => new ObjectSchematic({ [KeySignatureSymbol]: value })
export const string = () => new StringSchematic()
