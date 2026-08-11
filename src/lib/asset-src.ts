export function assetSrc(
  image: string | { src: string } | { default: string } | unknown,
): string {
  if (typeof image === "string") return image;
  if (image && typeof image === "object") {
    if ("src" in image && typeof (image as { src: unknown }).src === "string") {
      return (image as { src: string }).src;
    }
    if (
      "default" in image &&
      typeof (image as { default: unknown }).default === "string"
    ) {
      return (image as { default: string }).default;
    }
  }
  return String(image ?? "");
}
