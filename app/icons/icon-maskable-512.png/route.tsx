import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

/**
 * Fills the path `manifest.webmanifest` promises — was 404ing before this
 * existed. `maskable` keeps the wordmark inside Android's circular safe
 * zone so the launcher icon doesn't get its corners cropped off.
 */
export async function GET() {
  return new ImageResponse(<BrandIcon size={512} maskable />, { width: 512, height: 512 });
}
