.PHONY: help install prepare rust-lint clean contract_build contract_test contract_deploy contract_help
.DEFAULT_GOAL := help
SHELL:=/bin/bash

ifndef network
   override network = testnet
endif

ifndef domain_contract_id
	override domain_contract_id = $(shell cat .stellar/soroban_domain_id)
endif

ifndef wasm
override wasm = target/wasm32v1-none/release/tansu.optimized.wasm
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
	rustup target add wasm32v1-none && \
	cargo install --locked stellar-cli

prepare-network:  ## Setup network
ifeq ($(network),testnet)
	stellar network add --global testnet \
		--rpc-url https://soroban-testnet.stellar.org:443 \
		--network-passphrase "Test SDF Network ; September 2015"
else ifeq ($(network),mainnet)
	stellar network add --global mainnet \
		--rpc-url ... \
		--network-passphrase "Public Global Stellar Network ; September 2015"
else
	stellar network add --global testnet-local \
		--rpc-url http://localhost:8000/soroban/rpc \
		--network-passphrase "Standalone Network ; February 2017"
endif

prepare: prepare-network  ## Setup network and generate addresses and add funds
	stellar keys generate grogu-$(network) --network $(network) && \
	stellar keys generate mando-$(network) --network $(network)

funds:
	stellar keys fund grogu-$(network) --network $(network) && \
	stellar keys fund mando-$(network) --network $(network)

rust-lint:
	cargo clippy --all-targets --all-features -- -Dwarnings
	cargo fmt -- --emit files

clean:
	rm target/wasm32v1-none/release/*.wasm
	rm target/wasm32v1-none/release/*.d
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
	@ls -l target/wasm32v1-none/release/*.wasm

contract_test:
	cargo test

contract_build-release: contract_build
	stellar contract optimize --wasm target/wasm32v1-none/release/tansu.wasm
	@ls -l target/wasm32v1-none/release/*.wasm


# --contract-id $(shell cat .stellar/tansu_id)
contract_bindings: contract_build-release  ## Create bindings
	stellar contract bindings typescript \
		--network $(network) \
		--wasm target/wasm32v1-none/release/tansu.optimized.wasm \
		--output-dir dapp/packages/tansu \
		--overwrite && \
	cd dapp/packages/tansu && \
	bun run build && \
	cd ../.. && \
	bun format

contract_deploy:  ## Deploy Soroban contract to testnet
	stellar contract deploy \
  		--wasm target/wasm32v1-none/release/tansu.optimized.wasm \
  		--source-account mando-$(network) \
  		--network $(network) \
  		-- \
  		--admin $(shell stellar keys address mando-$(network)) \
		--domain_contract_id $(domain_contract_id) \
  		> .stellar/tansu_id && \
  	cat .stellar/tansu_id

contract_upgrade:  ## After manually pulling the wasm from the pipeline, update the contract
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	upgrade \
		--new_wasm_hash $(shell stellar contract upload --source-account mando-$(network) --network $(network) --wasm $(wasm)) \
		--admin $(shell stellar keys address mando-$(network)) \
		--domain_contract_id $(domain_contract_id)

# --------- Soroban Domains --------- #

contract_domain_deploy:
	stellar contract deploy \
  		--wasm contracts/domain_3ebbeec072f4996958d4318656186732773ab5f0c159dcf039be202b4ecb8af8.wasm \
  		--source-account mando-$(network) \
  		--network $(network) \
  		> .stellar/soroban_domain_id && \
  	cat .stellar/soroban_domain_id

contract_domain_init:
	stellar contract invoke \
		--source-account mando-testnet \
		--network testnet \
		--id $(shell cat .stellar/soroban_domain_id) \
		-- \
		init \
		--adm $(shell stellar keys address mando-$(network)) \
		--node_rate 100 \
		--col_asset $(shell stellar contract id asset --asset native --network $(network)) \
		--min_duration 31536000 \
		--allowed_tlds '[{"bytes": "786c6d"}]'

# --------- CONTRACT USAGE EXAMPLES --------- #

contract_help:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	--help

contract_version:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	version

contract_register:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	register \
    	--maintainer $(shell stellar keys address mando-$(network)) \
    	--name tansu \
    	--maintainers '["$(shell stellar keys address mando-$(network))", "$(shell stellar keys address grogu-$(network))"]' \
    	--url https://github.com/tupui/soroban-versioning \
    	--hash 920b7ffed638360e7259c4b6a4691ef947cfb9bc4ab1b3d6b7f0628c71e86b25

contract_commit:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	commit \
    	--maintainer $(shell stellar keys address mando-$(network)) \
    	--project_key 37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156 \
    	--hash bc4d84f2b00501ce6c176d797371f65799838720

contract_get_commit:
	stellar contract invoke \
    	--source-account mando-$(network) \
    	--network $(network) \
    	--id $(shell cat .stellar/tansu_id) \
    	-- \
    	get_commit \
    	--project_key 37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156
