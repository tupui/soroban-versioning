# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "stellar-sdk",
#     "cryptography",
#     "pycryptodome",
# ]
# ///
"""
Check Tansu anonymous vote status and proof. Uses Stellar SDK ContractClient + scval.
Query by project + proposal_id, or by vote transaction hash (extracts proposal from tx).
"""

from __future__ import annotations

import argparse
import json
import sys
from base64 import b64decode

from Crypto.Hash import keccak
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

from stellar_sdk import Network, scval
from stellar_sdk.contract import ContractClient

# -----------------------------------------------------------------------------
# Hardcoded RPC and contract IDs (plan: SDF testnet, Quasar Lightsail mainnet)
# -----------------------------------------------------------------------------
TESTNET_RPC = "https://soroban-testnet.stellar.org:443"
TESTNET_PASSPHRASE = Network.TESTNET_NETWORK_PASSPHRASE
TESTNET_CONTRACT_ID = "CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA"

MAINNET_RPC = "https://soroban-mainnet.quasar.dev"
MAINNET_PASSPHRASE = Network.PUBLIC_NETWORK_PASSPHRASE
MAINNET_CONTRACT_ID = "CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA"  # placeholder; replace for mainnet


def get_network_config(network: str) -> tuple[str, str, str]:
    if network == "testnet":
        return TESTNET_RPC, TESTNET_PASSPHRASE, TESTNET_CONTRACT_ID
    if network == "mainnet":
        return MAINNET_RPC, MAINNET_PASSPHRASE, MAINNET_CONTRACT_ID
    raise ValueError(f"Unknown network: {network}")


def derive_project_key(project_name: str) -> bytes:
    name = project_name.strip().lower().encode("utf-8")
    h = keccak.new(digest_bits=256)
    h.update(name)
    return h.digest()


def load_key_file(path: str) -> tuple[str | None, str]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    priv = data.get("privateKey") or data.get("private_key")
    if not priv:
        raise SystemExit("Key file must contain privateKey or private_key")
    pub = data.get("publicKey") or data.get("public_key")
    return (pub, priv)


def load_private_key(priv_str: str):
    """Load private key from base64 DER or PEM string."""
    try:
        raw = b64decode(priv_str.replace("-", "+").replace("_", "/"))
    except Exception:
        raw = priv_str.encode("utf-8") if isinstance(priv_str, str) else priv_str
    if raw.startswith(b"-----BEGIN"):
        return serialization.load_pem_private_key(
            raw, password=None, backend=default_backend()
        )
    return serialization.load_der_private_key(
        raw, password=None, backend=default_backend()
    )


def decrypt_value(cipher_b64: str, private_key) -> int:
    cipher = b64decode(cipher_b64.replace("-", "+").replace("_", "/"))
    plain = private_key.decrypt(
        cipher,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    text = plain.decode("utf-8")
    part = text.split(":")[-1].strip()
    return int(part) if part.isdigit() else 0


def get_proposal_scval(
    client: ContractClient,
    project_key: bytes,
    proposal_id: int,
):
    params = [
        scval.to_bytes(project_key),
        scval.to_uint32(proposal_id),
    ]
    atx = client.invoke(
        "get_proposal",
        parameters=params,
        signer=None,
        simulate=True,
    )
    atx.simulate()
    return atx.result()


def proof_scval(
    client: ContractClient,
    project_key: bytes,
    proposal_scval,
    tallies: list[int],
    seeds: list[int],
) -> tuple[bool, str | None]:
    tallies_vec = scval.to_vec([scval.to_uint128(t) for t in tallies])
    seeds_vec = scval.to_vec([scval.to_uint128(s) for s in seeds])
    params = [
        scval.to_bytes(project_key),
        proposal_scval,
        tallies_vec,
        seeds_vec,
    ]
    try:
        atx = client.invoke(
            "proof",
            parameters=params,
            signer=None,
            simulate=True,
        )
        atx.simulate()
        result = atx.result()
        try:
            ok = scval.from_bool(result)
        except Exception:
            ok = bool(scval.to_native(result))
        return (ok, None)
    except Exception as e:
        return (False, str(e))


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Check Tansu proposal and anonymous vote proof (project + proposal_id or tx hash)."
    )
    ap.add_argument("--project", type=str, help="Project name (e.g. tansu)")
    ap.add_argument("--proposal-id", type=int, help="Proposal ID")
    ap.add_argument(
        "--tx", type=str, help="Vote transaction hash (to derive proposal from tx)"
    )
    ap.add_argument(
        "--key-file", type=str, help="JSON file with privateKey for decryption"
    )
    ap.add_argument(
        "--network",
        type=str,
        choices=("testnet", "mainnet"),
        default="testnet",
        help="Network (default: testnet)",
    )
    args = ap.parse_args()

    project = args.project
    proposal_id = args.proposal_id
    tx_hash = args.tx
    key_file = args.key_file
    network = args.network

    if tx_hash and not (project and proposal_id is not None):
        print(
            "When using --tx, also pass --project and --proposal-id to check that proposal.",
            file=sys.stderr,
        )
        sys.exit(1)

    if not project or proposal_id is None:
        ap.print_help()
        sys.exit(1)

    rpc_url, passphrase, contract_id = get_network_config(network)
    client = ContractClient(contract_id, rpc_url, passphrase)

    project_key = derive_project_key(project)
    print(f"project: {project}")
    print(f"project_key (hex): {project_key.hex()}")
    print(f"proposal_id: {proposal_id}")
    print(f"network: {network}")

    try:
        proposal_scval = get_proposal_scval(client, project_key, proposal_id)
    except Exception as e:
        print(f"get_proposal failed: {e}", file=sys.stderr)
        sys.exit(1)

    proposal = scval.to_native(proposal_scval)
    if isinstance(proposal, dict):
        status = proposal.get("status")
        vote_data = proposal.get("vote_data") or {}
        votes = vote_data.get("votes") or []
        proposer_addr = proposal.get("proposer")
    else:
        status = getattr(proposal, "status", None)
        vote_data = getattr(proposal, "vote_data", None) or {}
        votes = getattr(vote_data, "votes", []) if vote_data else []
        proposer_addr = getattr(proposal, "proposer", None)
    if isinstance(proposer_addr, dict):
        proposer_addr = proposer_addr.get("address") or proposer_addr.get("value")
    if proposer_addr is not None and not isinstance(proposer_addr, str):
        proposer_addr = str(proposer_addr)

    print(f"status: {status}")
    print(f"votes count: {len(votes)}")

    def _vote_tag_and_data(v):
        if isinstance(v, (list, tuple)) and len(v) >= 2:
            return v[0], v[1] if isinstance(v[1], dict) else {}
        if isinstance(v, dict):
            tag = v.get("tag")
            vals = (v.get("values") or [v])[0] if v.get("values") else v
            return tag, (vals if isinstance(vals, dict) else {})
        return getattr(v, "tag", None), (
            getattr(v, "values", [{}])[0] if getattr(v, "values", None) else {}
        )

    # List anonymous vote commitments for cross-check with Stellar Expert
    for i, v in enumerate(votes):
        tag, data = _vote_tag_and_data(v)
        if tag == "AnonymousVote" or (isinstance(data, dict) and "commitments" in data):
            commitments = data.get("commitments", [])
            weight = data.get("weight", 0)
            print(
                f"  vote[{i}] AnonymousVote weight={weight} commitments={len(commitments)}"
            )

    # Decrypt and compute tallies/seeds if key file provided
    tallies = [0, 0, 0]
    seeds = [0, 0, 0]
    if key_file:
        try:
            _pub, priv_b64 = load_key_file(key_file)
        except FileNotFoundError:
            print(f"key-file not found: {key_file}", file=sys.stderr)
            sys.exit(1)
        try:
            priv_key = load_private_key(priv_b64)
        except Exception as e:
            print(f"key-file load failed: {e}", file=sys.stderr)
            sys.exit(1)

        for v in votes:
            tag, data = _vote_tag_and_data(v)
            if tag != "AnonymousVote":
                continue
            addr = data.get("address")
            if addr is not None and not isinstance(addr, str):
                addr = str(addr)
            weight = data.get("weight", 1)
            if addr == proposer_addr:
                weight = 500_000  # Badge::Verified
            enc_votes = data.get("encrypted_votes") or []
            enc_seeds = data.get("encrypted_seeds") or []
            for j in range(min(3, len(enc_votes), len(enc_seeds))):
                try:
                    v_dec = decrypt_value(enc_votes[j], priv_key)
                except Exception:
                    v_dec = int(enc_votes[j]) if str(enc_votes[j]).isdigit() else 0
                try:
                    s_dec = decrypt_value(enc_seeds[j], priv_key)
                except Exception:
                    s_dec = int(enc_seeds[j]) if str(enc_seeds[j]).isdigit() else 0
                tallies[j] += v_dec * weight
                seeds[j] += s_dec * weight

        print("tallies (approve, reject, abstain):", tallies)
        print("seeds (approve, reject, abstain):", seeds)

        ok, err = proof_scval(client, project_key, proposal_scval, tallies, seeds)
        if err:
            print(f"proof error: {err}")
        print(f"proof: {'OK' if ok else 'FAIL'}")


if __name__ == "__main__":
    main()
