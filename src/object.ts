import { addErrorToContext, assertNever, clone } from "./util"
import { createInvalidTypeError } from "./error"
import { EnumSchematic } from "./enum"
import { OptionalSchematic, Schematic } from "./schematic"
import {
    DIRTY,
    InferObject,
    INVALID,
    isDirty,
    isInvalid,
    SchematicErrorType,
    SchematicExtend,
    SchematicInput,
    SchematicInputChild,
    SchematicObjectShape,
    SchematicOmit,
    SchematicOptions,
    SchematicParseReturnType,
    SchematicPartial,
    SchematicPick,
    SchematicRequired,
    ShapeSymbol,
    UnionToTupleString,
    VALID
} from "./types"

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

    public get shape(): T {
        return this[ShapeSymbol]
    }

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
    async _parse(input: SchematicInput): Promise<SchematicParseReturnType<InferObject<T>>> {
        const context = this._getInputContext(input)
        let value = context.data
        // Allow an undefined value through so that default values in the shape can be used
        // to populate it
        if (
            typeof value !== "undefined" &&
            (typeof value !== "object" || value === null || Array.isArray(value))
        ) {
            addErrorToContext(context, createInvalidTypeError(context.path, "object", value))
            return INVALID
        }

        const definedKeys: string[] = Object.keys(this[ShapeSymbol])
        const unknownKeys = Object.keys(value ?? {}).filter((key) => !definedKeys.includes(key))
        const result: any = {}
        let status: SchematicParseReturnType["status"] = "valid"

        for (const key of definedKeys) {
            const schematic = this[ShapeSymbol][key]
            const val = (value as any)?.[key]

            const parsed = await schematic.runValidation(
                new SchematicInputChild(context, val, context.path, key)
            )

            if (!isInvalid(parsed) && parsed.value !== undefined) {
                result[key] = parsed.value
            }

            if (isDirty(parsed)) {
                status = "dirty"
            } else if (isInvalid(parsed)) {
                status = "invalid"
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
                    status = "dirty"
                    addErrorToContext(context, {
                        message: `Unrecognized key "${unknownKeys.join('", "')}"`,
                        path: context.path,
                        keys: unknownKeys,
                        type: SchematicErrorType.UnrecognizedKeys
                    })

                    break
                case UnknownKeys.Strip:
                    break
                default:
                    assertNever(this.unknownKeys)
            }
        }

        if (value === undefined && status === "invalid") {
            addErrorToContext(context, createInvalidTypeError(context.path, "object", value))
        }

        if (status === "invalid") {
            return INVALID
        } else if (status === "dirty") {
            return DIRTY(result)
        }

        return VALID(result)
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

    public keyof(): EnumSchematic<UnionToTupleString<keyof T>> {
        const keys = Object.keys(this[ShapeSymbol])
        return new EnumSchematic(keys) as unknown as EnumSchematic<UnionToTupleString<keyof T>>
    }

    public merge<TMerge extends ObjectSchematic<any>, TShape extends TMerge["shape"]>(
        shape: TMerge
    ): ObjectSchematic<SchematicExtend<T, TShape>> {
        const newShape: any = {
            ...this[ShapeSymbol],
            ...shape[ShapeSymbol]
        }

        return new ObjectSchematic(newShape, this.options) as unknown as ObjectSchematic<
            SchematicExtend<T, TShape>
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
