import { ValidationError } from "./errors"
import { AnySchematic, InferObjectShape, ObjectShape, Schematic } from "./schematic"
import { AllowUnknownSymbol, ShapeKeysSymbol, StripUnknown } from "./symbols"

export type ObjectSchematicOptions<T extends ObjectShape> = {
    allowUnknown?: boolean
    stripUnknown?: boolean
}

export class ObjectSchematic<T extends ObjectShape> extends Schematic<InferObjectShape<T>> {
    private [AllowUnknownSymbol]: boolean = false
    private [ShapeKeysSymbol]: string[]
    private [StripUnknown]: boolean = true

    constructor(
        private readonly shape: T,
        options?: ObjectSchematicOptions<T>
    ) {
        super()

        this[AllowUnknownSymbol] = options?.allowUnknown ?? false
        this[ShapeKeysSymbol] = Object.keys(this.shape)
        this[StripUnknown] = this[AllowUnknownSymbol] ? false : options?.stripUnknown ?? true

        return this
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
        const unknownKeys = Object.keys(value).filter((key) => !keys.includes(key))

        if (!allowUnknown && !stripUnknown && unknownKeys.length > 0) {
            throw this.raiseParseError(`unexpected keys: ${unknownKeys.join(", ")}`)
        }

        const result: any = {}

        await Promise.allSettled(
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

        if (!stripUnknown && allowUnknown) {
            unknownKeys.forEach((key) => {
                result[key] = (value as any)[key]
            })
        }

        return result
    }
}
