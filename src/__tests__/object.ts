import * as schematic from "../"
import { assertEqualType } from "../util"

test("type parsing should be correct", async () => {
    const optionalEntries = schematic.object({
        foo: schematic.string(),
        bar: schematic
            .object({
                baz: schematic.number().optional()
            })
            .required("baz"),
        fizz: schematic
            .object({
                buzz: schematic.string()
            })
            .optional(),
        buzz: schematic
            .object({
                fizz: schematic.array(schematic.string()).optional()
            })
            .optional()
    })

    assertEqualType<
        schematic.Infer<typeof optionalEntries>,
        { foo: string; bar?: { baz?: number }; fizz?: { buzz: string }; buzz?: { fizz?: string[] } }
    >(true)
})

test("should parse an object", async () => {
    const schema = schematic.object({
        foo: schematic.string()
    })

    const result = await schema.parse({ foo: "bar" })

    expect(result).toEqual({ foo: "bar" })
})

test("nested schemas should surface errors correctly", async () => {
    const schema = schematic.object({
        foo: schematic.string(),
        bar: schematic.object({
            /** Cool baz number */
            baz: schematic.number().min(10)
        })
    })

    try {
        await schema.parse({ foo: "foo", bar: { baz: 9 } })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected value greater than or equal to 10 but received 9")
    }
})

test("should be able to pick fields from an object", async () => {
    const original = schematic.object({
        foo: schematic.string(),
        bar: schematic.number()
    })

    const picked = original.pick("foo")

    const result = await picked.parse({ foo: "foo" })

    expect(result).toEqual({ foo: "foo" })

    try {
        await picked.parse({ foo: "foo", bar: 10 })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Unexpected key 'bar'")
    }
})

test("should be able to omit fields from an object", async () => {
    const original = schematic.object({
        foo: schematic.string(),
        bar: schematic.number()
    })

    const omitted = original.omit("foo")

    const result = await omitted.parse({ bar: 10 })

    expect(result).toEqual({ bar: 10 })

    try {
        await omitted.parse({ foo: "foo", bar: 10 })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Unexpected key 'foo'")
    }
})

test("should allow making some keys partial", async () => {
    const base = schematic.object({
        foo: schematic.string(),
        bar: schematic.number()
    })

    const partial = base.partial("foo")

    const result = await partial.parse({ bar: 10 })

    expect(result).toEqual({ bar: 10 })

    try {
        await partial.parse({ foo: "foo" })
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe('"bar" is required')
    }

    const allPartial = base.partial()

    const result2 = await allPartial.parse({})

    expect(result2).toEqual({})
})

test("should allow making optional fields required", async () => {
    const base = schematic.object({
        foo: schematic.string().optional(),
        bar: schematic.number()
    })

    const required = base.required("foo")

    try {
        await required.parse({ bar: 10 })
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe('"foo" is required')
    }

    const result = await required.parse({ foo: "foo", bar: 10 })

    expect(result).toEqual({ foo: "foo", bar: 10 })

    const allRequired = base.required()

    try {
        await allRequired.parse({})
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.errors.length).toBe(2)
        expect(error.errors[0].message).toBe('"foo" is required')
        expect(error.errors[1].message).toBe('"bar" is required')
    }
})

test("should allow extending an object schema", async () => {
    const base = schematic.object({
        foo: schematic.string(),
        bar: schematic.number()
    })

    const extended = base.extend({
        baz: schematic.boolean()
    })

    const result = await extended.parse({ foo: "foo", bar: 10, baz: true })

    expect(result).toEqual({ foo: "foo", bar: 10, baz: true })
})

test("default keys should still populate if base object is undefined", async () => {
    const base = schematic.object({
        foo: schematic.string().default("foo"),
        bar: schematic.number().default(10)
    })

    const result = await base.parse(undefined)

    expect(result).toEqual({ foo: "foo", bar: 10 })
})

test("rejects type if not all properties have defaults and object is undefined", async () => {
    const base = schematic.object({
        foo: schematic.string().default("foo"),
        bar: schematic.number()
    })

    try {
        await base.parse(undefined)
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe('"bar" is required')
    }
})
