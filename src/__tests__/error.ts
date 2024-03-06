import * as schematic from "../"

test("should flatten errors into a single array", async () => {
    const schema = schematic
        .object({
            name: schematic.string(),
            address: schematic.object({
                street: schematic.string(),
                city: schematic.string(),
                state: schematic.string(),
                components: schematic.object({
                    prefix: schematic.string(),
                    suffix: schematic.string()
                })
            })
        })
        .or(
            schematic.object({
                name: schematic.string(),
                age: schematic.number(),
                address: schematic.object({
                    fullAddress: schematic.string()
                })
            })
        )

    const result = await schema.safeParse({})

    expect(result.isValid).toBe(false)
    const errors = result.isValid ? [] : result.errors

    expect(errors).toHaveLength(10)
})
