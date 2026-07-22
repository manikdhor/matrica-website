/**
 * Server component that injects a JSON-LD structured-data <script>. Safe to use
 * in server components (project/blog/faq pages). Pass a plain object graph.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
