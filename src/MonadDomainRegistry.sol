// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MonadDomainRegistry
 * @notice Service de dominios .monad con estándar ERC-721
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
    uint256 public registrationPrice = 1 ether; // 1 MON por año
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

    function register(string calldata name) external payable {
        require(msg.value >= registrationPrice, "Monto insuficiente de MON");
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

    function setRegistrationPrice(uint256 newPrice) external onlyOwner {
        registrationPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
