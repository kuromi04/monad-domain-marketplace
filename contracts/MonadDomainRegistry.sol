// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title MonadDomainRegistry
 * @notice Service de dominios .monad con estándar ERC-721 y metadatos SVG On-Chain
 */
contract MonadDomainRegistry is ERC721URIStorage, Ownable {
    using Strings for uint256;

    struct DomainRecord {
        string name;
        address resolvedAddress;
        uint256 registeredAt;
        uint256 expiresAt;
        string textRecord;
    }

    uint256 public constant REGISTRATION_DURATION = 365 days;
    uint256 public basePrice = 1 ether; // 1 MON para nombres de 5+ letras
    string public domainExtension = ".monad";

    // tokenId => DomainRecord
    mapping(uint256 => DomainRecord) public domains;
    // name hash => tokenId
    mapping(string => uint256) public nameToTokenId;
    // Reverse resolution: address => primary domain name
    mapping(address => string) public primaryDomain;

    event DomainRegistered(
        string indexed name,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 expiresAt
    );
    event DomainRenewed(string indexed name, uint256 indexed tokenId, uint256 newExpiresAt);
    event AddressResolved(string indexed name, address indexed resolvedAddress);
    event TextRecordUpdated(string indexed name, string textRecord);
    event PrimaryDomainSet(address indexed user, string name);
    event PriceUpdated(uint256 newPrice);

    constructor() ERC721("Monad Domain Name Service", "MDNS") Ownable(msg.sender) {}

    function computeTokenId(string memory name) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(name)));
    }

    function isAvailable(string calldata name) public view returns (bool) {
        uint256 tokenId = computeTokenId(name);
        return domains[tokenId].expiresAt < block.timestamp;
    }

    /**
     * @notice Calcula el precio de registro o renovación anual según la longitud
     * 3 letras: 10 MON / año (Super Premium)
     * 4 letras: 3 MON / año (Premium)
     * 5+ letras: 1 MON / año (Estándar)
     */
    function getRegistrationPrice(string calldata name) public view returns (uint256) {
        uint256 len = bytes(name).length;
        if (len == 3) {
            return basePrice * 10;
        } else if (len == 4) {
            return basePrice * 3;
        } else {
            return basePrice;
        }
    }

    function register(string calldata name) external payable {
        uint256 reqPrice = getRegistrationPrice(name);
        require(msg.value >= reqPrice, "Monto insuficiente de MON para la longitud del dominio");
        require(bytes(name).length >= 3, "Nombre muy corto (minimo 3 caracteres)");
        require(isAvailable(name), "Dominio ya se encuentra registrado y activo");

        uint256 tokenId = computeTokenId(name);
        uint256 expiresAt = block.timestamp + REGISTRATION_DURATION;

        domains[tokenId] = DomainRecord({
            name: name,
            resolvedAddress: msg.sender,
            registeredAt: block.timestamp,
            expiresAt: expiresAt,
            textRecord: ""
        });
        nameToTokenId[name] = tokenId;

        // Si ya tenía dueño previo y expiró, se quema para re-emitir
        if (_ownerOf(tokenId) != address(0)) {
            _burn(tokenId);
        }

        _safeMint(msg.sender, tokenId);

        // Asignar dominio primario si el usuario aun no tiene
        if (bytes(primaryDomain[msg.sender]).length == 0) {
            primaryDomain[msg.sender] = name;
            emit PrimaryDomainSet(msg.sender, name);
        }

        emit DomainRegistered(name, tokenId, msg.sender, expiresAt);
        emit AddressResolved(name, msg.sender);
    }

    /**
     * @notice Permite renovar la vigencia del dominio por 1 o más años
     */
    function renew(string calldata name, uint256 yearsCount) external payable {
        require(yearsCount > 0, "Minimo 1 anio");
        uint256 tokenId = nameToTokenId[name];
        require(ownerOf(tokenId) == msg.sender, "No eres el titular del dominio");

        uint256 singleYearPrice = getRegistrationPrice(name);
        uint256 totalPrice = singleYearPrice * yearsCount;
        require(msg.value >= totalPrice, "Monto insuficiente de MON para renovacion");

        uint256 currentExpiry = domains[tokenId].expiresAt;
        uint256 baseTimestamp = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        uint256 newExpiry = baseTimestamp + (REGISTRATION_DURATION * yearsCount);

        domains[tokenId].expiresAt = newExpiry;
        emit DomainRenewed(name, tokenId, newExpiry);
    }

    function setResolvedAddress(string calldata name, address newAddress) external {
        uint256 tokenId = nameToTokenId[name];
        require(ownerOf(tokenId) == msg.sender, "No eres el titular del dominio");
        require(domains[tokenId].expiresAt >= block.timestamp, "Dominio expirado");

        domains[tokenId].resolvedAddress = newAddress;
        emit AddressResolved(name, newAddress);
    }

    function setTextRecord(string calldata name, string calldata record) external {
        uint256 tokenId = nameToTokenId[name];
        require(ownerOf(tokenId) == msg.sender, "No eres el titular del dominio");
        require(domains[tokenId].expiresAt >= block.timestamp, "Dominio expirado");

        domains[tokenId].textRecord = record;
        emit TextRecordUpdated(name, record);
    }

    function setPrimaryDomain(string calldata name) external {
        uint256 tokenId = nameToTokenId[name];
        require(ownerOf(tokenId) == msg.sender, "No eres el titular del dominio");
        require(domains[tokenId].expiresAt >= block.timestamp, "Dominio expirado");

        primaryDomain[msg.sender] = name;
        emit PrimaryDomainSet(msg.sender, name);
    }

    function setBasePrice(uint256 newPrice) external onlyOwner {
        basePrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @notice Generador On-Chain de SVG y metadatos ERC-721 en Base64
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        DomainRecord memory record = domains[tokenId];
        string memory fullName = string(abi.encodePacked(record.name, domainExtension));

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">',
                '<defs>',
                '<linearGradient id="monadGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="#171926"/>',
                '<stop offset="50%" stop-color="#241b47"/>',
                '<stop offset="100%" stop-color="#07070d"/>',
                '</linearGradient>',
                '<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">',
                '<stop offset="0%" stop-color="#836ef9"/>',
                '<stop offset="100%" stop-color="#06b6d4"/>',
                '</linearGradient>',
                '</defs>',
                '<rect width="500" height="500" rx="30" fill="url(#monadGrad)"/>',
                '<rect x="25" y="25" width="450" height="450" rx="20" fill="none" stroke="rgba(131,110,249,0.3)" stroke-width="2"/>',
                '<circle cx="70" cy="70" r="18" fill="#836ef9"/>',
                '<text x="100" y="76" font-family="sans-serif" font-weight="bold" font-size="16" fill="#a855f7">MONAD NAME SERVICE</text>',
                '<text x="250" y="260" font-family="sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">',
                fullName,
                '</text>',
                '<rect x="180" y="300" width="140" height="30" rx="10" fill="rgba(6,182,212,0.15)" stroke="#06b6d4" stroke-width="1"/>',
                '<text x="250" y="320" font-family="sans-serif" font-weight="bold" font-size="12" fill="#06b6d4" text-anchor="middle">TESTNET 10,000 TPS</text>',
                '</svg>'
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"', fullName, '",',
                        '"description":"Dominio descentralizado en la red Monad (MDNS)",',
                        '"attributes":[{"trait_type":"Extension","value":".monad"},',
                        '{"trait_type":"Length","value":', Strings.toString(bytes(record.name).length), '},',
                        '{"trait_type":"Expires At","value":', Strings.toString(record.expiresAt), '}],',
                        '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
