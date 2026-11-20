/** A text field of a submitted form ("" when missing or a file). */
export function formText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}
