import { Schematic } from "./schematic"
import {
    InferObject,
    SchematicContext,
    SchematicError,
    SchematicErrorType,
    SchematicObjectShape,
    SchematicOmit,
    SchematicOptions,
    SchematicParseResult,
    SchematicPick
} from "./types"
import { assertNever } from "./util"

export enum UnknownKeys {
    Allow = "allow",
    Strip = "strip",
    Reject = "reject"
}

export interface SchematicObjectOptions extends SchematicOptions {
    unknownKeys?: UnknownKeys
}

export class ObjectSchematic<T extends SchematicObjectShape> extends Schematic<InferObject<T>> {
    private readonly unknownKeys: UnknownKeys = UnknownKeys.Strip

    constructor(
        private readonly shape: T,
        private readonly options: SchematicObjectOptions = {}
    ) {
        super(options)

        if (this.options.unknownKeys) {
            this.unknownKeys = this.options.unknownKeys
        }
    }

    public async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<InferObject<T>>> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return this.createTypeParseError({
                message: `Expected an object but got ${typeof value}`,
                path: context.path,
                received: value,
                type: SchematicErrorType.InvalidType
            })
        }

        const errors: SchematicError[] = []
        let valid = true
        const definedKeys: string[] = Object.keys(this.shape)
        const unknownKeys = Object.keys(value).filter((key) => !definedKeys.includes(key))
        const result: any = {}

        for (const key of definedKeys) {
            const schematic = this.shape[key]
            const val = (value as any)[key]
            const childContext: SchematicContext = {
                data: val,
                path: [...context.path, key],
                parent: context
            }

            const parsed = await schematic.runValidation(val, childContext)

            if (parsed.isValid) {
                result[key] = parsed.value
            } else {
                valid = false
                for (const error of parsed.errors) {
                    errors.push(error)
                }
            }
        }

        if (unknownKeys.length > 0) {
            switch (this.unknownKeys) {
                case UnknownKeys.Allow:
                    for (const key of unknownKeys) {
                        result[key] = (value as any)[key]
                    }
                    break
                case UnknownKeys.Reject:
                    valid = false
                    errors.push(
                        ...unknownKeys.map(
                            (key): SchematicError => ({
                                message: `Unrecognized key "${key}"`,
                                path: context.path,
                                key,
                                type: SchematicErrorType.UnrecognizedKey
                            })
                        )
                    )
                    break
                case UnknownKeys.Strip:
                    break
                default:
                    assertNever(this.unknownKeys)
            }
        }

        if (!valid) {
            return {
                isValid: false,
                errors
            }
        }

        return {
            isValid: true,
            value: result
        }
    }

    public omit<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): Schematic<SchematicOmit<InferObject<T>, K>> {
        const shape: any = {}
        for (const key in this.shape) {
            if (!keys.includes(key as any)) {
                shape[key] = this.shape[key]
            }
        }
        return new ObjectSchematic(shape, this.options) as unknown as Schematic<
            SchematicOmit<InferObject<T>, K>
        >
    }

    public pick<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): Schematic<SchematicPick<InferObject<T>, K>> {
        const shape: any = {}
        for (const key of keys) {
            shape[key] = this.shape[key as any]
        }
        return new ObjectSchematic(shape, this.options) as unknown as Schematic<
            SchematicPick<InferObject<T>, K>
        >
    }
}
