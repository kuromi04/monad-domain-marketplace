// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MonadDomainRegistry.sol";
import "../src/MonadDomainMarketplace.sol";

contract DeployMonadDomainService is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar Registry
        MonadDomainRegistry registry = new MonadDomainRegistry();
        console.log("MonadDomainRegistry desplegado en:", address(registry));

        // 2. Desplegar Marketplace
        MonadDomainMarketplace marketplace = new MonadDomainMarketplace(address(registry));
        console.log("MonadDomainMarketplace desplegado en:", address(marketplace));

        vm.stopBroadcast();
    }
}
