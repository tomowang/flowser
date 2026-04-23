
export function pascalToSlug(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handles sequences of capitals (e.g., XMLHTTPRequest)
    .toLowerCase(); // Convert all to lowercase
}

export function pascalToTitleCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handles sequences of capitals (e.g., XMLHTTPRequest)
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
