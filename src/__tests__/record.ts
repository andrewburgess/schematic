import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.record(schematic.string())

test("type inference", async () => {
    assertEqualType<schematic.Infer<typeof schema>, Partial<Record<string, string>>>(true)
})

test("record parsing", async () => {
    let validMap = new Map()
    validMap.set("foo", "hello")
    let invalidMap = new Map()
    invalidMap.set(1, "hello")

    await expect(schema.parse({ foo: "hello", bar: "world" })).resolves.toEqual({
        foo: "hello",
        bar: "world"
    })
    await expect(schema.parse({})).resolves.toEqual({})
    await expect(schema.parse(validMap)).resolves.toEqual({ foo: "hello" })
    await expect(schema.parse(invalidMap)).rejects.toThrow()
    await expect(schema.parse(null)).rejects.toThrow()
    await expect(schema.parse(undefined)).rejects.toThrow()
    await expect(schema.parse(1)).rejects.toThrow()
    await expect(schema.parse("hello")).rejects.toThrow()
    await expect(schema.parse({ foo: 123 })).rejects.toThrow()
    await expect(schema.parse(["foo", "bar"])).rejects.toThrow()

    const validatedKey = schematic.record(schematic.string().length(5), schematic.number())
    await expect(validatedKey.parse({ hello: 123 })).resolves.toEqual({ hello: 123 })
    await expect(validatedKey.parse({ foo: 123 })).rejects.toThrow()

    enum Keys {
        hello = "hello",
        world = "world"
    }
    const enumKey = schematic.record(schematic.enum(Keys), schematic.number())
    await expect(enumKey.parse({ hello: 123 })).resolves.toEqual({ hello: 123 })
})

test("value parsing", async () => {
    const schema = schematic.record(
        schematic.string(),
        schematic.object({ foo: schematic.number(), bar: schematic.boolean().optional() })
    )

    const result = await schema.parse({ bar: { foo: 123 } })

    expect(result).toEqual({ bar: { foo: 123 } })
})

test("parsing with tests", async () => {
    const testSchema = schematic.record(
        schematic.string().test((value) => value === "hello"),
        schematic.number().test((value) => value === 123)
    )

    await expect(testSchema.parse({ hello: 123 })).resolves.toEqual({ hello: 123 })
    await expect(testSchema.parse({ hello: 456 })).rejects.toThrow()
    await expect(testSchema.parse({ foo: 123 })).rejects.toThrow()
})

test("keySchema and valueSchema access", async () => {
    await expect(schema.keySchema.parse("hello")).resolves.toBe("hello")
    await expect(schema.valueSchema.parse("world")).resolves.toBe("world")
})
