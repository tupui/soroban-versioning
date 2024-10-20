import fs from "fs";
import * as Name from "w3name";

async function saveSigningKey(name, outputFilename) {
  const bytes = name.key.bytes;
  await fs.promises.writeFile(outputFilename, bytes);
}

async function loadSigningKey(filename) {
  const bytes = await fs.promises.readFile(filename);
  const name = await Name.from(bytes);
  return name;
}

// const name = await Name.create();
// console.log('created new name: ', name.toString());

//await saveSigningKey(name,  "key")

const name = await loadSigningKey("key");
console.log("loaded name: ", name.toString());
console.log("key: ", name);

const value =
  "/ipfs/bafybeid2ertorypgvxmabjltzxovha5z2tbjawc3646wh4cqscbha3i6wu";
const revision = await Name.v0(name, value);
console.log("Resolved value:", revision.value);

//await Name.publish(revision, name.key)

const name2 = Name.parse(
  "k51qzi5uqu5diamj3d0iilxwj6slc9clhggbcvimn0tekop0gk8nfg3837iac9",
);
const revision2 = await Name.resolve(name2);
console.log("Resolved value:", revision2.value);

// const nextValue = '/ipfs/bafybeiauyddeo2axgargy56kwxirquxaxso3nobtjtjvoqu552oqciudrm';
// Make a revision to the current record (increments sequence number and sets value)
// const nextRevision = await Name.increment(revision, nextValue);
