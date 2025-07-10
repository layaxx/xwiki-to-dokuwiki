import { XMLParser } from "fast-xml-parser"
import { readdir, readFile, stat, writeFile, mkdir } from "fs/promises"
import { Data } from "../types"
import { resolve, join } from "path"
import { PrismaClient, Prisma } from "../generated/prisma"

const prisma = new PrismaClient()
const parser = new XMLParser()

async function readFromPathAsync(path: string): Promise<{
  xwikidoc: Data & {
    object: Array<{
      class?: {
        name?: string
      }
      property: Array<Record<string, string | number>>
    }>
  }
  path: string
}> {
  const XMLdata = await readFile(path, "utf8")

  const data = parser.parse(XMLdata)

  return {
    path,
    ...data,
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const subdirectories = readdir(dir)
  const files = await Promise.all(
    (
      await subdirectories
    ).map(async (subdirectory) => {
      const res = resolve(dir, subdirectory)
      return (await stat(res)).isDirectory() ? getFiles(res) : res
    })
  )

  return files.reduce((a: string[], f) => a.concat(f), [])
}

export async function convertFromXML() {
  const paths = await getFiles("./backup")

  await Promise.all(
    paths.map(async (path) => {
      const object = await readFromPathAsync(path)

      if (object.xwikidoc && ["", "en"].includes(object.xwikidoc.language)) {
        const data = {
          ...object.xwikidoc,
          web: String(object.xwikidoc.web),
          name: String(object.xwikidoc.name),
          object: object.xwikidoc.object || [],
          title: String(object.xwikidoc.title),
          path: object.path,
        }
        let attachments
        if (object.xwikidoc.attachment) {
          attachments = Array.isArray(object.xwikidoc.attachment)
            ? object.xwikidoc.attachment
            : [object.xwikidoc.attachment]
        }

        delete data.class

        await prisma.xWikiPage.create({
          data: {
            ...data,
            attachment: attachments
              ? { createMany: { data: attachments } }
              : undefined,
          },
        })
      }

      console.error(
        "Skipping",
        object.path,
        object.xwikidoc?.content.length,
        object.xwikidoc?.attachment
      )
    })
  )
}

await convertFromXML()
