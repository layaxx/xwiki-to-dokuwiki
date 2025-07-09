import fs from "fs"
import { dirname, join } from "path"
import { addTopLevelHeading, convertLink, getNewPath } from "./util"
import type { Attachment, Data } from "./types"

function parseContent(data: Data, newLink: string) {
  const syntax = data.syntaxId === "xwiki/1.0" ? "xwiki/1.0" : "xwiki/2.0"

  if (newLink.startsWith("/")) newLink = newLink.slice(1)

  fs.appendFileSync(`./out/syntaxlist.txt`, `${newLink}~~~${syntax}\n`)

  return data.content
}

function handleAndLinkAttachment(
  attachment: Attachment,
  pagePath: string,
  syntax: "xwiki/1.0" | "xwiki/2.0"
) {
  pagePath = dirname(pagePath).toLowerCase()
  attachment.filename = attachment.filename.toLowerCase()
  let attachmentPath = join(pagePath, attachment.filename)

  while (fs.existsSync(attachmentPath)) {
    console.error("ATTACHMENT File already exists: ", attachmentPath)
    attachment.filename = "1_" + attachment.filename

    attachmentPath = join(pagePath, attachment.filename)
  }

  attachmentPath = attachmentPath.toLowerCase()

  fs.mkdirSync(dirname(attachmentPath.replace("out/", "out/attach/")), {
    recursive: true,
  })
  fs.writeFileSync(
    attachmentPath.replace("out/", "out/attach/"),
    String(attachment.content),
    {
      encoding: "base64",
    }
  )

  return syntax === "xwiki/2.0"
    ? "[[attach:" + attachment.filename + "]]\n\n"
    : "{attach:" +
        attachment.filename +
        "|file=" +
        attachment.filename +
        "}\n\n"
}

export function transformContentPage(
  obj: { xwikidoc: Data; path: string },
  resolvedTree: Array<{
    title: string
    name: string
    parent: string
    web: string
    path: string[]
  }>
): { skip: true; reason: string } | { skip: false } {
  const data = obj.xwikidoc
  const syntax = data.syntaxId === "xwiki/1.0" ? "xwiki/1.0" : "xwiki/2.0"

  let path = getNewPath(data, resolvedTree)

  const lowerCasePath = path.toLowerCase()
  if (lowerCasePath.includes("class")) {
    return { skip: true, reason: "This is a class page" }
  }

  if (lowerCasePath.includes("template")) {
    return { skip: true, reason: "This is a template page" }
  }

  if (lowerCasePath.includes("preferences")) {
    return { skip: true, reason: "This is a preferences page" }
  }

  if (lowerCasePath.includes("webhome")) {
    return { skip: true, reason: "This is a webhome page" }
  }

  if (lowerCasePath.includes("/xwiki/")) {
    return { skip: true, reason: "This is a XWiki page" }
  }

  if (lowerCasePath.includes("sheet")) {
    return { skip: true, reason: "This is a sheet page" }
  }

  let contentPage = data.title ? addTopLevelHeading(data.title, syntax) : ""
  contentPage += parseContent(data, path)

  if (data.attachment) {
    contentPage += "\n\n" + addTopLevelHeading("Attachments:", syntax)
    if (Array.isArray(data.attachment)) {
      data.attachment.forEach((attachment) => {
        contentPage += handleAndLinkAttachment(attachment, path, syntax)
      })
    } else {
      contentPage += handleAndLinkAttachment(data.attachment, path, syntax)
    }
  }

  fs.writeFileSync(path, contentPage)
  return {
    skip: false,
  }
}
