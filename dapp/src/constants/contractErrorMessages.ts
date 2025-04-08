export const contractErrorMessages = {
  0: "An unexpected error has occurred.",
  1: "The provided key is invalid.",
  2: "The project already exists.",
  3: "The user is not a maintainer.",
  4: "No hash was found.",
  5: "There is an invalid domain error.",
  6: "The maintainer is not the domain owner.",
  7: "There was a validation issue with the proposal input.",
  8: "Proposal or page could not be found.",
  9: "You have already voted.",
  10: "The proposal is still in voting, so cannot be executed.",
  11: "The proposal has already been executed.",
};

export type ContractErrorMessageKey = keyof typeof contractErrorMessages;
