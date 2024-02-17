import { BooleanSchematic } from "./boolean"
import { EnumLike, EnumType } from "./enum"
import { NumberSchematic } from "./number"
import { ObjectSchematic, ObjectSchematicOptions } from "./object"
import { AnySchematic, ObjectShape, Schematic } from "./schematic"
import { StringSchematic } from "./string"
import { KeySignatureSymbol } from "./symbols"

export { Infer } from "./schematic"

const enumType = <E extends EnumLike>(enumValue: E) => new EnumType<E>(enumValue)

export const boolean = () => new BooleanSchematic()
export { enumType as enum }
export const number = () => new NumberSchematic()
export const object = <T extends ObjectShape>(schematic: T, options?: ObjectSchematicOptions<T>) =>
    new ObjectSchematic<T>(schematic, options)
export const record = <TKey extends Schematic<string | number>, TValue extends AnySchematic>(
    key: TKey,
    value: TValue
) => new ObjectSchematic({ [KeySignatureSymbol]: value })
export const string = () => new StringSchematic()
