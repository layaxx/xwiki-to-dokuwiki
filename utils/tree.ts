import { TreeData } from "../types"

export function calculateTree(unresolved: TreeData): TreeData {
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
