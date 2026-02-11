import { StructureResolver } from 'sanity/structure'

// Document types that should be hidden from the main list
// (managed via plugins or internal use only)
const HIDDEN_DOCUMENT_TYPES = new Set(['postDistribution'])

/**
 * Custom desk structure for Resilient Insights
 *
 * Provides default structure with all document types except hidden ones.
 * postDistribution is managed via the Manage Social plugin.
 */
export const structure: StructureResolver = S =>
  S.list()
    .title('Content')
    .items(
      S.documentTypeListItems()
        .filter(listItem => {
          // Filter out hidden document types
          const schemaType = listItem.getSchemaType()
          const typeName =
            typeof schemaType === 'string' ? schemaType : schemaType?.name
          return !typeName || !HIDDEN_DOCUMENT_TYPES.has(typeName)
        })
        .map(listItem => {
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
