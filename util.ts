import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs"
import path, { dirname } from "path"
import type { Data, TreeData } from "./types"
import { XMLParser } from "fast-xml-parser"
import { XWikiPage } from "./generated/prisma"

const parser = new XMLParser()

export function convertToUTF8(str: string): string {
  // Common mojibake patterns when UTF-8 is misread as Latin-1
  const likelyMojibakePatterns = [
    /Ã./, // Ã¼, Ã¶, etc.
    /Â./, // Â for some quotes/currency
    /â€/, // Smart quotes: â€œ, â€˜, etc.
    /â€“/, // en dash
    /â€”/, // em dash
    /â€¦/, // ellipsis
  ]

  const looksLikeMojibake = likelyMojibakePatterns.some((regex) =>
    regex.test(str)
  )

  if (looksLikeMojibake) {
    const buf = Buffer.from(str, "latin1")
    const decoded = buf.toString("utf8")

    return decoded
  }

  return str // No change needed
}
export function getNewPath(data: Data, resolvedTree: TreeData): string {
  let relPath =
    (
      resolvedTree
        .find((c) => c.name === data.name && c.web === data.web)
        ?.path.join("/") ?? ""
    ).replace(/_/g, "/") +
    "/" +
    data.name

  relPath = relPath
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/xwiki\/xwikiusers/, "users")

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
  return `1 ${content}\n`
}

export function getCreationYear(obj: { xwikidoc: Data }): number {
  return new Date(obj.xwikidoc.creationDate).getFullYear()
}

export function getUpdateYear(obj: { xwikidoc: Data }): number {
  return new Date(obj.xwikidoc.contentUpdateDate).getFullYear()
}

export function timestamp() {
  const date = new Date()
  return `[${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}]`
}

export async function getFiles(dir: string): Promise<string[]> {
  const subdirectories = readdirSync(dir)
  const files = await Promise.all(
    subdirectories.map(async (subdirectory) => {
      const res = path.resolve(dir, subdirectory)
      return statSync(res).isDirectory() ? getFiles(res) : res
    })
  )

  return files.reduce((a: string[], f) => a.concat(f), [])
}

export function readFromPath(path: string): { xwikidoc: Data; path: string } {
  const XMLdata = readFileSync(path, "utf8")

  return { path, ...parser.parse(XMLdata) }
}

export function isUserPageDB(
  object: Pick<XWikiPage, "content" | "object" | "parent">
): boolean {
  if (object && object.parent === "Main.Mitglieder") {
    return true
  }
  return (
    !!object &&
    (object.content.includes("XWikiUserSheet") ||
      object.content.includes("XWikiUserTemplate")) &&
    Array.isArray(object.object) &&
    object.object.some(
      (ob) =>
        typeof ob === "object" &&
        !Array.isArray(ob) &&
        ob &&
        ob.class &&
        typeof ob.class === "object" &&
        ob.class &&
        !Array.isArray(ob.class) &&
        ob.class.name === "XWiki.XWikiUsers"
    )
  )
}
