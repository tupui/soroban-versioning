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

