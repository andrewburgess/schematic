import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.string()

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof schema>, string>(true)
})

test("string parsing", async () => {
    await Promise.all([
        expect(schema.parse("hello")).resolves.toBe("hello"),

        expect(schema.parse(null)).rejects.toThrow(),
        expect(schema.parse(undefined)).rejects.toThrow(),
        expect(schema.parse({})).rejects.toThrow(),
        expect(schema.parse(1)).rejects.toThrow(),
        expect(schema.parse(true)).rejects.toThrow(),
        expect(schema.parse([])).rejects.toThrow()
    ])
})

test("default string", async () => {
    await Promise.all([
        expect(schema.default("hello").parse(undefined)).resolves.toBe("hello"),
        expect(schema.default(() => "hello").parse(undefined)).resolves.toBe("hello"),

        expect(schema.default("").parse(null)).rejects.toThrow()
    ])
})

test("should allow coercion of values", async () => {
    const coerce = schema.coerce()
    await Promise.all([
        expect(coerce.parse(42)).resolves.toBe("42"),
        expect(coerce.parse(1.23)).resolves.toBe("1.23"),
        expect(coerce.parse(true)).resolves.toBe("true"),
        expect(coerce.parse(false)).resolves.toBe("false"),
        expect(coerce.parse(null)).resolves.toBe("null"),
        expect(coerce.parse(new Date(10))).resolves.toBeDefined(),
        expect(coerce.parse(undefined)).resolves.toBe("")
    ])
})

test("string length", async () => {
    await Promise.all([
        expect(schema.length(3).parse("foo")).resolves.toBe("foo"),
        expect(schema.length(0).parse("")).resolves.toBe(""),

        expect(schema.length(3).parse("foobar")).rejects.toThrow(),
        expect(schema.length(3).parse("fo")).rejects.toThrow()
    ])
})

test("minimum length string", async () => {
    const min = schema.min(3)
    const minExclusive = schema.min(3, { exclusive: true })

    await Promise.all([
        expect(min.parse("foo")).resolves.toBe("foo"),
        expect(minExclusive.parse("foobar")).resolves.toBe("foobar"),

        expect(min.parse("fo")).rejects.toThrow(),
        expect(minExclusive.parse("foo")).rejects.toThrow()
    ])
})

test("maximum length string", async () => {
    const max = schema.max(3)
    const maxExclusive = schema.max(3, { exclusive: true })

    await Promise.all([
        expect(max.parse("foo")).resolves.toBe("foo"),
        expect(maxExclusive.parse("fo")).resolves.toBe("fo"),

        expect(max.parse("foobar")).rejects.toThrow(),
        expect(maxExclusive.parse("foo")).rejects.toThrow()
    ])
})

test("string regex", async () => {
    const regex = schema.regex(/foo/)

    await Promise.all([
        expect(regex.parse("foo")).resolves.toBe("foo"),

        expect(regex.parse("bar")).rejects.toThrow()
    ])
})

test("string email", async () => {
    const email = schematic.string().email()

    await Promise.all([
        expect(email.parse("test@example.com")).resolves.toBe("test@example.com"),

        expect(email.parse("test@example")).rejects.toThrow()
    ])
})

test("string suffix", async () => {
    const suffix = schema.endsWith("bar")

    await Promise.all([
        expect(suffix.parse("foobar")).resolves.toBe("foobar"),

        expect(suffix.parse("foo")).rejects.toThrow()
    ])
})

test("string prefix", async () => {
    const prefix = schema.startsWith("foo")

    await Promise.all([
        expect(prefix.parse("foobar")).resolves.toBe("foobar"),

        expect(prefix.parse("bar")).rejects.toThrow()
    ])
})

test("string substring", async () => {
    const substring = schema.includes("bar")

    await Promise.all([
        expect(substring.parse("foobar")).resolves.toBe("foobar"),

        expect(substring.parse("foo")).rejects.toThrow()
    ])
})
