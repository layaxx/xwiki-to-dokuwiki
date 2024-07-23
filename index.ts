import { XMLParser } from "fast-xml-parser"
import fs, { readFileSync, writeFileSync } from "fs"
import path from "path"
import { isUserPage, transformUserPage } from "./userpage"
import { transformContentPage } from "./contentpage"
import type { Data } from "./types"

async function getFiles(dir: string): Promise<string[]> {
  const subdirectories = fs.readdirSync(dir)
  const files = await Promise.all(
    subdirectories.map(async (subdirectory) => {
      const res = path.resolve(dir, subdirectory)
      return fs.statSync(res).isDirectory() ? getFiles(res) : res
    })
  )

  return files.reduce((a: string[], f) => a.concat(f), [])
}

function readFromPath(path: string): { xwikidoc: Data; path: string } {
  const XMLdata = fs.readFileSync(path, "utf8")

  const parser = new XMLParser()
  return { path, ...parser.parse(XMLdata) }
}

function getCreationYear(obj: { xwikidoc: Data }): number {
  return new Date(obj.xwikidoc.creationDate).getFullYear()
}

function getUpdateYear(obj: { xwikidoc: Data }): number {
  return new Date(obj.xwikidoc.contentUpdateDate).getFullYear()
}

function handleObject(
  obj: { xwikidoc: Data; path: string },
  resolvedTree: TreeData
) {
  if (!Object.keys(obj).includes("xwikidoc")) return

  if (isUserPage(obj)) {
    if (getCreationYear(obj) < 2018) {
      return transformUserPage(obj, resolvedTree)
    } else {
      skips.push({
        path: obj.path,
        reason: `User page is too new (${getCreationYear(obj)})`,
      })
      return
    }
  }

  if (obj.xwikidoc.content.length > 45 || obj.xwikidoc.attachment) {
    if (getCreationYear(obj) <= 2017) {
      if (getUpdateYear(obj) <= 2017) {
        return transformContentPage(obj, resolvedTree)
      } else {
        skips.push({
          path: obj.path,
          reason: `Page was recently updated (${getUpdateYear(obj)})`,
        })
      }
    } else {
      skips.push({
        path: obj.path,
        reason: `Page is too new (${getCreationYear(obj)})`,
      })
    }
  } else {
    skips.push({
      path: obj.path,
      reason: `No attachment and too little content (${obj.xwikidoc.content})`,
    })
  }
}

function timestamp() {
  const date = new Date()
  return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

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

export type TreeData = Array<{
  title: string
  name: string
  parent: string
  web: string
  path: string[]
}>

const skips: Array<{ path: string; reason: string }> = []

function main() {
  const treeData: TreeData = []

  const recreateTree = false

  fs.mkdirSync(`./out/links`, { recursive: true })
  getFiles("./backup").then((paths) => {
    console.log("found", paths.length, "files. Reading...")

    let resolvedTree: TreeData | undefined
    if (!recreateTree) {
      resolvedTree = JSON.parse(
        readFileSync("resolvedTree.json", { encoding: "utf-8" })
      )
    }

    const allPages = paths.map((path, idx) => {
      if (!(idx % 100))
        console.log(timestamp(), "Reading", idx, "of", paths.length)
      const object = readFromPath(path)

      if (object.xwikidoc && ["", "en"].includes(object.xwikidoc.language)) {
        if (resolvedTree && !recreateTree) {
          handleObject(object!, resolvedTree!)
          return
        } else {
          treeData.push({
            parent: object.xwikidoc.parent,
            title: object.xwikidoc.title,
            name: object.xwikidoc?.name,
            web: object.xwikidoc?.web,
            path: [],
          })
        }

        return object
      }

      console.error(
        "Skipping",
        object.path,
        object.xwikidoc?.content.length,
        object.xwikidoc?.attachment
      )
    })

    if (recreateTree) {
      resolvedTree = calculateTree(treeData)
      writeFileSync("resolvedTree.json", JSON.stringify(resolvedTree))

      allPages.filter(Boolean).map((object, idx, array) => {
        if (!(idx % 100))
          console.log(timestamp(), "Parsing", idx, "of", array.length)
        handleObject(object!, resolvedTree!)
      })
    }

    fs.writeFileSync("./skips.json", JSON.stringify(skips, null, 2))

    console.log("done")
  })
}

main()
