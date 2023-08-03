// SPDX-License-Identifier: MIT

/*



*/


pragma solidity ^0.8.17;

import "./Dependencies.sol";
import "./OffOnURI.sol";


contract OffOn is ERC721, Ownable {
  uint256 public constant totalSupply = 1;
  address private _royaltyBeneficiary;
  uint16 private _royaltyBasisPoints = 1000;

  uint256 public latestHash;

  OffOnURI public tokenURIContract;

  /// @notice Emitted when a token's metadata is updated
  /// @param _tokenId The ID of the updated token
  /// @dev See EIP-4906: https://eips.ethereum.org/EIPS/eip-4906
  event MetadataUpdate(uint256 _tokenId);


  constructor () ERC721('Have You Tried Turning It Off and On Again?', 'OFFON') {
    _royaltyBeneficiary = msg.sender;
    tokenURIContract = new OffOnURI();
    _mint(msg.sender, 0);
  }

  function turnOff() external stateAction {
    latestHash = 0;
  }

  function turnOn() external stateAction {
    require(latestHash == 0, 'Cannot turn on if not off');
    latestHash = block.difficulty;
  }

  modifier stateAction {
    require(ownerOf(0) == msg.sender, 'Only token owner can turn off or on');
    _;
    emit MetadataUpdate(0);

  }


  /// @notice Token URI
  /// @param tokenId Token ID to look up URI of
  /// @return Token URI
  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(tokenId == 0, "ERC721Metadata: URI query for nonexistent token");
    return tokenURIContract.tokenURI(tokenId);
  }


  /// @notice Set the Token URI contract
  /// @param newContract Address of the new Token URI contract
  function setTokenURIContract(address newContract) external onlyOwner {
    tokenURIContract = OffOnURI(newContract);
    emit MetadataUpdate(0);
  }




  /// @notice Checks if given token ID exists
  /// @param tokenId Token to run existence check on
  /// @return True if token exists
  function exists(uint256 tokenId) external pure returns (bool) {
    return tokenId == 0;
  }




  /// @notice Sets royalty info for the collection
  /// @param royaltyBeneficiary Address to receive royalties
  /// @param royaltyBasisPoints Basis points of royalty commission
  /// @dev See EIP-2981: https://eips.ethereum.org/EIPS/eip-2981
  function setRoyaltyInfo(
    address royaltyBeneficiary,
    uint16 royaltyBasisPoints
  ) external onlyOwner {
    _royaltyBeneficiary = royaltyBeneficiary;
    _royaltyBasisPoints = royaltyBasisPoints;
  }

  /// @notice Called with the sale price to determine how much royalty is owed and to whom.
  /// @param (unused)
  /// @param _salePrice The sale price of the NFT asset specified by _tokenId
  /// @return receiver Address of who should be sent the royalty payment
  /// @return royaltyAmount The royalty payment amount for _salePrice
  /// @dev See EIP-2981: https://eips.ethereum.org/EIPS/eip-2981
  function royaltyInfo(uint256, uint256 _salePrice) external view returns (address, uint256) {
    return (_royaltyBeneficiary, _salePrice * _royaltyBasisPoints / 10000);
  }

  /// @notice Query if a contract implements an interface
  /// @param interfaceId The interface identifier, as specified in ERC-165
  /// @return `true` if the contract implements `interfaceId` and
  ///         `interfaceId` is not 0xffffffff, `false` otherwise
  /// @dev Interface identification is specified in ERC-165. This function
  ///      uses less than 30,000 gas. See: https://eips.ethereum.org/EIPS/eip-165
  ///      See EIP-4906: https://eips.ethereum.org/EIPS/eip-4906
  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
    return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
  }
}
