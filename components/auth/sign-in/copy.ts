/**
 * The sign-in screen's copy, flattened into one plain object.
 *
 * `app/(public)/signin/page.tsx` is a server component: it calls `getT()` and
 * builds this object once, then hands it to the client screen as a prop. The
 * dictionary itself never ships to the browser — only these already-resolved
 * strings do. Values that still need a runtime value (a phone number, a
 * countdown, a URL) stay as `{placeholder}` templates; client components
 * interpolate them with `interpolate()` from `lib/i18n/dictionary.ts`, the
 * same helper `getT()` uses on the server.
 */

export interface SignInCopy {
  title: string;
  lead: string;
  phoneLabel: string;
  phonePlaceholder: string;
  sendCode: string;
  sending: string;
  /** Carries `{terms}` and `{privacy}` markers — see `ConsentNote`. */
  consent: string;
  consentTerms: string;
  consentPrivacy: string;
  codeLabel: string;
  sentTo: string;
  slowSms: string;
  verify: string;
  verifying: string;
  opening: string;
  resend: string;
  resendIn: string;
  resent: string;
  changeNumber: string;
  wrongCode: string;
  wrongCodeAgain: string;
  expired: string;
  sessionFailed: string;
  retry: string;
  timeout: string;
  nameTitle: string;
  nameHint: string;
  nameLabel: string;
  namePlaceholder: string;
  skip: string;
  continueLabel: string;
  restoring: string;
  invalidPhone: string;
  offline: string;
  rateLimited: string;
  smsUnavailable: string;
  wrongHost: string;
  connectionLost: string;
  genericError: string;
  accountDisabled: string;
  reasonExpired: string;
  reasonRevoked: string;
  reasonDeviceReleased: string;
  reasonAccountDisabled: string;
  reasonInvalid: string;
  referredBy: string;
  deviceLimitTitle: string;
  deviceLimitBody: string;
  deviceLastUsed: string;
  deviceSwapCta: string;
  deviceSwapping: string;
  deviceSwapHint: string;
  deviceSwapCooldown: string;
  deviceAskTeacher: string;
  back: string;
}

/**
 * A `getT()`-shaped translator: exactly the interface this needs, so the
 * server page can pass its real `Translator` in without this module ever
 * importing anything from `lib/i18n/server.ts` (server-only) into a tree a
 * client component also touches.
 */
export type SignInTranslate = (key: string, vars?: Record<string, string | number>) => string;

export function buildSignInCopy(t: SignInTranslate): SignInCopy {
  return {
    title: t("signin.title"),
    lead: t("signin.lead"),
    phoneLabel: t("signin.phoneLabel"),
    phonePlaceholder: t("signin.phonePlaceholder"),
    sendCode: t("signin.sendCode"),
    sending: t("signin.sending"),
    consent: t("signin.consent"),
    consentTerms: t("signin.consentTerms"),
    consentPrivacy: t("signin.consentPrivacy"),
    codeLabel: t("signin.codeLabel"),
    sentTo: t("signin.sentTo"),
    slowSms: t("signin.slowSms"),
    verify: t("signin.verify"),
    verifying: t("signin.verifying"),
    opening: t("signin.opening"),
    resend: t("signin.resend"),
    resendIn: t("signin.resendIn"),
    resent: t("signin.resent"),
    changeNumber: t("signin.changeNumber"),
    wrongCode: t("signin.wrongCode"),
    wrongCodeAgain: t("signin.wrongCodeAgain"),
    expired: t("signin.expired"),
    sessionFailed: t("signin.sessionFailed"),
    retry: t("signin.retry"),
    timeout: t("signin.timeout"),
    nameTitle: t("signin.nameTitle"),
    nameHint: t("signin.nameHint"),
    nameLabel: t("signin.nameLabel"),
    namePlaceholder: t("signin.namePlaceholder"),
    skip: t("signin.skip"),
    continueLabel: t("signin.continue"),
    restoring: t("signin.restoring"),
    invalidPhone: t("signin.invalidPhone"),
    offline: t("signin.offline"),
    rateLimited: t("signin.rateLimited"),
    smsUnavailable: t("signin.smsUnavailable"),
    wrongHost: t("signin.wrongHost"),
    connectionLost: t("signin.connectionLost"),
    genericError: t("signin.genericError"),
    accountDisabled: t("signin.accountDisabled"),
    reasonExpired: t("signin.reasonExpired"),
    reasonRevoked: t("signin.reasonRevoked"),
    reasonDeviceReleased: t("signin.reasonDeviceReleased"),
    reasonAccountDisabled: t("signin.reasonAccountDisabled"),
    reasonInvalid: t("signin.reasonInvalid"),
    referredBy: t("signin.referredBy"),
    deviceLimitTitle: t("signin.deviceLimitTitle"),
    deviceLimitBody: t("signin.deviceLimitBody"),
    deviceLastUsed: t("signin.deviceLastUsed"),
    deviceSwapCta: t("signin.deviceSwapCta"),
    deviceSwapping: t("signin.deviceSwapping"),
    deviceSwapHint: t("signin.deviceSwapHint"),
    deviceSwapCooldown: t("signin.deviceSwapCooldown"),
    deviceAskTeacher: t("signin.deviceAskTeacher"),
    back: t("signin.back"),
  };
}

/** Reason banner shown above the form — why the visitor was sent here. */
export function reasonText(copy: SignInCopy, reason?: string): string | null {
  switch (reason) {
    case "expired":
      return copy.reasonExpired;
    case "revoked":
      return copy.reasonRevoked;
    case "device_released":
      return copy.reasonDeviceReleased;
    case "account_disabled":
      return copy.reasonAccountDisabled;
    case "invalid":
      return copy.reasonInvalid;
    default:
      return null;
  }
}
