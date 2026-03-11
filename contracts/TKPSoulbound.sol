// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract TKPSoulbound is IERC5192 {
    string public name = "TKP Soulbound Certificate";
    string public symbol = "TKPSC";
    address public owner;
    uint256 private _tokenIdCounter;

    struct Certificate {
        string certNumber;
        string holderName;
        string danLevel;
        string issuedDate;
        string dojoName;
        address holder;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event CertificateIssued(uint256 tokenId, address to, string certNumber);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function locked(uint256 tokenId) external pure override returns (bool) {
        return true;
    }

    function issueCertificate(
        address to,
        string memory certNumber,
        string memory holderName,
        string memory danLevel,
        string memory issuedDate,
        string memory dojoName
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = ++_tokenIdCounter;

        certificates[tokenId] = Certificate({
            certNumber: certNumber,
            holderName: holderName,
            danLevel: danLevel,
            issuedDate: issuedDate,
            dojoName: dojoName,
            holder: to
        });

        _owners[tokenId] = to;
        _balances[to] += 1;

        emit Transfer(address(0), to, tokenId);
        emit Locked(tokenId);
        emit CertificateIssued(tokenId, to, certNumber);

        return tokenId;
    }

    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return certificates[tokenId];
    }

    function balanceOf(address holder) external view returns (uint256) {
        return _balances[holder];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _owners[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}