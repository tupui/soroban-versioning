# Contributing

Welcome to our community! Thank you for taking the time to read the following.

## TL;DR

- All code should have tests.
- All code should be documented.
- No changes are ever committed without review and approval.

## Project management

- _github_ is used for the code base.
- For a PR to be integrated, it must be approved at least by one core team member.
- Development discussions happen on Discord but any request **must** be formalized in _github_. This ensures a common
  history.
- Continuous Integration is provided by _Github actions_ and configuration is located at `.github/workflows`.

## Code

### Local development

After cloning the repository, see the various Makefiles.

For IPFS uploads via Storacha, please follow the guide at `STORACHA.md` to:
- create a Storacha account and obtain a proof,
- encrypt the proof locally using AES-256 with the helper script in `tools/AES256-encrypt.js`, and
- configure `STORACHA_SING_PRIVATE_KEY` and `STORACHA_PROOF` in `dapp/.env` (see `dapp/.env.example`).

### Testing

Testing your code is paramount. Without continuous integration, we **cannot**
guaranty the quality of the code. Some minor modification on a function can
have unexpected implications. With a single commit, everything can go south!
The `main` branch is always on a passing state: CI is green, working code,
and an installable Python package.

> Tests will be automatically launched when you will push your branch to
> GitHub. Be mindful of this resource!

### Linter

Apart from normal unit and integration tests, you can perform a static
analysis of the code using black and ruff for Python, prettier for JS/MD/MDX and standard Rust formatters.

This allows to spot naming errors for example as well as other style errors.

## GIT

### Workflow

The development model is based on the Cactus Model also called
[Trunk Based Development](https://trunkbaseddevelopment.com) model.
More specificaly, we use the Scaled Trunk-Based Development model.

> Some additional ressources:
> [gitflow](https://nvie.com/posts/a-successful-git-branching-model/),
> [gitflow critique](https://barro.github.io/2016/02/a-succesful-git-branching-model-considered-harmful/),
> [github PR](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-request-merges).

It means that **each** new feature has to go through a new branch. Why?
For peer review. Pushing directly on the develop without review should be
exceptional (hotfix)!

This project is using pre-commit hooks. So you have to set it up like this:

```bash
pre-commit install
pre-commit run --all-files
```

When you try to commit your changes, it will launch the pre-commit hooks
(`.pre-commit-config.yaml`)
and modify the files if there are any changes to be made for the commit to be
accepted. If you don't use this feature and your changes are not compliant
(linter), CI will fail.

### Recipe for new feature

If you want to add a modification, create a new branch branching off `main`.
Then you can create a merge request on _github_. From here, the fun begins.

> For every commit you push, the linter and tests are launched.

Your request will only be considered for integration if in a **finished** state:

1. Respect Python/JS/Rust coding rules,
2. Have tests regarding the changes,
3. The branch passes all tests (current and new ones),
4. Maintain test coverage,
5. Have the respective documentation.

#### Writing the commit message

Commit messages should be clear and follow a few basic rules. Example:

```bash
   Add functionality X.

   Lines shouldn't be longer than 72
   characters.  If the commit is related to a ticket, you can indicate that
   with "See #3456", "See ticket 3456", "Closes #3456", or similar.
```

Describing the motivation for a change, the nature of a bug for bug fixes or
some details on what an enhancement does are also good to include in a commit
message. Messages should be understandable without looking at the code
changes. A commit message like `fixed another one` is an example of
what not to do; the reader has to go look for context elsewhere.

### Squash, rebase and merge

Squash-merge is systematically used to maintain a linear history. It's
important to check the message on the squash commit.

## Making a release

Following is the process that the development team follows in order to make
a release:

1. Update the version in the main `pyproject.toml`.
2. Build locally using `hatch build`, and verify the content of the artifacts
3. Submit PR, wait for tests to pass, and merge release into `main`
4. Trigger manually the release workflows
5. Check that release has been deployed to PyPI
6. Upload the WASM for the smart contract
