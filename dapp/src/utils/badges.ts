export enum Badge {
  DEVELOPER = 10000000,
  TRIAGE = 5000000,
  COMMUNITY = 1000000,
  VERIFIED = 500000,
  DEFAULT = 1,
}

export function badgeName(code: Badge | number): string {
  switch (code) {
    case Badge.DEVELOPER:
      return "Developer";
    case Badge.TRIAGE:
      return "Triage";
    case Badge.COMMUNITY:
      return "Community";
    case Badge.VERIFIED:
      return "Verified";
    case Badge.DEFAULT:
      return "Default";
    default:
      return code.toString();
  }
}
