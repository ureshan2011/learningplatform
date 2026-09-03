import { jsonLdHtml } from "@/lib/seo/json-ld";

/**
 * Renders one structured-data block. Every page that ships schema.org data
 * goes through this rather than hand-writing the script tag, so the escaping
 * in `jsonLdHtml` is applied consistently and a page can never accidentally
 * emit unescaped user content into a `<script>`.
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />;
}
