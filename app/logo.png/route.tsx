import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

/** Stable URL (no cache-busting query string) for anything referencing the
 * logo by a fixed link — structured data, external directories, share cards
 * someone pastes by hand. */
export async function GET() {
  return new ImageResponse(<BrandIcon size={512} />, { width: 512, height: 512 });
}
