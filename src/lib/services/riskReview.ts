export function riskReviewKey(documentId: string, riskId: string) {
  return `risk:${documentId}:${riskId}`;
}
