import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.boolean()

test("type inference", async () => {
    assertEqualType<schematic.Infer<typeof schema>, boolean>(true)
})

test("boolean parsing", async () => {
    await expect(schema.parse(true)).resolves.toBe(true)
    await expect(schema.parse(false)).resolves.toBe(false)

    await expect(schema.parse(null)).rejects.toThrow()
    await expect(schema.parse(undefined)).rejects.toThrow()
    await expect(schema.parse({})).rejects.toThrow()
    await expect(schema.parse(1)).rejects.toThrow()
    await expect(schema.parse("hello")).rejects.toThrow()
})

test("allowed values", async () => {
    await expect(schema.allow(true).parse(true)).resolves.toBe(true)
    await expect(schema.allow(true).parse(false)).rejects.toThrow()
})

test("coercion", async () => {
    const coerce = schema.coerce()
    await expect(coerce.parse("true")).resolves.toBe(true)
    await expect(coerce.parse("false")).resolves.toBe(false)
    await expect(coerce.parse("TRUE")).resolves.toBe(true)
    await expect(coerce.parse("FALSE")).resolves.toBe(false)
    await expect(coerce.parse(1)).resolves.toBe(true)
    await expect(coerce.parse(0)).resolves.toBe(false)
    await expect(coerce.parse("invalid")).rejects.toThrow()
    await expect(coerce.parse({})).rejects.toThrow()
    await expect(coerce.parse(null)).rejects.toThrow()
    await expect(coerce.parse(undefined)).rejects.toThrow()
    await expect(coerce.parse(NaN)).rejects.toThrow()
    await expect(coerce.parse(Infinity)).rejects.toThrow()
    await expect(coerce.parse(-Infinity)).rejects.toThrow()
})

test("default value", async () => {
    await expect(schema.default(true).parse(undefined)).resolves.toBe(true)
    await expect(schema.default(() => true).parse(undefined)).resolves.toBe(true)

    await expect(schema.default(false).parse(null)).rejects.toThrow()
})
