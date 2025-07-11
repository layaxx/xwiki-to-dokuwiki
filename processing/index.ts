import { handleContentPages } from "./content_pages"
import { handleUserPages } from "./user_pages"

const skipUserPages = false
const skipContentPages = false

async function main() {
  if (!skipUserPages) {
    console.log("Starting user page processing...")
    await handleUserPages()
    console.log("User page processing completed.")
  }

  if (!skipContentPages) {
    console.log("Starting content page processing.")
    await handleContentPages()
    console.log("Content page processing completed.")
  }
}

await main()
