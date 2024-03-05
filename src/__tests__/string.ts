import * as schematic from "../"

const schema = schematic.string()

test("should parse a string", async () => {
    const result = await schema.parse("foo")

    expect(result).toBe("foo")
})

test("should throw an error if the value is not a string", async () => {
    try {
        await schema.parse(123)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string but received number")
    }
})

test("should allow setting a default value", async () => {
    const result = await schema.default("default").parse(undefined)

    expect(result).toBe("default")
})

test("should allow setting a default value with a function", async () => {
    const result = await schema.default(() => "default").parse(undefined)

    expect(result).toBe("default")
})

test("should fail with null even with empty string as default", async () => {
    try {
        await schema.default("").parse(null)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string but received null")
    }
})

test("should allow coercion of values", async () => {
    await Promise.all([
        expect(schema.coerce().parse(42)).resolves.toBe("42"),
        expect(schema.coerce().parse(1.23)).resolves.toBe("1.23"),
        expect(schema.coerce().parse(true)).resolves.toBe("true"),
        expect(schema.coerce().parse(false)).resolves.toBe("false"),
        expect(schema.coerce().parse(null)).resolves.toBe("null"),
        expect(schema.coerce().parse(new Date(10))).resolves.toBeDefined(),
        expect(schema.coerce().parse(undefined)).resolves.toBe("")
    ])
})

test("should reject invalid coercions", async () => {
    await Promise.all([
        expect(schema.coerce().parse({})).rejects.toThrow("Expected string but received object"),
        expect(schema.coerce().parse(Symbol())).rejects.toThrow(
            "Expected string but received symbol"
        ),
        expect(schema.coerce().parse(() => "invalid")).rejects.toThrow(
            "Expected string but received function"
        )
    ])
})

test("should allow setting a length", async () => {
    const result = await schema.length(3).parse("foo")

    expect(result).toBe("foo")
})

test("should fail if the length is incorrect", async () => {
    try {
        await schema.length(3).parse("foobar")
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe(
            "Expected string with length 3 but received string with length 6"
        )
    }
})

test("should allow setting a minimum length", async () => {
    const result = await schema.min(3).parse("foobar")

    expect(result).toBe("foobar")

    const result2 = await schema.min(3).parse("foo")

    expect(result2).toBe("foo")

    try {
        await schema.min(3).parse("fo")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe(
            "Expected string with length at least 3 but received string with length 2"
        )
    }
})

test("should allow setting an exclusive minimum length", async () => {
    const result = await schema.min(3, { exclusive: true }).parse("foobar")

    expect(result).toBe("foobar")

    try {
        await schema.min(3, { exclusive: true }).parse("foo")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe(
            "Expected string with length more than 3 but received string with length 3"
        )
    }
})

test("should allow setting a maximum length", async () => {
    const result = await schema.max(3).parse("foo")

    expect(result).toBe("foo")

    const result2 = await schema.max(3).parse("fo")

    expect(result2).toBe("fo")

    try {
        await schema.max(3).parse("foobarz")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe(
            "Expected string with length at most 3 but received string with length 7"
        )
    }
})

test("should allow setting an exclusive maximum length", async () => {
    const result = await schema.max(3, { exclusive: true }).parse("fo")

    expect(result).toBe("fo")

    try {
        await schema.max(3, { exclusive: true }).parse("foo")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe(
            "Expected string with length less than 3 but received string with length 3"
        )
    }
})

test("should allow setting a regex", async () => {
    const result = await schema.regex(/foo/).parse("foo")

    expect(result).toBe("foo")

    try {
        await schema.regex(/foo/).parse("bar")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string to match /foo/ but received bar")
    }
})

test("should allow setting a custom error message for regex", async () => {
    try {
        await schema.regex(/foo/, { message: "must be foo" }).parse("bar")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("must be foo")
    }
})

test("should allow checking an email address", async () => {
    const email = schematic.string().email()

    const result = await email.parse("test@example.com")

    expect(result).toBe("test@example.com")

    try {
        await email.parse("test@example")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string to be a valid email address")
    }
})

test("should allow specifying a suffix", async () => {
    const result = await schema.endsWith("bar").parse("foobar")

    expect(result).toBe("foobar")

    try {
        await schema.endsWith("bar").parse("foo")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string to end with bar but received foo")
    }
})

test("should allow specify a prefix", async () => {
    const result = await schema.startsWith("foo").parse("foobar")

    expect(result).toBe("foobar")

    try {
        await schema.startsWith("foo").parse("bar")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string to start with foo but received bar")
    }
})

test("should allow specifying a substring", async () => {
    const result = await schema.includes("bar").parse("foobarbaz")

    expect(result).toBe("foobarbaz")

    try {
        await schema.includes("bar").parse("foobaz")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected string to include bar but received foobaz")
    }
})
