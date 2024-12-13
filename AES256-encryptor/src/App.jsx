import React, { useState, useEffect } from "react";
import { generateKey, encryptData, getKeyHex } from "./encryptData.js";
import { decryptData, getKeyFromHex } from "./decryptData.js";

const headerText = "storachaProof";
const header = new TextEncoder().encode(headerText);

const App = () => {
  const [keyHex, setKeyHex] = useState(null);
  const [plaintext, setPlaintext] = useState("This is secret data");
  const [encryptedPayload, setEncryptedPayload] = useState(null);
  const [decryptedText, setDecryptedText] = useState(null);

  useEffect(() => {
    (async () => {
      const newKey = await generateKey();
      setKeyHex(await getKeyHex(newKey));
    })();
  }, []);

  const handleEncrypt = async () => {
    if (keyHex) {
      const data = new TextEncoder().encode(plaintext);
      const key = await getKeyFromHex(keyHex);
      const payload = await encryptData(key, data, header);
      setEncryptedPayload(payload);
    }
  };

  const handleDecrypt = async () => {
    if (keyHex && encryptedPayload) {
      const key = await getKeyFromHex(keyHex);
      const decrypted = await decryptData(key, encryptedPayload);
      setDecryptedText(new TextDecoder().decode(decrypted));
    }
  };

  return (
    <div>
      <h1>AES Encryption/Decryption in React</h1>
      <div>
        <label>Plaintext:</label>
        <input
          type="text"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
        />
      </div>
      <div>
        <button onClick={handleEncrypt}>Encrypt</button>
      </div>
      {keyHex && (
        <div>
          <h2>Key:</h2>
          <p>{keyHex}</p>
        </div>
      )}
      {encryptedPayload && (
        <div>
          <h2>Encrypted Payload:</h2>
          <pre>{JSON.stringify(encryptedPayload, null, 2)}</pre>
          <button onClick={handleDecrypt}>Decrypt</button>
        </div>
      )}
      {decryptedText && (
        <div>
          <h2>Decrypted Text:</h2>
          <p>{decryptedText}</p>
        </div>
      )}
    </div>
  );
};

export default App;
