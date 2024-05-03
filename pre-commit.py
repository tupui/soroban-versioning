import os
import subprocess

import soroban

res = subprocess.run(
    ["git", "rev-parse", "HEAD"],
    capture_output=True
)
commit_hash = res.stdout.decode().split('\n')[0]
project_key = os.getenv("SVN_KEY")

commit_hash = bytes.fromhex(commit_hash)
project_key = bytes.fromhex(project_key)
contract_id = "CDNDBI7IOGIYJ7WI3WSMNBU7JTF5GOG4DIJNQOANOQPBLEMDO25M47TV"

source_account = soroban.Identity()
args = [
    {"name": "maintainer", "type": "address", "value": source_account.public_key},
    {"name": "project_key", "type": "bytes", "value": project_key},
    {"name": "hash", "type": "bytes", "value": commit_hash},
]
args = soroban.Parameters(args=args).model_dump()

soroban.invoke(
    contract_id=contract_id,
    function_name="commit",
    args=args,
    source_account=source_account
)
