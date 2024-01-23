//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealEstate is ERC721URIStorage, Pausable, Ownable {
    uint private _tokenIdCounter;

    constructor() ERC721("Real Estate", "R") Ownable(msg.sender) {}

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 currentTokenId = _tokenIdCounter;
        _mint(msg.sender, currentTokenId);
        _setTokenURI(currentTokenId, tokenURI);
        _tokenIdCounter++;

        return currentTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}