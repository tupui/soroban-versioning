![Soroban Versioning logo: representation of a planet with a circle and two
45 degrees parallel lines cutting it in the middle. Two small circles at the
intersection between the circle and the lines. This represent Git with
branches and merge commits](doc/svn-logo.svg)

# Soroban Versioning

*- or SVN if you want to make some people angry*

## Rational

Version control systems like Git are by design decentralized. The reality is
that we heavily rely on tools like GitHub. While GitHub is great for
collaborating, it's a strongly centralized system, bearing all its caveats.

One of the biggest issues being that maintainers can force push code,
effectively rewriting the commit history.

The core idea of this project is to offer an on-chain hash traceability. The
code itself is still versioned using Git and it is still hosted on any
platform, but you keep on-chain a hash history. What it provides is an
independent and distributed way to prove the integrity of a repository.

## Usage

The first step is to register a project.

```bash
soroban contract invoke \
    --source-account maintainer \
    --network testnet \
    --id CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK \
    -- \
    register \
    --maintainer maintainer \
    --name ... \
    --maintainers '{ "vec": [{ "address": ... }] }' \
    --url ... \
    --hash ...
```

![Contract on-chain](doc/contract.png)

Then maintainers can commit changes on-chain as they push new commits.

```bash
soroban contract invoke \
    --source-account maintainer \
    --network testnet \
    --id CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK \
    -- \
    commit \
    --maintainer maintainer \
    --project_key ... \
    --hash ...
```

![Contract on-chain](doc/storage.png)

There is a convenient pre-push hook which can be used. This ensures that a
commit is only pushed if the hash is sent properly on-chain first.

```bash
pre-commit install -t pre-push
```
