import * as j from "jscodeshift"

function replaceZodImport(zodImport: j.Collection<j.ImportDeclaration>) {
    zodImport.replaceWith(
        j.importDeclaration(
            [j.importNamespaceSpecifier(j.identifier("schematic"))],
            j.literal("@andrewburgess/schematic")
        )
    )
}

function replaceZodCalls(zodName: string, root: j.Collection<any>) {
    root.find(j.CallExpression, {
        callee: {
            object: {
                name: zodName
            }
        }
    }).forEach((node) => {
        const nameNode = node.get("callee").get("object")
        nameNode.replace(j.identifier("schematic"))

        const propertyNode = node.get("callee").get("property")
        const propertyName = propertyNode.get("name").value
        if (propertyName === "nativeEnum") {
            propertyNode.replace(j.identifier("enum"))
        }

        if (propertyName === "datetime") {
            console.log("datetime")
        }
    })
}

function replaceZodInfers(zodName: string, root: j.Collection<any>) {
    root.find(j.TSQualifiedName, {
        left: {
            name: zodName
        },
        right: {
            name: "infer"
        }
    }).replaceWith(j.tsQualifiedName(j.identifier("schematic"), j.identifier("Infer")))
}

function replaceZodMemberExpression(zodName: string, root: j.Collection<any>) {
    root.find(j.MemberExpression, {
        object: {
            name: zodName
        }
    }).forEach((node) => {
        const nameNode = node.get("object")
        nameNode.replace(j.identifier("schematic"))

        const propertyNode = node.get("property")
        if (propertyNode.get("name").value === "ZodIssueCode") {
            propertyNode.replace(j.identifier("SchematicErrorType"))
        }
    })
}

function fixObjectFunctionArguments(root: j.Collection<any>) {
    root.find(j.Identifier, (id) =>
        ["omit", "pick", "partial", "required"].includes(id.name)
    ).forEach((node) => {
        const caller = j(node).closest(j.CallExpression)
        const object = caller.find(j.ObjectExpression)
        const props = object.find(j.ObjectProperty)
        if (props.length) {
            const keys: string[] = []
            props.forEach((prop) => {
                if (prop.get("value").value.value === true) {
                    keys.push(prop.get("key").value.name)
                }
            })

            if (keys.length) {
                object.replaceWith(keys.map((key) => j.literal(key)))
            }
        }
    })
}

function removeZodTypeDefinitions(zodName: string, root: j.Collection<any>) {
    const typeNamesToRemove: string[] = []
    root.find(j.TSTypeReference, {
        typeName: {
            left: {
                name: zodName
            }
        }
    }).forEach((node) => {
        const parent = node.parent

        if (j(parent).isOfType(j.TSTypeAliasDeclaration)) {
            const exportNodes = j(parent).closest(j.ExportNamedDeclaration)
            if (exportNodes.length > 0) {
                // Find named references in this file and remove them
                exportNodes.forEach((exportNode) => {
                    const exportNodeName = exportNode.get("declaration").get("id").value.name
                    typeNamesToRemove.push(exportNodeName)
                })
                exportNodes.remove()
            } else {
                j(parent).remove()
            }
        }
    })

    root.find(j.TSTypeReference, (node) => {
        if (node.typeName.type !== "Identifier") {
            return false
        }

        return typeNamesToRemove.includes(node.typeName.name)
    }).forEach((node) => {
        j(node.parent).remove()
    })
}

const transform: j.Transform = function transformer(file, api, options) {
    const j = api.jscodeshift
    const root = j(file.source)

    const zodImport = root.find(j.ImportDeclaration, {
        source: {
            value: "zod"
        }
    })

    if (zodImport.length === 0) {
        return file.source
    }

    let zodImportSpecifier:
        | j.Collection<j.ImportSpecifier>
        | j.Collection<j.ImportNamespaceSpecifier> = zodImport.find(j.ImportSpecifier)
    if (zodImportSpecifier.length === 0) {
        zodImportSpecifier = zodImport.find(j.ImportNamespaceSpecifier)
    }
    const zodName = zodImportSpecifier.find(j.Identifier).get(0).node.name

    if (zodName === undefined) {
        console.error("Could not find zod name")
        return file.source
    }

    replaceZodImport(zodImport)
    replaceZodCalls(zodName, root)
    replaceZodInfers(zodName, root)
    replaceZodMemberExpression(zodName, root)

    root.find(j.Identifier, { name: "addIssue" }).replaceWith(j.identifier("addError"))

    fixObjectFunctionArguments(root)

    removeZodTypeDefinitions(zodName, root)

    return root.toSource({ lineTerminator: "\n", quote: "single" })
}

module.exports = transform
