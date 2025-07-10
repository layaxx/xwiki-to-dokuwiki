import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

console.log(await prisma.attachment.findMany())

/* await prisma.xWikiPage.create({
  data: {
    author: "testAuthor",
    content: "This is a test content",
    creationDate: new Date().getUTCSeconds(),
    date: new Date().getUTCSeconds(),
    path: "test/path" + new Date().getTime(),
    web: "Main",
    name: "TestPage",
    language: "en",
    version: "1.1",
    comment: "Initial creation",
    creator: "testAuthor",
    customClass: "customClass",
    defaultLanguage: "en",
    hidden: false,
    parent: "Main.WebHome",
    syntaxId: "xwiki/2.1",
    title: "Test Page",
    contentUpdateDate: new Date().getUTCSeconds(),
    minorEdit: false,
    translation: 0,
    template: "TestTemplate",
    defaultTemplate: "DefaultTemplate",
    validationScript: "TestValidationScript",
    object: {
      web: "Main",
    },
    contentAuthor: "testAuthor",
    attachment: {
      createMany: {
        data: {
          author: "testAuthor",
          filename: "testFile.txt",
          filesize: 1234,
          date: new Date().getTime(),
          version: 1,
          comment: "Test attachment",
          content: "This is a test attachment content",
        },
      },
    },
  },
})
 */
