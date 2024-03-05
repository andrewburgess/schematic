import { OptionalSchematic, Schematic } from "./schematic"
import {
    InferObject,
    SchematicContext,
    SchematicError,
    SchematicErrorType,
    SchematicExtend,
    SchematicObjectShape,
    SchematicOmit,
    SchematicOptions,
    SchematicParseResult,
    SchematicPartial,
    SchematicPick,
    SchematicRequired,
    ShapeSymbol
} from "./types"
import { assertNever, clone } from "./util"

export enum UnknownKeys {
    Allow = "allow",
    Strip = "strip",
    Reject = "reject"
}

export interface SchematicObjectOptions extends SchematicOptions {
    unknownKeys?: UnknownKeys
}

export class ObjectSchematic<T extends SchematicObjectShape> extends Schematic<InferObject<T>> {
    /**
     * @internal
     */
    public readonly [ShapeSymbol]: T
    private readonly unknownKeys: UnknownKeys = UnknownKeys.Strip

    constructor(
        shape: T,
        private readonly options: SchematicObjectOptions = {}
    ) {
        super(options)
        this[ShapeSymbol] = shape

        if (this.options.unknownKeys) {
            this.unknownKeys = this.options.unknownKeys
        }
    }

    /**
     * @internal
     */
    public async _parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<InferObject<T>>> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return this.createTypeParseError(context.path, "object", value)
        }

        const errors: SchematicError[] = []
        let valid = true
        const definedKeys: string[] = Object.keys(this[ShapeSymbol])
        const unknownKeys = Object.keys(value).filter((key) => !definedKeys.includes(key))
        const result: any = {}

        for (const key of definedKeys) {
            const schematic = this[ShapeSymbol][key]
            const val = (value as any)[key]
            const childContext: SchematicContext = {
                addError: function (error) {
                    this.errors.push(error)
                },
                data: val,
                errors: [],
                path: [...context.path, key],
                parent: context
            }

            const parsed = await schematic.runValidation(val, childContext)

            if (parsed.isValid) {
                result[key] = parsed.value
            } else {
                valid = false
                errors.push(...parsed.errors)
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

    public extend<TExtend extends SchematicObjectShape>(
        shape: TExtend
    ): ObjectSchematic<SchematicExtend<T, TExtend>> {
        const newShape: any = {}

        for (const key in this[ShapeSymbol]) {
            newShape[key] = clone(this[ShapeSymbol][key])
        }

        for (const key in shape) {
            newShape[key] = clone(shape[key])
        }

        return new ObjectSchematic(newShape, this.options) as unknown as ObjectSchematic<
            SchematicExtend<T, TExtend>
        >
    }

    public omit<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicOmit<T, K>> {
        const shape: any = {}
        for (const key in this[ShapeSymbol]) {
            if (!keys.includes(key as any)) {
                shape[key] = this[ShapeSymbol][key]
            }
        }
        return new ObjectSchematic(shape, this.options)
    }

    public partial<K extends keyof InferObject<T> = keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicPartial<T, K>> {
        const shape: any = {}

        if (keys.length === 0) {
            keys = Object.keys(this[ShapeSymbol]) as K[]
        }

        for (const key in this[ShapeSymbol]) {
            if (keys.includes(key as any)) {
                shape[key] = this[ShapeSymbol][key].optional()
            } else {
                shape[key] = this[ShapeSymbol][key]
            }
        }

        return new ObjectSchematic(shape, this.options)
    }

    public pick<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicPick<T, K>> {
        const shape: any = {}
        for (const key of keys) {
            shape[key] = this[ShapeSymbol][key as any]
        }
        return new ObjectSchematic(shape, this.options)
    }

    public required<K extends keyof InferObject<T> = keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicRequired<T, K>> {
        const shape: any = {}

        if (keys.length === 0) {
            keys = Object.keys(this[ShapeSymbol]) as K[]
        }

        for (const key in this[ShapeSymbol]) {
            if (keys.includes(key as any) && this[ShapeSymbol][key] instanceof OptionalSchematic) {
                const optional = this[ShapeSymbol][key] as unknown as OptionalSchematic<any>
                shape[key] = optional[ShapeSymbol]
            } else {
                shape[key] = this[ShapeSymbol][key]
            }
        }

        return new ObjectSchematic(shape, this.options)
    }
}
