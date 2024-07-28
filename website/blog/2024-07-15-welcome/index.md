---
slug: activation_award
title: Activation Award
authors: pamphile
tags: [soroban, scf]
---

This is the beginning for Tansu! We are happy to have received a Stellar Community Fund Activation award. This grant is helping us build the foundation of Tansu.

Bellow is the proposal we made for the SCF28. The full proposal can be found [here](https://dashboard.communityfund.stellar.org/scfawards/scf-28_43/activationawardreview/suggestion/1150).

## Introduction

To develop software, developers rely on Version Control Systems (VCS) to keep track of their changes and share their work. Git is one of the most widely used VCS and while being by design decentralized, developers rely on very centralized synchronization systems such as GitHub.

This centralization raises serious concerns as any actor gaining access to these repositories can: change the history, update code, make releases, and even delete files. All this while being hardly noticeable. As open source software is relied upon by all industries, it poses a real threat in terms of software supply chain security.

The core idea of this proposal is to bring Git hashes onto Stellar's blockchain to benefit from the traceability and accountability blockchain technology guarantees. The code itself is still versioned using Git and it is still hosted on the synchronization platform of choice, which does not interfere with maintainers traditional workflows. This gives maintainers access to new ways of managing their project on-chain and at its core it provides a distributed way to prove the integrity of their project.

Our project will greatly benefit Stellar's ecosystem as open-source maintainers using our system will get to use Stellar and Soroban. This will in turn bring some of these maintainers to the Stellar ecosystem.

## From Git to Soroban

Version Control System (VCS), specifically using Git, is ubiquitous among software engineers. Git is by design decentralized, more so, the code history makes use of a Merkle tree: a given version, referred to as a commit, is given a hash and hashes are linked together to provide a history. Git is in essence a blockchain.

When working on a project using Git, everyone gets the complete history and people can push and pull code from one person to another. The resolution of differences between one’s code to another can be challenging if many people work on the same code area.

In practice, teams of developers-maintainers-, need a more convenient way to synchronize their work. To address this problematic, maintainers can use a central platform where they can synchronize their work. GitHub is the most used platform to share and collaborate on open-source projects. For many teams, the whole software development lifecycle happens there, from the inception of ideas to making a release of a new version.

This centralization brings a lot of challenges when it comes to securing the software supply chain. In past years, we have seen attacks on almost every, if not all, parts of this centralized structure. Maintainers are being compromised, they become rogue, through exploit on GitHub or in the continuous integration system the code is compromised, there are occurrences of release artifacts being compromised and GitHub is also deleting projects which they deemed (albeit enforced by local regulations) not suitable for their platforms.

To answer these concerns around software supply chain security, we propose to leverage the Stellar blockchain to store Git hashes. The following components are proposed: (i) a Soroban smart contract register Git hashes on-chain; (ii) a dApp for maintainers to manage their projects and users to participate and monitor their dependencies; and (iii) tools to help maintainers deploy and use this system transparently.

## Soroban Versioning Smart Contract

The core of the proposal is a Soroban Smart Contract called: Soroban Versioning contract. This contract will set the foundation of what will be built to support maintainers with their projects.

The contract will hold project-specific metadata and a key pointing to the last code change hash.

Updating the hash leaves a permanent record on-chain. These update events can be monitored to build an off-chain history and be further compared to the state on other platforms such as GitHub. We will build the necessary services to ingest these events. These services will play a pivotal role as sitting in between Soroban and our proposed dApp.

Strict access control is key to guarantee that only maintainers can update on-chain data. Soroban provides an elegant and robust solution with address signing. By storing a list of authorized maintainers on-chain, we are enabling projects to be more transparency as to who has specific rights.

As we have seen in past similar projects (see the landscape analysis in our architectural document), the developer experience is paramount to get any traction and adoption. To that end, we will provide various Git hooks to seamlessly fit most maintainers workflow.

## dApp

In order to facilitate the use of the Soroban Versioning smart contract, we will build a dApp called: Tansu.

Maintainers will be able to register and administer many aspects of their projects. From adjusting the list of maintainers to update the last hash. Anyone will be able to view the projects, their configurations and the Git history.

This will be achieved through a backend infrastructure by linking on-chain data with what is available on GitHub.


