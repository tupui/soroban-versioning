export type BadgeCode = number;

export function badgeName(code: BadgeCode): string {
  switch (code) {
    case 10000000:
      return "Developer";
    case 5000000:
      return "Triage";
    case 1000000:
      return "Community";
    case 500000:
      return "Verified";
    case 1:
      return "Default";
    default:
      return code.toString();
  }
}
