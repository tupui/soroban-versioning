.PHONY: help install prepare rust-lint clean contract_build contract_test contract_deploy contract_help
.DEFAULT_GOAL := help
SHELL:=/bin/bash

ifndef network
   override network = testnet
endif

# Add help text after each target name starting with '\#\#'
help:   ## show this help
	@echo -e "Help for this makefile\n"
	@echo "Possible commands are:"
	@grep -h "##" $(MAKEFILE_LIST) | grep -v grep | sed -e 's/\(.*\):.*##\(.*\)/    \1: \2/'

install:  ## install Rust and Soroban-CLI
	# install Rust
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh && \
	# install Soroban and config
	rustup target add wasm32-unknown-unknown && \
	cargo install --locked soroban-cli --features opt

prepare-network:  ## Setup network
ifeq ($(network),testnet)
	stellar network add --global testnet \
		--rpc-url https://soroban-testnet.stellar.org:443 \
		--network-passphrase "Test SDF Network ; September 2015"
else
	stellar network add --global testnet-local \
		--rpc-url http://localhost:8000/soroban/rpc \
		--network-passphrase "Standalone Network ; February 2017"
endif

prepare: prepare-network  ## Setup network and generate addresses and add funds
	stellar keys generate grogu-$(network) --network $(network) && \
	stellar keys generate mando-$(network) --network $(network)

rust-lint:
	cargo clippy --all-targets --all-features -- -Dwarnings
	cargo fmt -- --emit files

clean:
	cargo clean

# --------- Events --------- #

events_test:
	echo 0

# --------- Fullstack --------- #

local-stack:  ## local stack
	docker compose up

# --------- CONTRACT BUILD/TEST/DEPLOY --------- #

contract_build:
	stellar contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

contract_test: contract_build
	cargo test

contract_build-release: contract_build
	stellar contract optimize --wasm target/wasm32-unknown-unknown/release/versioning.wasm
	@ls -l target/wasm32-unknown-unknown/release/*.wasm


contract_bindings: contract_build-release
	stellar contract bindings typescript \
		--network $(network) \
		--contract-id $(shell cat .soroban/soroban_versioning_id) \
		--output-dir web/bindings/ts \
		--overwrite

contract_deploy: contract_test contract_build-release  ## Deploy Soroban contract to testnet
	stellar contract deploy \
  		--wasm target/wasm32-unknown-unknown/release/versioning.optimized.wasm \
  		--source-account mando-$(network) \
  		--network $(network) \
  		> .soroban/soroban_versioning_id && \
  	cat .soroban/soroban_versioning_id

contract_init:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	init \
    	--admin $(shell soroban keys address mando-$(network))

contract_upgrade: contract_build-release
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	upgrade \
		--new_wasm_hash $(shell stellar contract install --source-account mando-$(network) --network $(network) --wasm target/wasm32-unknown-unknown/release/versioning.optimized.wasm)

# --------- CONTRACT USAGE --------- #

contract_help:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	--help

contract_version:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	version

contract_register:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	register \
    	--maintainer $(shell soroban keys address mando-$(network)) \
    	--name tansu \
    	--maintainers '{ "vec": [{ "address": "$(shell soroban keys address mando-$(network))" }] }' \
    	--url https://github.com/tupui/soroban-versioning \
    	--hash cc666276837abfa36543b9659b363225c5effdd5

contract_commit:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	commit \
    	--maintainer $(shell soroban keys address mando-$(network)) \
    	--project_key 37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156 \
    	--hash 35113943ffda2b538193234f0caa5c2261400c1c

contract_get_commit:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	get_commit \
    	--project_key 37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156
