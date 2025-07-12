# Conversion from XWiki to DokuWiki

This was written to aid the migration of the knowledge base from XWiki to DokuWiki at Feki.de e.V.

## Prerequisites

This assumes that you have a folder called `backup` on repo root level, containing an XML Dump of the XWiki pages.

`rendering/acme` Must contain the Java project for converting the XWiki syntax to DokuWiki syntax.

Furthermore, the `make copy` step assumes that you have a folder called `../dokuwiki_data` one level up from the repo root with the data of an DokuWiki install (e.g. from Docker). This is not needed for the actual processing however, just for validation.

## How to run

### On first install

- `npm install`
- `npx prisma migrate dev`

### On actual execution

- `make full` to run the full pipeline (excluding preprocessing)

or

- `make preprocess` to preprocess files, store them in the db
- `make process` to process the db entries, write them out
- `make render` to turn them from XWiki to DokuWiki syntax
- `make copy` to copy them to the DokuWiki data directory (assuming set-up as described earlier)

## Known Problems

That probably will never get patched:

- Non-ASCII characters sometimes are broken. This can also happen for paths/filenames, in which case those files will not be displayed by DokuWiki
- Macros are not handled (e.g. code can be lost)
- Some unnecessary files (XWiki config files) are converted as well
