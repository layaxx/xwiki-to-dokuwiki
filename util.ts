import { existsSync, mkdirSync, writeFileSync } from "fs"
import { TreeData } from "."
import { dirname } from "path"

export function getNewPath(data: Data, resolvedTree: TreeData): string {
  let relPath =
    (resolvedTree
      .find((c) => c.name === data.name && c.web === data.web)
      ?.path.join("/") ?? "") +
    "/" +
    data.name

  relPath = relPath.toLowerCase().replace(/ /g, "_")

  let path = `./out/${relPath}.txt`

  while (existsSync(path)) {
    console.error(`File already exists: ${relPath}.txt`, data.web, data.name)
    relPath += "_1"
    path = `./out/${relPath}.txt`
  }

  mkdirSync(dirname(path), { recursive: true })

  const oldLink = data.web + "." + data.name

  if (relPath.startsWith("/")) relPath = relPath.slice(1)
  const newLink = "xwiki:" + relPath.replace(/\//g, ":")
  writeFileSync(`./out/links/${oldLink}.txt`, newLink)

  return path
}

export function convertLink(link: string) {
  return link.replace(/.?out\//g, "xwiki:").replace(/\//g, ":")
}

export function addTopLevelHeading(
  content: string,
  syntax: "xwiki/1.0" | "xwiki/2.0"
) {
  if (!content.length) return ""
  if (syntax === "xwiki/2.0") {
    return `= ${content} =\n`
  }
  return `1 ${content}`
}
