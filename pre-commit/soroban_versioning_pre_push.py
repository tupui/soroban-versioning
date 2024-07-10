"""Pre-push commit script.

- [CONTRACT_ID]: contract address, default to Tansu's contract;
- PROJECT_KEY: hex value of the project.

e.g. of project key

```
9afcde4ad92b1d44e7457bf380cbb0f8ef1eb3f3517ee7b72f43beb7c3bc02ac
```
"""

import os
import subprocess

import soroban

CONTRACT_ID = os.getenv(
    "TANSU_CONTRACT_ID", "CC3JCYWHNMPMQTOQUNDCJSCFSWRFZIE2JVSAUEXEG56DMKOMI3RL7VOH"
)
PROJECT_KEY = os.getenv("TANSU_PROJECT_KEY")
if PROJECT_KEY is None:
    raise ValueError("'TANSU_PROJECT_KEY' is missing from the environment")


def main():
    project_key = bytes.fromhex(PROJECT_KEY)

    commit_hash = (
        subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True)
        .stdout.decode()
        .split("\n")[0]
    )
    commit_hash = bytes.fromhex(commit_hash)

    source_account = soroban.Identity()
    args = [
        {"name": "maintainer", "type": "address", "value": source_account.public_key},
        {"name": "project_key", "type": "bytes", "value": project_key},
        {"name": "hash", "type": "bytes", "value": commit_hash},
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
