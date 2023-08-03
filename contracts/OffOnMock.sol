// SPDX-License-Identifier: MIT

/*

MOCK
MOCK
MOCK
MOCK

*/


pragma solidity ^0.8.17;

import "./Dependencies.sol";
import "./OffOnURI.sol";


contract OffOnMock is ERC721, Ownable {
  uint256 public latestHash;
  OffOnURI public tokenURIContract;

  constructor () ERC721('Have You Tried Turning It Off and On Again?', 'OFFON') {
    tokenURIContract = new OffOnURI();
    _mint(msg.sender, 0);
  }

  function turnOff() external returns (uint256) {
    latestHash = 0;
  }

  function turnOn() external returns (uint256) {
    latestHash =
      block.difficulty;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(tokenId == 0);
    return tokenURIContract.tokenURI(tokenId);
  }
}
