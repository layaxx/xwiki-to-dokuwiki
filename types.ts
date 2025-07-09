export type Attachment = {
  filename: string
  filesize: number
  author: string
  date: number
  version: number
  comment: string
  content: string
}

export type Data = {
  web: string
  name: string
  language: string
  defaultLanguage: string
  translation: number
  parent: string
  creator: string
  author: string
  customClass: string
  contentAuthor: string
  creationDate: number
  date: number
  contentUpdateDate: number
  version: number
  title: string
  template: string
  defaultTemplate: string
  validationScript: string
  comment: string
  minorEdit: boolean
  syntaxId: string
  hidden: boolean
  object?: Array<{
    class?: {
      name?: string
    }
    property: Array<Record<string, string | number>>
  }>
  content: string
  attachment?: Attachment | Attachment[]
}
