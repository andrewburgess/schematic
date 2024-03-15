import { addErrorToContext, assertNever, clone, SchematicInputChild } from "./util"
import { createInvalidTypeError } from "./error"
import { NullableSchematic, OptionalSchematic, Schematic } from "./schematic"
import {
    DIRTY,
    Flatten,
    InferObject,
    INVALID,
    isDirty,
    isInvalid,
    RemoveOptional,
    SchematicErrorType,
    SchematicInput,
    SchematicObjectShape,
    SchematicOptions,
    SchematicParseReturnType,
    VALID
} from "./types"

type Extend<T, U> = Flatten<Omit<T, keyof U> & U>
type SchematicPartial<T extends SchematicObjectShape, K extends keyof T> = Flatten<{
    [key in keyof T]: key extends K
        ? T[key] extends OptionalSchematic<any>
            ? T[key]
            : OptionalSchematic<T[key]>
        : T[key]
}>
type SchematicRequired<T extends SchematicObjectShape, K extends keyof T> = Flatten<{
    [key in keyof T]: key extends K
        ? T[key] extends OptionalSchematic<any>
            ? RemoveOptional<T[key]["shape"]>
            : T[key] extends NullableSchematic<any>
              ? NullableSchematic<RemoveOptional<T[key]["shape"]>>
              : T[key]
        : T[key]
}>

export enum UnknownKeys {
    Allow = "allow",
    Strip = "strip",
    Reject = "reject"
}

export interface SchematicObjectOptions extends SchematicOptions {
    unknownKeys?: UnknownKeys
}

export class ObjectSchematic<T extends SchematicObjectShape> extends Schematic<InferObject<T>> {
    /** @internal */
    _options: SchematicObjectOptions = {}
    /** @internal */
    _shape: T
    /** @internal */
    _unknownKeys: UnknownKeys = UnknownKeys.Strip

    public get shape(): T {
        return this._shape
    }

    constructor(shape: T, options: SchematicObjectOptions = {}) {
        super(options)
        this._options = options
        this._shape = shape

        if (this._options.unknownKeys) {
            this._unknownKeys = this._options.unknownKeys
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

        const definedKeys: string[] = Object.keys(this.shape)
        const unknownKeys = Object.keys(value ?? {}).filter((key) => !definedKeys.includes(key))
        const result: any = {}
        let status: SchematicParseReturnType["status"] = "valid"

        for (const key of definedKeys) {
            const schematic = this.shape[key]
            const val = (value as any)?.[key]

            const parsed = await schematic._runValidation(
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
            switch (this._unknownKeys) {
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
                    assertNever(this._unknownKeys)
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

    public allowUnknownKeys(): ObjectSchematic<T> {
        const cloned = clone(this)
        cloned._unknownKeys = UnknownKeys.Allow
        return cloned
    }

    public extend<TExtend extends SchematicObjectShape>(
        shape: TExtend
    ): ObjectSchematic<Extend<T, TExtend>> {
        const newShape: any = {}

        for (const key in this.shape) {
            newShape[key] = clone(this.shape[key])
        }

        for (const key in shape) {
            newShape[key] = clone(shape[key])
        }

        return new ObjectSchematic(newShape, this._options) as unknown as ObjectSchematic<
            Extend<T, TExtend>
        >
    }

    public keyof(): Flatten<keyof T> {
        const keys = Object.keys(this.shape)
        return keys as unknown as Flatten<keyof T>
    }

    public merge<TMerge extends ObjectSchematic<any>, TShape extends TMerge["shape"]>(
        shape: TMerge
    ): ObjectSchematic<Extend<T, TShape>> {
        const newShape: any = {
            ...clone(this.shape),
            ...clone(shape.shape)
        }

        return new ObjectSchematic(newShape, this._options) as unknown as ObjectSchematic<
            Extend<T, TShape>
        >
    }

    public omit<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<Flatten<Omit<T, K>>> {
        const shape: any = {}
        for (const key in this.shape) {
            if (!keys.includes(key as any)) {
                shape[key] = clone(this.shape[key])
            }
        }
        return new ObjectSchematic(shape, this._options) as unknown as ObjectSchematic<
            Flatten<Omit<T, K>>
        >
    }

    public partial<K extends keyof InferObject<T> = keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicPartial<T, K>> {
        const shape: any = {}

        if (keys.length === 0) {
            keys = Object.keys(this.shape) as K[]
        }

        for (const key in this.shape) {
            if (keys.includes(key as any)) {
                shape[key] = clone(this.shape[key]).optional()
            } else {
                shape[key] = clone(this.shape[key])
            }
        }

        return new ObjectSchematic(shape, this._options) as unknown as ObjectSchematic<
            SchematicPartial<T, K>
        >
    }

    public pick<K extends keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<Flatten<Pick<T, K>>> {
        const shape: any = {}
        for (const key of keys) {
            shape[key] = clone(this.shape[key as any])
        }
        return new ObjectSchematic(shape, this._options) as unknown as ObjectSchematic<
            Flatten<Pick<T, K>>
        >
    }

    public rejectUnknownKeys(): ObjectSchematic<T> {
        const cloned = clone(this)
        cloned._unknownKeys = UnknownKeys.Reject
        return cloned
    }

    public required<K extends keyof InferObject<T> = keyof InferObject<T>>(
        ...keys: K[]
    ): ObjectSchematic<SchematicRequired<T, K>> {
        const shape: any = {}

        if (keys.length === 0) {
            keys = Object.keys(this.shape) as K[]
        }

        for (const key in this.shape) {
            if (keys.includes(key as any) && this.shape[key] instanceof OptionalSchematic) {
                const optional = this.shape[key] as unknown as OptionalSchematic<any>
                shape[key] = clone(optional.shape)
            } else {
                shape[key] = clone(this.shape[key])
            }
        }

        return new ObjectSchematic(shape, this._options) as unknown as ObjectSchematic<
            SchematicRequired<T, K>
        >
    }

    public stripUnknownKeys(): ObjectSchematic<T> {
        const cloned = clone(this)
        cloned._unknownKeys = UnknownKeys.Strip
        return cloned
    }
}
