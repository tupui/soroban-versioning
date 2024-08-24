"""Pre-push commit script.

- [CONTRACT_ID]: contract address, default to Tansu's contract;
- PROJECT_KEY: hex value of the project - Keccak256 hash.

e.g. of project key for "tansu" using

```
37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156
```
"""

import os
import subprocess

import soroban

CONTRACT_ID = os.getenv(
    "TANSU_CONTRACT_ID", "CAP52ERGUZ65UNPHP36CQBHYUPEUG2TT4NPVEV7CREWRT7UCPD7PRWEE"
)
PROJECT_KEY = os.getenv("TANSU_PROJECT_KEY")
if PROJECT_KEY is None:
    raise ValueError("'TANSU_PROJECT_KEY' is missing from the environment")

BRANCH = os.getenv("PRE_COMMIT_REMOTE_BRANCH")
if BRANCH != "main":
    exit(0)


def main():
    project_key = bytes.fromhex(PROJECT_KEY)

    commit_hash = (
        subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True)
        .stdout.decode()
        .split("\n")[0]
    )

    source_account = soroban.Identity()
    args = [
        {"name": "maintainer", "type": "address", "value": source_account.public_key},
        {"name": "project_key", "type": "bytes", "value": project_key},
        {"name": "hash", "type": "string", "value": commit_hash},
    ]
    args = soroban.Parameters(args=args)

    soroban.invoke(
        contract_id=CONTRACT_ID,
        function_name="commit",
        args=args,
        source_account=source_account,
    )


if __name__ == "__main__":
    main()
