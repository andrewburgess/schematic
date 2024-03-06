import assert from "assert"
import * as schematic from "../"
import { SchematicErrorType } from "../types"

test("should allow adding custom validator", async () => {
    const schema = schematic.boolean().ensure((value, context) => {
        if (value === false) {
            context.addError({
                expected: false,
                message: "Value cannot be false",
                path: context.path,
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

test("should allow specifying a nullable type", async () => {
    const schema = schematic.boolean().nullable()

    const result = await schema.parse(null)

    expect(result).toBeNull()

    const result2 = await schema.parse(true)

    expect(result2).toBe(true)
})

test("should allow specifying nullable multiple times", async () => {
    const schema = schematic.boolean().nullable().nullable().nullable()

    const result = await schema.parse(null)

    expect(result).toBeNull()

    const result2 = await schema.parse(true)

    expect(result2).toBe(true)
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

    const invalidResult = await schema.safeParse("hello")
    assert(!invalidResult.isValid)
    expect(invalidResult.errors[0].message).toBe("Value did not match any types")

    const unions = schematic.union(schematic.boolean(), schematic.number(), schematic.string())

    const stringResult = await unions.parse("hello")
    expect(stringResult).toBe("hello")

    const unionBooleanResult = await unions.parse(true)
    expect(unionBooleanResult).toBe(true)

    const unionNumberResult = await unions.parse(5)
    expect(unionNumberResult).toBe(5)

    const invalidUnionsResult = await unions.safeParse(null)
    assert(!invalidUnionsResult.isValid)
    expect(invalidUnionsResult.errors[0].message).toBe("Value did not match any types")
})

test("should allow intersection of schemas", async () => {
    const schema = schematic
        .object({ a: schematic.boolean() })
        .and(schematic.object({ b: schematic.number() }))

    const result = await schema.parse({ a: true, b: 5 })

    expect(result).toEqual({ a: true, b: 5 })

    const invalidResult = await schema.safeParse({ a: true })
    assert(!invalidResult.isValid)
    expect(invalidResult.errors[0].message).toBe('"b" is required')
})

test("should allow adding basic testing of values", async () => {
    const schema = schematic.boolean().test((value) => value === true, "Test failed")

    const result = await schema.parse(true)

    expect(result).toBe(true)

    try {
        await schema.parse(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Test failed")
    }
})

test("should allow transforming a schematic from one value to another", async () => {
    const booleanTransform = schematic.boolean().transform((value) => (value ? "yes" : "no"))

    const booleanResult = await booleanTransform.parse(true)

    expect(booleanResult).toBe("yes")
})

test("transform should allow validating value and returning a parse error", async () => {
    const booleanTransform = schematic.boolean().transform((value, context) => {
        if (value === false) {
            context.addError({
                expected: false,
                message: "Value cannot be false",
                path: context.path,
                received: value,
                type: SchematicErrorType.InvalidExactValue
            })
        }
        return value
    })

    try {
        await booleanTransform.parse(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Value cannot be false")
    }
})

test("should allow piping a schematic to another schematic", async () => {
    const booleanPipe = schematic
        .boolean()
        .transform((value) => (value ? "true" : "false"))
        .pipe(schematic.string().transform((value) => value.toUpperCase()))

    const result = await booleanPipe.parse(true)

    expect(result).toBe("TRUE")
})
