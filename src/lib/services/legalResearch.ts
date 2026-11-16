import { z } from "zod";

const firecrawlResultSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      web: z
        .array(
          z
            .object({
              url: z.string().optional(),
              title: z.string().nullish(),
              description: z.string().nullish(),
              summary: z.string().nullish(),
              markdown: z.string().nullish(),
              publishedDate: z.string().nullish(),
              metadata: z
                .object({
                  publishedDate: z.string().nullish(),
                  publishedTime: z.string().nullish(),
                  datePublished: z.string().nullish(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough(),
        )
        .optional(),
    })
    .passthrough(),
});

export interface LegalResearchSource {
  id: string;
  title: string;
  url: string;
  description: string;
  content: string;
  publishedDate: string | null;
}

export function normalizeLegalResearchResults(payload: unknown): LegalResearchSource[] {
  const parsed = firecrawlResultSchema.safeParse(payload);
  if (!parsed.success || parsed.data.success === false || !parsed.data.data.web) {
    throw new Error("External legal research returned an invalid response.");
  }

  return parsed.data.data.web
    .flatMap((result) => {
      if (!result.url) return [];
      let url: URL;
      try {
        url = new URL(result.url);
      } catch {
        return [];
      }
      if (url.protocol !== "https:" || url.username || url.password) return [];

      const publishedDate =
        result.publishedDate ??
        result.metadata?.publishedDate ??
        result.metadata?.publishedTime ??
        result.metadata?.datePublished ??
        null;

      return [
        {
          title: (result.title?.trim() || url.hostname).slice(0, 200),
          url: url.toString().slice(0, 2048),
          description: (result.description?.trim() ?? "").slice(0, 600),
          content: (result.summary?.trim() ?? result.markdown?.trim() ?? "").slice(0, 3000),
          publishedDate: publishedDate?.slice(0, 80) ?? null,
        },
      ];
    })
    .slice(0, 5)
    .map((source, index) => ({ ...source, id: `R${index + 1}` }));
}
