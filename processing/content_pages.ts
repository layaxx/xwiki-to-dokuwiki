import { PrismaClient } from "../generated/prisma"
import { isUserPageDB } from "../util"

const prisma = new PrismaClient()

async function paginatedContentPages(
  nonRelevantPaths: string[],
  take: number,
  index: number
) {
  const relevantPages = await prisma.xWikiPage.findMany({
    where: { path: { notIn: nonRelevantPaths } },
    include: { attachment: true },
    orderBy: { creationDate: "asc" },
    take,
    skip: index * take,
  })
}

export async function handleContentPages() {
  const all = await prisma.xWikiPage.findMany({
    where: { exclusion: null },
    select: { content: true, object: true, path: true, parent: true },
  })

  const nonRelevantPaths = all.filter(isUserPageDB).map((p) => p.path)

  const take = 500
  for (let i = 0; i < all.length; i += take) {
    const pages = all.slice(i, i + take)

    console.log(`Processing pages ${i} to ${i + take} of ${all.length}`)
    await paginatedContentPages(nonRelevantPaths, take, i)
  }
}
