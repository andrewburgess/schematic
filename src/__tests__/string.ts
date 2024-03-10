import * as schematic from "../"
import { assertEqualType } from "../util"

const schema = schematic.string()

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof schema>, string>(true)
})

test("string parsing", async () => {
    await expect(schema.parse("hello")).resolves.toBe("hello")
    await expect(schema.parse(null)).rejects.toThrow()
    await expect(schema.parse(undefined)).rejects.toThrow()
    await expect(schema.parse({})).rejects.toThrow()
    await expect(schema.parse(1)).rejects.toThrow()
    await expect(schema.parse(true)).rejects.toThrow()
    await expect(schema.parse([])).rejects.toThrow()
})

test("allowed values", async () => {
    await expect(schema.allow("hello").parse("hello")).resolves.toBe("hello")
    await expect(schema.allow("hello").parse("world")).rejects.toThrow()
})

test("default string", async () => {
    await expect(schema.default("hello").parse(undefined)).resolves.toBe("hello")
    await expect(schema.default(() => "hello").parse(undefined)).resolves.toBe("hello")
    await expect(schema.default("").parse(null)).rejects.toThrow()
})

test("should allow coercion of values", async () => {
    const coerce = schema.coerce()
    await expect(coerce.parse(42)).resolves.toBe("42")
    await expect(coerce.parse(1.23)).resolves.toBe("1.23")
    await expect(coerce.parse(true)).resolves.toBe("true")
    await expect(coerce.parse(false)).resolves.toBe("false")
    await expect(coerce.parse(null)).resolves.toBe("null")
    await expect(coerce.parse(new Date(10))).resolves.toBeDefined()
    await expect(coerce.parse(undefined)).resolves.toBe("")
    await expect(coerce.parse(() => {})).rejects.toThrow()
    await expect(coerce.parse(Symbol("hi"))).rejects.toThrow()
})

test("string length", async () => {
    await expect(schema.length(3).parse("foo")).resolves.toBe("foo")
    await expect(schema.length(0).parse("")).resolves.toBe("")
    await expect(schema.length(3).parse("foobar")).rejects.toThrow()
    await expect(schema.length(3).parse("fo")).rejects.toThrow()
})

test("minimum length string", async () => {
    const min = schema.min(3)
    const minExclusive = schema.min(3, { exclusive: true })

    await expect(min.parse("foo")).resolves.toBe("foo")
    await expect(minExclusive.parse("foobar")).resolves.toBe("foobar")
    await expect(min.parse("fo")).rejects.toThrow()
    await expect(minExclusive.parse("foo")).rejects.toThrow()
})

test("maximum length string", async () => {
    const max = schema.max(3)
    const maxExclusive = schema.max(3, { exclusive: true })

    await expect(max.parse("foo")).resolves.toBe("foo")
    await expect(maxExclusive.parse("fo")).resolves.toBe("fo")
    await expect(max.parse("foobar")).rejects.toThrow()
    await expect(maxExclusive.parse("foo")).rejects.toThrow()
})

test("string regex", async () => {
    const regex = schema.regex(/foo/)

    await expect(regex.parse("foo")).resolves.toBe("foo")
    await expect(regex.parse("bar")).rejects.toThrow()
})

test("string email", async () => {
    const email = schematic.string().email()

    await expect(email.parse("test@example.com")).resolves.toBe("test@example.com")
    await expect(email.parse("test@example")).rejects.toThrow()
})

test("string suffix", async () => {
    const suffix = schema.endsWith("bar")

    await expect(suffix.parse("foobar")).resolves.toBe("foobar")
    await expect(suffix.parse("foo")).rejects.toThrow()
})

test("string prefix", async () => {
    const prefix = schema.startsWith("foo")

    await expect(prefix.parse("foobar")).resolves.toBe("foobar")
    await expect(prefix.parse("bar")).rejects.toThrow()
})

test("string substring", async () => {
    const substring = schema.includes("bar")

    await expect(substring.parse("foobar")).resolves.toBe("foobar")
    await expect(substring.parse("foo")).rejects.toThrow()
})

test("string transform lowercase", async () => {
    const lowercase = schema.toLowerCase()

    await expect(lowercase.parse("FOO")).resolves.toBe("foo")
    await expect(lowercase.parse("")).resolves.toBe("")
})

test("string transform uppercase", async () => {
    const uppercase = schema.toUpperCase()

    await expect(uppercase.parse("foo")).resolves.toBe("FOO")
    await expect(uppercase.parse("")).resolves.toBe("")
})

test("string transform trim", async () => {
    const trim = schema.trim()

    await expect(trim.parse("  foo  ")).resolves.toBe("foo")
    await expect(trim.parse("")).resolves.toBe("")
})

test("string mutation combination", async () => {
    const mutated = schema.trim().toUpperCase()

    await expect(mutated.parse("  foo  ")).resolves.toBe("FOO")
})
