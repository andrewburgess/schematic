import { BooleanSchematic } from "./boolean"
import { EnumLike, EnumSchematic } from "./enum"
import { NumberSchematic } from "./number"
import { ObjectSchematic, ObjectSchematicOptions, RecordSchematic } from "./object"
import { AnySchematic, ObjectShape, Schematic } from "./schematic"
import { StringSchematic } from "./string"

export { Infer } from "./schematic"

const enumSchematic = <E extends EnumLike>(enumValue: E) => new EnumSchematic<E>(enumValue)

export const boolean = () => new BooleanSchematic()
export { enumSchematic as enum }
export const number = () => new NumberSchematic()
export const object = <T extends ObjectShape>(schematic: T, options?: ObjectSchematicOptions<T>) =>
    new ObjectSchematic<T>(schematic, options)
export const record = <
    TKey extends Schematic<string | number | symbol>,
    TValue extends AnySchematic
>(
    key: TKey,
    value: TValue
) => new RecordSchematic(key, value)
export const string = () => new StringSchematic()
