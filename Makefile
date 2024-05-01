.PHONY: help install prepare fmt clean build test build-release deploy contract_help
.DEFAULT_GOAL := help
SHELL:=/bin/bash

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

prepare:  ## Generate identity and fund
	soroban network add --global testnet \
  		--rpc-url https://soroban-testnet.stellar.org:443 \
  		--network-passphrase "Test SDF Network ; September 2015" && \
	# generate addresses and add funds
	soroban keys generate grogu --network testnet && \
	soroban keys generate mando --network testnet

fmt:
	cargo fmt --all

clean:
	cargo clean

build:
	soroban contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

test: build
	cargo test

build-release: build
	soroban contract optimize --wasm target/wasm32-unknown-unknown/release/versioning.wasm
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

deploy: test build-release  ## Deploy Soroban contract to testnet
	soroban contract deploy \
  		--wasm target/wasm32-unknown-unknown/release/versioning.optimized.wasm \
  		--source-account mando \
  		--network testnet \
  		> .soroban/soroban_versioning_id && \
  	cat .soroban/soroban_versioning_id

contract_help:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	--help

contract_version:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	version

contract_init:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	init \
    	--admin $(shell soroban keys address mando)

contract_register:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	register \
    	--maintainer $(shell soroban keys address mando) \
    	--name 736f726f62616e2d76657273696f6e696e67 \
    	--maintainers '{ "vec": [{ "address": "$(shell soroban config identity address mando)" }] }' \
    	--url 68747470733a2f2f6769746875622e636f6d2f74757075692f736f726f62616e2d76657273696f6e696e67 \
    	--hash a8b643ffc4d76d896d601d82a58f291eb6f2f233

contract_commit:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	commit \
    	--maintainer $(shell soroban keys address mando) \
    	--project_key 9afcde4ad92b1d44e7457bf380cbb0f8ef1eb3f3517ee7b72f43beb7c3bc02ac \
    	--hash 6d1dcd0d6d3c7bde814f38aa87a59876211f76363

contract_get_commit:
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	get_commit \
    	--project_key 9afcde4ad92b1d44e7457bf380cbb0f8ef1eb3f3517ee7b72f43beb7c3bc02ac


contract_upgrade: build-release
	soroban contract invoke \
    	--source-account mando \
    	--network testnet \
    	--id $(shell cat .soroban/soroban_versioning_id) \
    	-- \
    	upgrade \
		--new_wasm_hash $(shell soroban contract install --source-account mando --network testnet --wasm target/wasm32-unknown-unknown/release/seal_coin.optimized.wasm)
