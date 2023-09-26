const safeTransferFrom = 'safeTransferFrom(address,address,uint256)'


async function main() {
  const signers = await ethers.getSigners()
  const artist = signers[0]


  const OffOnFactory = await ethers.getContractFactory('OffOn', artist)
  const OffOn = await OffOnFactory.deploy()
  await OffOn.deployed()

  const OffOnEscrowFactory = await ethers.getContractFactory('OffOnDemo', artist)
  const OffOnDemo = await OffOnEscrowFactory.deploy(OffOn.address)
  await OffOnDemo.deployed()

  await OffOn.connect(artist)[safeTransferFrom](artist.address, OffOnDemo.address, 0)


  console.log('OffOn', OffOn.address)
  console.log('OffOnDemo', OffOnDemo.address)

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
