/**
 * Parses Obsidian-style double bracket links: [[Note Name]]
 * and returns the names of the notes that are referenced.
 */
export function parseLinks(content: string): string[] {
  if (!content) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const linkName = match[1].split('|')[0].trim(); // Handle display text: [[Note Name|Display Text]]
    if (linkName && !links.includes(linkName)) {
      links.push(linkName);
    }
  }

  return links;
}
