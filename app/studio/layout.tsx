const bridgeScriptUrl = 'https://core.sanity-cdn.com/bridge.js'

/**
 * Studio layout required for Sanity Dashboard integration.
 * The bridge script lets the Dashboard embed and communicate with this studio.
 * @see https://www.sanity.io/docs/dashboard/dashboard-configure#adding-the-bridge-component
 */
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script src={bridgeScriptUrl} async type="module" />
      {children}
    </>
  )
}
