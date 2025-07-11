import { dirname, join } from "path"
import { Attachment, PrismaClient, XWikiPage } from "../generated/prisma"
import { addTopLevelHeading, convertToUTF8, isUserPageDB } from "../util"
import { mkdir, writeFile } from "fs/promises"
import { write } from "fs"

const prisma = new PrismaClient()

const takenPaths = new Set<string>()

function handleAndLinkContentPageAttachment(
  attachment: Attachment,
  path: string,
  syntax: "xwiki/1.0" | "xwiki/2.0"
) {
  const oldFilename = attachment.filename
  attachment.filename =
    crypto.randomUUID().slice(0, 8) + "-" + attachment.filename.toLowerCase()
  let attachmentPath = join(
    "out",
    "_attach",
    path.replace("out/", ""),
    attachment.filename
  ).toLowerCase()

  const link =
    syntax === "xwiki/2.0"
      ? "[[attach:" + attachment.filename + "]]\n\n"
      : "{attach:" +
        attachment.filename +
        "|file=" +
        attachment.filename +
        "}\n\n"
  return {
    attachmentPath,
    content: attachment.content,
    link,
    oldFilename,
    newFilename: attachment.filename,
  }
}

async function getNewPath(data: XWikiPage): Promise<string> {
  const tree = await prisma.tree.findFirst({
    where: { name: data.name, web: data.web },
    select: { path: true },
  })

  if (!tree) {
    console.error(`Tree not found for ${data.name} in ${data.web}`)
    return ""
  }

  if (!Array.isArray(tree.path)) {
    console.error(`Invalid path for ${data.name} in ${data.web}:`, tree.path)
    return ""
  }

  let relPath = tree.path.join("/").replace(/_/g, "/") + "/" + data.name

  relPath = relPath.toLowerCase().replace(/ /g, "_")

  if (relPath.startsWith("/")) relPath = relPath.slice(1)
  while (takenPaths.has(relPath)) {
    relPath += "_1"
  }

  takenPaths.add(relPath)

  let path = `./out/content/${relPath}.txt`

  return path
}

async function handleSinglePage(
  page: XWikiPage & { attachment: Attachment[] }
): Promise<{
  path: string
  pageContent: string
  syntax: "xwiki/1.0" | "xwiki/2.0"
  data: XWikiPage & { attachment: Attachment[] }
}> {
  const data = page
  const syntax = data.syntaxId === "xwiki/1.0" ? "xwiki/1.0" : "xwiki/2.0"

  let path = await getNewPath(data)

  let pageContent = data.title ? addTopLevelHeading(data.title, syntax) : ""
  pageContent += convertToUTF8(data.content)

  return {
    path,
    pageContent,
    syntax,
    data,
  }
}

async function paginatedContentPages(
  nonRelevantPaths: string[],
  take: number,
  skip: number
) {
  const relevantPages = await prisma.xWikiPage.findMany({
    where: { path: { notIn: nonRelevantPaths }, exclusion: null },
    include: { attachment: true },
    orderBy: { creationDate: "asc" },
    take,
    skip: skip,
  })

  const convertedPages = await Promise.all(relevantPages.map(handleSinglePage))

  return await Promise.all(
    convertedPages.map(async ({ pageContent, path, syntax, data }) => {
      await mkdir(dirname(path), { recursive: true })

      if (data.attachment.length > 0) {
        const attachmentLinks = data.attachment.map((att) =>
          handleAndLinkContentPageAttachment(att, dirname(path), syntax)
        )

        pageContent += "\n\n"
        pageContent += addTopLevelHeading("Attachments:", syntax) + "\n\n"

        for (const {
          attachmentPath,
          content,
          link,
          oldFilename,
          newFilename,
        } of attachmentLinks) {
          await mkdir(dirname(attachmentPath), { recursive: true })
          await writeFile(attachmentPath, content, { encoding: "base64" })

          pageContent = pageContent.replace(oldFilename, newFilename)
          pageContent += link
        }
      }

      await writeFile(path, pageContent, { encoding: "utf-8" })

      const oldLink = data.web + "." + data.name

      let relPath = path.replace("./out/content/", "").replace(/\.txt$/, "")

      if (relPath.startsWith("/")) relPath = relPath.slice(1)
      const newLink = "xwiki:content:" + relPath.replace(/\//g, ":")
      writeFile(`./out/_links/${oldLink}.txt`, newLink)

      return { path, syntax }
    })
  )
}

export async function handleContentPages() {
  const all = await prisma.xWikiPage.findMany({
    where: { exclusion: null },
    select: { content: true, object: true, path: true, parent: true },
  })

  const nonRelevantPaths = all.filter(isUserPageDB).map((p) => p.path)

  const syntaxList: { syntax: string; fileName: string }[] = []
  const take = 100
  for (let skip = 0; skip < all.length; skip += take) {
    console.log(`Processing pages ${skip} to ${skip + take} of ${all.length}`)
    const x = await paginatedContentPages(nonRelevantPaths, take, skip)
    syntaxList.push(
      ...x.map(({ path, syntax }) => ({ syntax, fileName: path }))
    )
  }

  await writeFile(
    "./out/_syntax_content.txt",
    syntaxList
      .map(
        ({ syntax, fileName }) => `${fileName.replace("./", "")}~~~${syntax}`
      )
      .join("\n"),
    {
      encoding: "utf-8",
    }
  )
}
