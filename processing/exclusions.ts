import { PrismaClient, XWikiPage } from "../generated/prisma"
import { isUserPageDB } from "../util"
const prisma = new PrismaClient()

function getCreationYear(obj: XWikiPage): number {
  return new Date(Number(obj.creationDate)).getFullYear()
}

function getUpdateYear(obj: XWikiPage): number {
  return new Date(Number(obj.contentUpdateDate)).getFullYear()
}

async function makeExclusions(skip = 0, take = 1000) {
  const pages = await prisma.xWikiPage.findMany({
    include: { attachment: true, exclusion: true },
    take,
    orderBy: { creationDate: "asc" },
    skip,
  })

  for (const page of pages) {
    if (page.exclusion != null) {
      console.log(`Skipping ${page.path} because it is already excluded`)
    } else {
      try {
        const lowerCaseName = page.name.toLowerCase()
        const ignore = ["sheet", "webhome", "preferences", "class", "template"]
        if (
          page.comment === "Imported from XAR" ||
          ignore.some((ignored) => lowerCaseName.includes(ignored))
        ) {
          await prisma.exclusion.create({
            data: {
              reason: `Page is a XWiki config page`,
              path: page.path,
            },
          })

          continue
        }

        if (isUserPageDB(page)) {
          const creationYear = getCreationYear(page)
          if (creationYear >= 2018) {
            await prisma.exclusion.create({
              data: {
                reason: `User page is too new (${creationYear})`,
                path: page.path,
              },
            })
          }
          continue
        }

        if (
          page.content.length > 45 ||
          (Array.isArray(page.attachment) && page.attachment.length > 0)
        ) {
          const creationYear = getCreationYear(page)
          if (creationYear <= 2017) {
            if (
              getUpdateYear(page) > 2017 &&
              (page.title.toLowerCase().includes("bertragen") ||
                page.name.toLowerCase().includes("bertragen") ||
                page.content.toLowerCase().includes("bertragen"))
            ) {
              await prisma.exclusion.create({
                data: {
                  reason: `Page was recently updated and has moved(${getUpdateYear(
                    page
                  )})`,
                  path: page.path,
                },
              })
            }
          } else {
            await prisma.exclusion.create({
              data: {
                reason: `Page is too new (${creationYear})`,
                path: page.path,
              },
            })
          }
        } else {
          await prisma.exclusion.create({
            data: {
              reason: `No attachment and too little content`,
              path: page.path,
            },
          })
        }
      } catch (error) {
        console.error(
          `Error processing page ${page.path}:`,
          error,
          page.exclusion
        )
        throw new Error(`Failed to process page ${page.path}`)
      }
    }
  }
}

async function main() {
  console.log("Deleting existing exclusions...")
  await prisma.exclusion.deleteMany()
  const take = 100
  const totalCount = await prisma.xWikiPage.count()

  for (let i = 0; i < totalCount; i += take) {
    console.log(`Processing pages ${i} to ${i + take}`)
    await makeExclusions(i, take)
  }
}

await main()
