/**
 * Sri Lankan mobile number handling.
 *
 * Students type numbers every way imaginable — 0771234567, 077 123 4567,
 * +94771234567, 94771234567. All of them must land on one canonical account,
 * because the phone number is the identity anchor for the whole platform.
 */

const SL_COUNTRY_CODE = "94";

/** Mobile prefixes in use: Dialog 070/076/077, Mobitel 071/075, Hutch 072/078, Airtel 075/074. */
const MOBILE_PREFIX = /^7[0-8]\d{7}$/;

export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let national: string;
  if (digits.startsWith(SL_COUNTRY_CODE) && digits.length === 11) {
    national = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!MOBILE_PREFIX.test(national)) return null;
  return `+${SL_COUNTRY_CODE}${national}`;
}

/** Local display form: 077 123 4567. */
export function formatLocal(e164: string): string {
  const national = e164.replace(`+${SL_COUNTRY_CODE}`, "");
  if (national.length !== 9) return e164;
  return `0${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

/** Masked form for watermarks and public leaderboards: 077 ••• 4567. */
export function maskPhone(e164: string): string {
  const national = e164.replace(`+${SL_COUNTRY_CODE}`, "");
  if (national.length !== 9) return "•••";
  return `0${national.slice(0, 2)} ••• ${national.slice(5)}`;
}
