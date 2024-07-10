import os
import subprocess

import soroban


def main():
    project_key = os.getenv("SVN_PROJECT_KEY")
    if project_key is None:
        raise ValueError("'SVN_PROJECT_KEY' is missing from the environment")

    project_key = bytes.fromhex(project_key)

    commit_hash = (
        subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True)
        .stdout.decode()
        .split("\n")[0]
    )
    commit_hash = bytes.fromhex(commit_hash)

    contract_id = os.getenv(
        "SVN_CONTRACT_ID", "CC3JCYWHNMPMQTOQUNDCJSCFSWRFZIE2JVSAUEXEG56DMKOMI3RL7VOH"
    )

    source_account = soroban.Identity()
    args = [
        {"name": "maintainer", "type": "address", "value": source_account.public_key},
        {"name": "project_key", "type": "bytes", "value": project_key},
        {"name": "hash", "type": "bytes", "value": commit_hash},
    ]
    args = soroban.Parameters(args=args)

    soroban.invoke(
        contract_id=contract_id,
        function_name="commit",
        args=args,
        source_account=source_account,
    )


if __name__ == "__main__":
    main()
