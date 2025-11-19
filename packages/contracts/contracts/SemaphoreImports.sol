// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Thin wrappers around Semaphore contracts from node_modules so that Hardhat
// generates local artifacts we can deploy.

import {Semaphore as BaseSemaphore} from "@semaphore-protocol/contracts/Semaphore.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import {SemaphoreVerifier as BaseSemaphoreVerifier} from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";

contract RaylsSemaphoreVerifier is BaseSemaphoreVerifier {}

contract RaylsSemaphore is BaseSemaphore {
    constructor(BaseSemaphoreVerifier verifier) BaseSemaphore(ISemaphoreVerifier(address(verifier))) {}
}
