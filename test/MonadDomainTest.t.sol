// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MonadDomainRegistry.sol";
import "../src/MonadDomainMarketplace.sol";

contract MonadDomainTest is Test {
    MonadDomainRegistry public registry;
    MonadDomainMarketplace public marketplace;

    address public owner = address(1);
    address public alice = address(2);
    address public bob = address(3);

    function setUp() public {
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);

        vm.startPrank(owner);
        registry = new MonadDomainRegistry();
        marketplace = new MonadDomainMarketplace(address(registry));
        vm.stopPrank();
    }

    function testRegisterDomain() public {
        vm.startPrank(alice);
        registry.register{value: 1 ether}("alice");
        
        uint256 tokenId = registry.computeTokenId("alice");
        assertEq(registry.ownerOf(tokenId), alice);
        assertEq(registry.primaryDomain(alice), "alice");
        vm.stopPrank();
    }

    function testMarketplaceListAndBuy() public {
        // Alice registra el dominio
        vm.startPrank(alice);
        registry.register{value: 1 ether}("monadgod");
        uint256 tokenId = registry.computeTokenId("monadgod");

        // Alice aprueba al marketplace y lo lista por 5 MON
        registry.approve(address(marketplace), tokenId);
        marketplace.listDomain(tokenId, 5 ether);
        vm.stopPrank();

        // Bob lo compra por 5 MON
        vm.startPrank(bob);
        marketplace.buyDomain{value: 5 ether}(tokenId);
        vm.stopPrank();

        // Verificar cambio de titularidad a Bob
        assertEq(registry.ownerOf(tokenId), bob);
    }
}
