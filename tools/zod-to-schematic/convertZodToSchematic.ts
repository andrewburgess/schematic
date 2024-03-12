import * as j from "jscodeshift"

const transform: j.Transform = function transformer(file, api, options) {
    const j = api.jscodeshift
    const root = j(file.source)

    function replaceZodImport(zodImport: j.Collection<j.ImportDeclaration>) {
        zodImport.replaceWith(
            j.importDeclaration(
                [j.importNamespaceSpecifier(j.identifier("schematic"))],
                j.literal("@andrewburgess/schematic")
            )
        )
    }

    function replaceZodCalls(zodName: string) {
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
        })

        root.find(j.Identifier, {
            name: "refine"
        }).replaceWith(j.identifier("test"))
    }

    function replaceZodReturnTypes(zodName: string) {
        root.find(j.TSTypeReference, {
            typeName: {
                left: {
                    name: zodName
                }
            }
        }).forEach((node) => {
            if (node.parent && (node as any).parent.name === "returnType") {
                j(node.parent).remove()
            }
        })
    }

    function replaceZodTypeDefinitions(zodName: string) {
        root.find(j.TSQualifiedName, {
            left: {
                name: zodName
            },
            right: {
                name: "infer"
            }
        }).replaceWith(j.tsQualifiedName(j.identifier("schematic"), j.identifier("Infer")))

        root.find(j.TSQualifiedName, {
            left: {
                name: zodName
            },
            right: {
                name: "ZodSchema"
            }
        }).replaceWith(j.tsQualifiedName(j.identifier("schematic"), j.identifier("Schematic")))
    }

    function replaceZodMemberExpression(zodName: string) {
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

    function fixObjectFunctionArguments() {
        root.find(
            j.CallExpression,
            (node: j.CallExpression) =>
                node.callee &&
                (node.callee as any) &&
                (node.callee as any).property &&
                ["omit", "pick", "partial", "required"].includes((node.callee as any).property.name)
        ).forEach((node) => {
            const callee = node.node.callee
            if (!callee || callee.type !== "MemberExpression") {
                return
            }

            const args: any = node.node.arguments[0]
            if (args && args.properties) {
                const keys = args.properties.map((arg: any) => arg.key.name)
                node.node.arguments = [...keys.map((key: string) => j.literal(key))]
            }
        })
    }

    function removeZodTypeDefinitions(zodName: string) {
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
    replaceZodCalls(zodName)
    replaceZodTypeDefinitions(zodName)
    replaceZodReturnTypes(zodName)
    replaceZodMemberExpression(zodName)

    root.find(j.Identifier, { name: "addIssue" }).replaceWith(j.identifier("addError"))

    fixObjectFunctionArguments()

    removeZodTypeDefinitions(zodName)

    return root.toSource({ lineTerminator: "\n", quote: "single" })
}

module.exports = transform
