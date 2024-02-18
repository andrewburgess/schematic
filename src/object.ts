import { ValidationError } from "./errors"
import { IntersectionSchematic } from "./intersection"
import { AnySchematic, Infer, InferObjectShape, ObjectShape, Schematic } from "./schematic"
import { AllowUnknownSymbol, KeySignatureSymbol, ShapeKeysSymbol, StripUnknown } from "./symbols"

export type ObjectSchematicOptions<T extends ObjectShape> = {
    allowUnknown?: boolean
    stripUnknown?: boolean
}

export class ObjectSchematic<T extends ObjectShape> extends Schematic<InferObjectShape<T>> {
    private [AllowUnknownSymbol]: boolean = false
    private [KeySignatureSymbol]: AnySchematic | undefined
    private [ShapeKeysSymbol]: string[]
    private [StripUnknown]: boolean = true

    constructor(
        readonly shape: T,
        options?: ObjectSchematicOptions<T>
    ) {
        super()

        this[AllowUnknownSymbol] = options?.allowUnknown ?? false
        this[KeySignatureSymbol] = this.shape[KeySignatureSymbol]
        this[ShapeKeysSymbol] = Object.keys(this.shape)
        this[StripUnknown] = this[AllowUnknownSymbol] ? false : options?.stripUnknown ?? true
    }

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }

    public async parse(
        value: unknown,
        parseOptions: ObjectSchematicOptions<any> = {}
    ): Promise<InferObjectShape<T>> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw this.raiseParseError(
                `expected value to be of type 'object' but got '${typeof value}'`
            )
        }

        const allowUnknown = parseOptions.allowUnknown ?? this[AllowUnknownSymbol]
        const keys: string[] = this[ShapeKeysSymbol]
        const stripUnknown = parseOptions.stripUnknown ?? this[StripUnknown]

        if (!allowUnknown && !stripUnknown && !this[KeySignatureSymbol]) {
            const unknownKeys = Object.keys(value).filter((key) => !keys.includes(key))
            if (unknownKeys.length > 0) {
                throw this.raiseParseError(`unexpected keys: ${unknownKeys.join(", ")}`)
            }
        }

        const result: any = {}

        const parseResult = await Promise.allSettled(
            this[ShapeKeysSymbol].map(async (key) => {
                const schematic = this.shape[key] as AnySchematic
                const rawValue = (value as any)[key]

                try {
                    result[key] = await schematic.parse(rawValue)
                } catch (error) {
                    if (error instanceof ValidationError) {
                        throw this.raiseParseError(`error parsing '${key}': ${error.message}`)
                    }

                    throw error
                }
            })
        )

        if (parseResult.some((result) => result.status === "rejected")) {
            throw this.raiseParseError("error parsing object")
        }

        if ((!stripUnknown && allowUnknown) || this[KeySignatureSymbol]) {
            const remainingKeys = Object.keys(value).filter((key) => !keys.includes(key))
            for (const key of remainingKeys) {
                result[key] = (value as any)[key]
            }
        }

        return result
    }
}

export class RecordSchematic<
    TKey extends Schematic<string | number | symbol>,
    TValue extends AnySchematic
> extends Schematic<Record<Infer<TKey>, Infer<TValue>>> {
    constructor(
        private readonly keySchema: TKey,
        private readonly valueSchema: TValue
    ) {
        super()
    }

    public and<U extends AnySchematic>(schema: U): IntersectionSchematic<this, U> {
        return new IntersectionSchematic(this, schema)
    }

    public async parse(value: unknown): Promise<Record<Infer<TKey>, Infer<TValue>>> {
        const result: Record<Infer<TKey>, Infer<TValue>> = {} as Record<Infer<TKey>, Infer<TValue>>

        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw this.raiseParseError(
                `expected value to be of type 'object' but got '${typeof value}'`
            )
        }

        await Promise.allSettled(
            Object.entries(value).map(async ([key, rawValue]) => {
                const parsedKey = (await this.keySchema.parse(key)) as Infer<TKey>
                const parsedValue = await this.valueSchema.parse(rawValue)

                result[parsedKey] = parsedValue
            })
        )

        return result
    }
}
