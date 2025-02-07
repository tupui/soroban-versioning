const characters = "abcdefghijklmnopqrstuvwxyz";

const generateRandomString = (length: number) => {
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const generateRandomWords = (wordCount: number) =>
  Array.from({ length: wordCount }, () => generateRandomString(4)).join(" ");

export const generateRandomProjectName = () => generateRandomString(15);
export const generateRandomProposalName = () => generateRandomString(12);

export const sleep = (elapse: number) =>
  new Promise((resolve) => setTimeout(resolve, elapse));
