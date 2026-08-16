/** Lowercase, punctuation-stripped, whitespace-collapsed — used for the schools typeahead index/dedupe. */
export function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
