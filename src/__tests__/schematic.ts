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

test("should allow union of schemas", async () => {
    const schema = schematic.boolean().or(schematic.number())

    const numberResult = await schema.parse(5)
    expect(numberResult).toBe(5)

    const booleanResult = await schema.parse(true)
    expect(booleanResult).toBe(true)

    try {
        await schema.parse("hello")
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Value did not match any types")
    }

    const unions = schematic.union(schematic.boolean(), schematic.number(), schematic.string())

    const stringResult = await unions.parse("hello")
    expect(stringResult).toBe("hello")

    const unionBooleanResult = await unions.parse(true)
    expect(unionBooleanResult).toBe(true)

    const unionNumberResult = await unions.parse(5)
    expect(unionNumberResult).toBe(5)

    try {
        await unions.parse(null)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Value did not match any types")
    }
})

test("should allow intersection of schemas", async () => {
    const schema = schematic
        .object({ a: schematic.boolean() })
        .and(schematic.object({ b: schematic.number() }))

    const result = await schema.parse({ a: true, b: 5 })

    expect(result).toEqual({ a: true, b: 5 })

    try {
        await schema.parse({ a: true })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Value did not match all types")
    }
})
