import { PrismaClient } from "../generated/prisma"
import { TreeData } from "../types"

const prisma = new PrismaClient()

function calculateTree(unresolved: TreeData): TreeData {
  const completelyResolved: TreeData = []

  for (let i = 0; i < 15; i++) {
    let stillUnresolved: TreeData = []

    let whCount = 0
    let otherCount = 0

    for (const child of unresolved) {
      if (!child.parent) {
        if (!child.path) child.path = []
        completelyResolved.push(child)
      } else {
        const parentToResolve = child.parent.split(".").at(-1)

        let parent: TreeData[0] | undefined

        if (parentToResolve === "WebHome") {
          parent = completelyResolved.find(
            (c) => c.name === parentToResolve && c.web === child.web
          )
          whCount++
        } else {
          parent = completelyResolved.find((c) => c.name === parentToResolve)
          otherCount++
        }

        if (!parent) {
          stillUnresolved.push(child)
          continue
        }

        child.path = [
          ...parent.path,
          parent.name === "WebHome" ? parent.web : parent.name,
        ]

        completelyResolved.push(child)
      }
    }

    unresolved = stillUnresolved
  }

  return completelyResolved.concat(
    unresolved.map((entry) => ({
      ...entry,
      path: [entry.parent.split(".").pop() ?? "unresolved"],
    }))
  )
}

async function main() {
  const tree: TreeData = []

  const data = await prisma.xWikiPage.findMany({
    select: { parent: true, title: true, name: true, web: true },
  })

  const resolvedTree = calculateTree(
    data.map((page) => ({ ...page, path: [] }))
  )

  await prisma.tree.deleteMany()

  await prisma.tree.createMany({ data: resolvedTree })
}

await main()
