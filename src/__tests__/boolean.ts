import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.boolean()

test("type inference", async () => {
    assertEqualType<schematic.Infer<typeof schema>, boolean>(true)
})

test("boolean parsing", async () => {
    await Promise.all([
        expect(schema.parse(true)).resolves.toBe(true),
        expect(schema.parse(false)).resolves.toBe(false),

        expect(schema.parse(null)).rejects.toThrow(),
        expect(schema.parse(undefined)).rejects.toThrow(),
        expect(schema.parse({})).rejects.toThrow(),
        expect(schema.parse(1)).rejects.toThrow(),
        expect(schema.parse("hello")).rejects.toThrow()
    ])
})

test("default value", async () => {
    await Promise.all([
        expect(schema.default(true).parse(undefined)).resolves.toBe(true),
        expect(schema.default(() => true).parse(undefined)).resolves.toBe(true),

        expect(schema.default(false).parse(null)).rejects.toThrow()
    ])
})

test("coercion", async () => {
    const coerce = schema.coerce()
    await Promise.all([
        expect(coerce.parse("true")).resolves.toBe(true),
        expect(coerce.parse("false")).resolves.toBe(false),
        expect(coerce.parse("TRUE")).resolves.toBe(true),
        expect(coerce.parse("FALSE")).resolves.toBe(false),
        expect(coerce.parse(1)).resolves.toBe(true),
        expect(coerce.parse(0)).resolves.toBe(false),
        expect(coerce.parse("invalid")).rejects.toThrow(),
        expect(coerce.parse({})).rejects.toThrow(),
        expect(coerce.parse(null)).rejects.toThrow(),
        expect(coerce.parse(undefined)).rejects.toThrow(),
        expect(coerce.parse(NaN)).rejects.toThrow(),
        expect(coerce.parse(Infinity)).rejects.toThrow(),
        expect(coerce.parse(-Infinity)).rejects.toThrow()
    ])
})
