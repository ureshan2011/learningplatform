import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

/** Fills the path `manifest.webmanifest` promises — was 404ing before this existed. */
export async function GET() {
  return new ImageResponse(<BrandIcon size={192} />, { width: 192, height: 192 });
}
