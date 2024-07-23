import fs from "fs"
import { dirname } from "path"
import { getNewPath } from "./util"

export function isUserPage(object: { xwikidoc: Data }) {
  return (
    !!object.xwikidoc &&
    object.xwikidoc.content.includes(
      "XWikiUserSheet" || object.xwikidoc.content.includes("XWikiUserTemplate")
    ) &&
    Array.isArray(object.xwikidoc.object) &&
    object.xwikidoc.object.some(
      (ob) => ob && ob.class && ob.class.name === "XWiki.XWikiUsers"
    )
  )
}

export function transformUserPage(
  obj: { xwikidoc: Data },
  resolvedTree: Array<{
    title: string
    name: string
    parent: string
    web: string
    path: string[]
  }>
) {
  const d =
    obj.xwikidoc.object!.find((ob) => ob?.class?.name === "XWiki.XWikiUsers")
      ?.property ?? []
  const user: Record<string, string | number> = {}

  d.forEach((item) => {
    const key = Object.keys(item)[0]
    user[key] = item[key]
  })

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

  let userPage = `====== ${first_name} ${last_name} - Wiki Profil ======
Hinweis: Diese Seite wurde automatisch aus dem alten Wiki migriert. Dabei kann es zu Problemen kommen.

----

=== Kontaktinformationen: ===

E-Mail-Adresse: ${email ?? ""}

Telefonnummer: ${phone ?? ""}

Adresse: ${address ?? ""}

`

  fs.writeFileSync(getNewPath(obj.xwikidoc, resolvedTree), userPage)
}
