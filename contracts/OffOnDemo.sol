// SPDX-License-Identifier: MIT



pragma solidity ^0.8.17;


interface IOffOn {
  function turnOff() external;
  function turnOn() external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
  function lastTurnedOn() external view returns (uint256);
  function lastTurnedOff() external view returns (uint256);
}


contract OffOnDemo {
  IOffOn public offOn;
  address public owner;

  constructor (IOffOn _offOn) {
    offOn = _offOn;
  }

  function withdraw() external {
    require(msg.sender == owner, 'Only owner can withdraw');
    offOn.safeTransferFrom(address(this), owner, 0);
  }

  function turnOff() external {
    require(block.timestamp > offOn.lastTurnedOn() + 2 minutes, 'Must wait at least 2 minutes');
    offOn.turnOff();
  }

  function turnOn() external {
    require(block.timestamp > offOn.lastTurnedOff() + 2 minutes, 'Must wait at least 2 minutes');
    offOn.turnOn();
  }

  function onERC721Received(
    address,
    address from,
    uint256,
    bytes calldata
  ) external returns(bytes4) {
    if (msg.sender == address(offOn)) {
      owner = from;
    }
    return this.onERC721Received.selector;
  }
}
