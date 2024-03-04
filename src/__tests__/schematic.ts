import * as schematic from "../"
import { SchematicErrorType } from "../types"

test("should allow adding custom validator", async () => {
    const schema = schematic.boolean().ensure((value, context) => {
        if (value === false) {
            context.addError({
                expected: false,
                message: "Value cannot be false",
                received: value,
                type: SchematicErrorType.InvalidExactValue
            })
        }
    })

    try {
        await schema.parse(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Value cannot be false")
    }
})

test("should allow specifying optional multiple times", async () => {
    const schema = schematic.boolean().optional().optional().optional()

    const result = await schema.parse(undefined)

    expect(result).toBeUndefined()

    const result2 = await schema.parse(true)

    expect(result2).toBe(true)
})

test("should parse optional value correctly if it is provided", async () => {
    const schema = schematic.boolean().optional()

    const result = await schema.parse(true)

    expect(result).toBe(true)
})

test("should allow converting an optional schema to required", async () => {
    const schema = schematic.boolean().optional().required()
    try {
        await schema.parse(undefined)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Required")
    }

    const multipleOptional = schematic.boolean().optional().optional().optional().required()

    try {
        await multipleOptional.parse(undefined)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Required")
    }
})

test("should allow marking a schema as required", async () => {
    const schema = schematic.boolean().required()

    try {
        await schema.parse(undefined)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Required")
    }
})

test("should allow marking a schema as required multiple times", async () => {
    const schema = schematic.boolean().required().required().required()

    try {
        await schema.parse(undefined)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Required")
    }
})
