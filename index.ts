import fs, { readFileSync, writeFileSync } from "fs"
import { isUserPage, transformUserPage } from "./userpage"
import { transformContentPage } from "./contentpage"
import type { Data, TreeData } from "./types"
import {
  getUpdateYear,
  getCreationYear,
  timestamp,
  getFiles,
  readFromPath,
} from "./util"
import { calculateTree } from "./utils/tree"

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
        const result = transformContentPage(obj, resolvedTree)

        if (result.skip) {
          skips.push({ path: obj.path, reason: result.reason })
        }

        return
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
        if (idx % 100 === 0)
          console.log(timestamp(), "Parsing", idx, "of", array.length)
        handleObject(object!, resolvedTree!)
      })
    }

    fs.writeFileSync("./logs/skips.json", JSON.stringify(skips, null, 2))

    console.log("done")
  })
}

main()
