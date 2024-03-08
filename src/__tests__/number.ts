import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.number()

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof schema>, number>(true)
})

test("number parsing", async () => {
    await Promise.all([
        expect(schema.parse(42)).resolves.toBe(42),

        expect(schema.parse(null)).rejects.toThrow(),
        expect(schema.parse(undefined)).rejects.toThrow(),
        expect(schema.parse({})).rejects.toThrow(),
        expect(schema.parse("hello")).rejects.toThrow(),
        expect(schema.parse(true)).rejects.toThrow(),
        expect(schema.parse([])).rejects.toThrow()
    ])
})

test("default number", async () => {
    await Promise.all([
        expect(schema.default(42).parse(undefined)).resolves.toBe(42),
        expect(schema.default(() => 42).parse(undefined)).resolves.toBe(42),

        expect(schema.default(0).parse(null)).rejects.toThrow()
    ])
})

test("coerce number", async () => {
    const coerce = schema.coerce()
    await Promise.all([
        expect(coerce.parse("42")).resolves.toBe(42),
        expect(coerce.parse("1.23")).resolves.toBe(1.23),
        expect(coerce.parse(true)).resolves.toBe(1),
        expect(coerce.parse(false)).resolves.toBe(0),
        expect(coerce.parse(null)).resolves.toBe(0),
        expect(coerce.parse(new Date(10))).resolves.toBe(10),

        expect(coerce.parse("invalid")).rejects.toThrow(),
        expect(coerce.parse({})).rejects.toThrow(),
        expect(coerce.parse(undefined)).rejects.toThrow()
    ])
})

test("maximum number", async () => {
    const maxSchema = schema.max(10)
    const exclusiveMaxSchema = schema.max(10, { exclusive: true })

    await Promise.all([
        expect(maxSchema.parse(10)).resolves.toBe(10),
        expect(exclusiveMaxSchema.parse(9)).resolves.toBe(9),

        expect(maxSchema.parse(11)).rejects.toThrow(),
        expect(exclusiveMaxSchema.parse(10)).rejects.toThrow()
    ])
})

test("minimum number", async () => {
    const minSchema = schema.min(10)
    const exclusiveMinSchema = schema.min(10, { exclusive: true })

    await Promise.all([
        expect(minSchema.parse(10)).resolves.toBe(10),
        expect(exclusiveMinSchema.parse(11)).resolves.toBe(11),

        expect(minSchema.parse(9)).rejects.toThrow(),
        expect(exclusiveMinSchema.parse(10)).rejects.toThrow()
    ])
})
