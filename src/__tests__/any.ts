import * as schematic from "../"
import { assertEqualType } from "../util"

test("type inference should be any", () => {
    const anySchema = schematic.any().optional().nullable()
    assertEqualType<schematic.Infer<typeof anySchema>, any>(true)
    assertEqualType<schematic.AnyValueSchematic, typeof anySchema>(true)
})
