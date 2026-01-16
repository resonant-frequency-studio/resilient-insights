import { StructureResolver } from 'sanity/structure'

/**
 * Custom desk structure for Resilient Insights
 *
 * Provides default structure with all document types.
 * Custom editor (Edit/Distribute mode switcher) is registered via post schema components.input
 */
export const structure: StructureResolver = S =>
  S.list()
    .title('Content')
    .items(
      S.documentTypeListItems().map(listItem => {
        // Ensure all list items have explicit IDs (required by Sanity)
        const id = listItem.getId()
        if (!id) {
          // Fallback: use schema type name as ID
          const schemaType = listItem.getSchemaType()
          const fallbackId =
            typeof schemaType === 'string'
              ? schemaType
              : schemaType?.name || 'unknown'
          return listItem.id(fallbackId)
        }
        return listItem.id(id)
      })
    )
