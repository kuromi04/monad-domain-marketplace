// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonadDomainMarketplace
 * @notice Marketplace descentralizado para comprar, vender y hacer ofertas por dominios .monad
 */
contract MonadDomainMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    struct Offer {
        address bidder;
        uint256 amount;
        bool isActive;
    }

    IERC721 public immutable registryContract;
    uint256 public feePercent = 2; // 2% de comisión
    address payable public feeRecipient;

    // tokenId => Listing
    mapping(uint256 => Listing) public listings;
    // tokenId => Offer
    mapping(uint256 => Offer) public highestOffers;

    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event OfferPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed bidder, uint256 amount);
    event OfferCancelled(uint256 indexed tokenId, address indexed bidder);

    constructor(address _registry) Ownable(msg.sender) {
        registryContract = IERC721(_registry);
        feeRecipient = payable(msg.sender);
    }

    function listDomain(uint256 tokenId, uint256 price) external {
        require(price > 0, "El precio debe ser mayor a 0");
        require(registryContract.ownerOf(tokenId) == msg.sender, "No eres el dueno del dominio");
        require(
            registryContract.isApprovedForAll(msg.sender, address(this)) ||
            registryContract.getApproved(tokenId) == address(this),
            "Marketplace requiere aprobacion para transferir"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit ItemListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "No existe listado activo");
        require(listing.seller == msg.sender, "No eres el vendedor");

        listing.isActive = false;
        emit ListingCancelled(tokenId, msg.sender);
    }

    function buyDomain(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "El dominio no esta a la venta");
        require(msg.value >= listing.price, "Monto insuficiente de MON");

        address seller = listing.seller;
        uint256 price = listing.price;
        listing.isActive = false;

        uint256 fee = (price * feePercent) / 100;
        uint256 sellerProceeds = price - fee;

        (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
        require(feeSuccess, "Fallo transferencia de comision");

        (bool sellerSuccess, ) = payable(seller).call{value: sellerProceeds}("");
        require(sellerSuccess, "Fallo transferencia al vendedor");

        // Devolución si el comprador envió más MON
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundSuccess, "Fallo devolucion de excedente");
        }

        registryContract.safeTransferFrom(seller, msg.sender, tokenId);

        emit ItemSold(tokenId, msg.sender, seller, price);
    }

    function placeOffer(uint256 tokenId) external payable nonReentrant {
        require(msg.value > 0, "Oferta debe ser mayor a 0");
        Offer storage currentOffer = highestOffers[tokenId];
        require(msg.value > currentOffer.amount, "Debe superar la oferta mas alta actual");

        // Reembolsar oferta previa si existía
        if (currentOffer.isActive && currentOffer.amount > 0) {
            (bool refundSuccess, ) = payable(currentOffer.bidder).call{value: currentOffer.amount}("");
            require(refundSuccess, "Fallo devolucion a postor previo");
        }

        highestOffers[tokenId] = Offer({
            bidder: msg.sender,
            amount: msg.value,
            isActive: true
        });

        emit OfferPlaced(tokenId, msg.sender, msg.value);
    }

    function acceptOffer(uint256 tokenId) external nonReentrant {
        require(registryContract.ownerOf(tokenId) == msg.sender, "No eres el dueno");
        Offer storage offer = highestOffers[tokenId];
        require(offer.isActive, "No hay oferta activa");

        address bidder = offer.bidder;
        uint256 amount = offer.amount;
        offer.isActive = false;

        if (listings[tokenId].isActive) {
            listings[tokenId].isActive = false;
        }

        uint256 fee = (amount * feePercent) / 100;
        uint256 sellerProceeds = amount - fee;

        (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
        require(feeSuccess, "Fallo pago fee");

        (bool sellerSuccess, ) = payable(msg.sender).call{value: sellerProceeds}("");
        require(sellerSuccess, "Fallo pago vendedor");

        registryContract.safeTransferFrom(msg.sender, bidder, tokenId);

        emit OfferAccepted(tokenId, msg.sender, bidder, amount);
    }

    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Comision maxima permitida: 10%");
        feePercent = _feePercent;
    }

    function setFeeRecipient(address payable _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Direccion invalida");
        feeRecipient = _feeRecipient;
    }
}
