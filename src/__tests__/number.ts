import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.number()

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof schema>, number>(true)
})

test("number parsing", async () => {
    await expect(schema.parse(42)).resolves.toBe(42)
    await expect(schema.parse(null)).rejects.toThrow()
    await expect(schema.parse(undefined)).rejects.toThrow()
    await expect(schema.parse({})).rejects.toThrow()
    await expect(schema.parse("hello")).rejects.toThrow()
    await expect(schema.parse(true)).rejects.toThrow()
    await expect(schema.parse([])).rejects.toThrow()
})

test("allowed values", async () => {
    await expect(schema.allow(42).parse(42)).resolves.toBe(42)
    await expect(schema.allow(42).parse(43)).rejects.toThrow()
})

test("default number", async () => {
    await expect(schema.default(42).parse(undefined)).resolves.toBe(42)
    await expect(schema.default(() => 42).parse(undefined)).resolves.toBe(42)
    await expect(schema.default(0).parse(null)).rejects.toThrow()
})

test("coerce number", async () => {
    const coerce = schema.coerce()
    await expect(coerce.parse("42")).resolves.toBe(42)
    await expect(coerce.parse("1.23")).resolves.toBe(1.23)
    await expect(coerce.parse(true)).resolves.toBe(1)
    await expect(coerce.parse(false)).resolves.toBe(0)
    await expect(coerce.parse(null)).resolves.toBe(0)
    await expect(coerce.parse(new Date(10))).resolves.toBe(10)
    await expect(coerce.parse("invalid")).rejects.toThrow()
    await expect(coerce.parse({})).rejects.toThrow()
    await expect(coerce.parse(undefined)).rejects.toThrow()
})

test("maximum number", async () => {
    const maxSchema = schema.max(10)
    const exclusiveMaxSchema = schema.max(10, { exclusive: true })

    await expect(maxSchema.parse(10)).resolves.toBe(10)
    await expect(exclusiveMaxSchema.parse(9)).resolves.toBe(9)
    await expect(maxSchema.parse(11)).rejects.toThrow()
    await expect(exclusiveMaxSchema.parse(10)).rejects.toThrow()
})

test("minimum number", async () => {
    const minSchema = schema.min(10)
    const exclusiveMinSchema = schema.min(10, { exclusive: true })

    await expect(minSchema.parse(10)).resolves.toBe(10)
    await expect(exclusiveMinSchema.parse(11)).resolves.toBe(11)
    await expect(minSchema.parse(9)).rejects.toThrow()
    await expect(exclusiveMinSchema.parse(10)).rejects.toThrow()
})

test("integer value", async () => {
    const integerSchema = schema.int()
    await expect(integerSchema.parse(42)).resolves.toBe(42)
    await expect(integerSchema.parse(42.1)).rejects.toThrow()
})

test("negative number", async () => {
    const negativeSchema = schema.negative()
    await expect(negativeSchema.parse(-1)).resolves.toBe(-1)
    await expect(negativeSchema.parse(0)).rejects.toThrow()
    await expect(negativeSchema.parse(1)).rejects.toThrow()
})

test("nonnegative number", async () => {
    const nonnegativeSchema = schema.nonnegative()
    await expect(nonnegativeSchema.parse(0)).resolves.toBe(0)
    await expect(nonnegativeSchema.parse(1)).resolves.toBe(1)
    await expect(nonnegativeSchema.parse(-1)).rejects.toThrow()
})

test("positive number", async () => {
    const positiveSchema = schema.positive()
    await expect(positiveSchema.parse(1)).resolves.toBe(1)
    await expect(positiveSchema.parse(0)).rejects.toThrow()
    await expect(positiveSchema.parse(-1)).rejects.toThrow()
})
