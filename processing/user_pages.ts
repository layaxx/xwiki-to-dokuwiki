import { writeFile } from "fs/promises"
import { Attachment, PrismaClient, XWikiPage } from "../generated/prisma"
import { addTopLevelHeading, convertToUTF8, isUserPageDB } from "../util"
import { join } from "path"
import crypto from "crypto"

const prisma = new PrismaClient()

function printWarning(syntax: "xwiki/1.0" | "xwiki/2.0") {
  if (syntax === "xwiki/1.0") {
    return "*Hinweis: Diese Seite wurde automatisch aus dem alten Wiki migriert. Dabei kann es zu Problemen kommen.*"
  }

  return "**Hinweis: Diese Seite wurde automatisch aus dem alten Wiki migriert. Dabei kann es zu Problemen kommen.**"
}

function handleAndLinkUserPageAttachment(
  attachment: Attachment,
  syntax: "xwiki/1.0" | "xwiki/2.0"
) {
  const oldFilename = attachment.filename
  attachment.filename =
    crypto.randomUUID().slice(0, 8) + "-" + attachment.filename.toLowerCase()
  let attachmentPath = join(
    "out",
    "_attach",
    "users",
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

function transformUserPageDB(doc: XWikiPage) {
  const user: Record<string, string | number> = {}

  if (Array.isArray(doc.object)) {
    const tmp = doc.object.find(
      (ob) =>
        typeof ob === "object" &&
        ob &&
        !Array.isArray(ob) &&
        typeof ob.class === "object" &&
        !Array.isArray(ob.class) &&
        ob?.class?.name === "XWiki.XWikiUsers"
    )

    if (
      tmp &&
      typeof tmp === "object" &&
      !Array.isArray(tmp) &&
      Array.isArray(tmp?.property)
    ) {
      for (const item of tmp?.property ?? []) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue
        const key = Object.keys(item)[0]
        const value = item[key]
        if (typeof value === "string" || typeof value === "number") {
          user[key] = value
        }
      }
    }
  }

  const {
    // active,
    email,
    first_name,
    last_name,
    // avatar,blog,blogfeed,city,comment,company,country,default_language,editor,fullname,imaccount,imtype,pageWidth,password,skin,usertype,validkey,
    address,
    phone,
    // ldap_dn,
  } = user

  const userInfo = [email, first_name, last_name, address, phone]

  const syntax = doc.syntaxId as "xwiki/1.0" | "xwiki/2.0"

  if (userInfo.some(Boolean)) {
    return createUserPage(
      { email, first_name, last_name, address, phone },
      syntax
    )
  } else {
    return `${addTopLevelHeading(
      `${doc.name.split("_").join(" ")} - Wiki Profil`,
      syntax
    )}
${printWarning(syntax)}

${convertToUTF8(doc.content).replace(/\\/g, "\\\\")}

`
  }
}

function createUserPage(
  {
    email,
    first_name,
    last_name,
    address,
    phone,
  }: Record<string, string | number>,
  syntax: "xwiki/1.0" | "xwiki/2.0"
) {
  return `${addTopLevelHeading(
    `${first_name} ${last_name} - Wiki Profil`,
    syntax
  )}
${printWarning(syntax)}


Kontaktinformationen: 

E-Mail-Adresse: ${email ?? ""}

Telefonnummer: ${phone ?? ""}

Adresse: ${address ?? ""}
`
}

export async function handleUserPages() {
  const all = await prisma.xWikiPage.findMany({
    where: { exclusion: null },
    select: { content: true, object: true, path: true, parent: true },
  })

  const relevant = all.filter(isUserPageDB)

  const relevantPages = await prisma.xWikiPage.findMany({
    where: { path: { in: relevant.map((p) => p.path) } },
    include: { attachment: true },
  })

  const texts = relevantPages.map(transformUserPageDB)

  console.log(
    `Found ${relevantPages.length} user pages to process, writing to files...`
  )

  const names = relevantPages.map((page) => page.name.toLowerCase())

  const syntaxList = await Promise.all(
    texts.map(async (text, index) => {
      const data = relevantPages[index]
      let fileName = data.name.toLowerCase()
      if (names.indexOf(fileName) !== index) {
        fileName = `${fileName}_${index}`
      }
      fileName = fileName.replace(/ /g, "_")

      const syntax = data.syntaxId as "xwiki/1.0" | "xwiki/2.0"
      if (data.attachment && data.attachment.length > 0) {
        if (data.attachment) {
          text += "\n\n" + addTopLevelHeading("Attachments:", syntax) + "\n\n"

          const linkData = data.attachment.map((attachment) =>
            handleAndLinkUserPageAttachment(attachment, syntax)
          )

          for (const { oldFilename, newFilename } of linkData) {
            text = text.replace(oldFilename, newFilename)
          }

          await Promise.all(
            linkData.map(async (link) => {
              await writeFile(link.attachmentPath, link.content, {
                encoding: "base64",
              })
            })
          )

          text += linkData.map((link) => link.link)
        }
      }
      await writeFile("./out/users/" + fileName + ".txt", text)

      const oldLink = data.web + "." + data.name

      const newLink = "xwiki:users:" + fileName
      await writeFile(`./out/_links/${oldLink}.txt`, newLink)

      return { fileName, syntax }
    })
  )

  await writeFile(
    "./out/_syntax_users.txt",
    syntaxList
      .map(({ syntax, fileName }) => `out/users/${fileName}.txt~~~${syntax}`)
      .join("\n")
  )
}
