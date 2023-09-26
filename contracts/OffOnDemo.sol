// SPDX-License-Identifier: MIT



pragma solidity ^0.8.17;


interface IOffOn {
  function turnOff() external;
  function turnOn() external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
}


contract OffOnDemo {
  IOffOn public offOn;
  address public owner;

  constructor (IOffOn _offOn) {
    owner = msg.sender;
    offOn = _offOn;
  }

  function withdraw() external {
    require(msg.sender == owner, 'Only owner can withdraw');
    offOn.safeTransferFrom(address(this), owner, 0);
  }

  function turnOff() external {
    offOn.turnOff();
  }

  function turnOn() external {
    offOn.turnOn();
  }

  function onERC721Received(address, address, uint256, bytes calldata) external pure returns(bytes4) {
    return this.onERC721Received.selector;
  }
}
