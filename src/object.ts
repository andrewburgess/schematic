import { Schematic } from "./schematic"
import {
    InferObject,
    SchematicContext,
    SchematicError,
    SchematicErrorType,
    SchematicObjectShape,
    SchematicParseResult
} from "./types"
import { assertNever } from "./util"

export enum UnknownKeys {
    Allow = "allow",
    Strip = "strip",
    Reject = "reject"
}

export interface SchematicObjectOptions {
    unknownKeys?: UnknownKeys
}

export class SchematicObject<T extends SchematicObjectShape> extends Schematic<InferObject<T>> {
    private readonly unknownKeys: UnknownKeys = UnknownKeys.Strip

    constructor(
        private readonly shape: T,
        options: SchematicObjectOptions = {}
    ) {
        super()

        if (options.unknownKeys) {
            this.unknownKeys = options.unknownKeys
        }
    }

    /**
     * @internal
     */
    public async parseType(
        value: unknown,
        context: SchematicContext
    ): Promise<SchematicParseResult<InferObject<T>>> {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return this.createSchematicError({
                message: `Expected an object but got ${typeof value}`,
                path: context.path,
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

            const parsed = await schematic.parseType(val, childContext)

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
}
