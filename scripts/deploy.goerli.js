async function main() {
  const signers = await ethers.getSigners()
  const artist = signers[0]


  const OffOnFactory = await ethers.getContractFactory('OffOn', artist)
  const OffOn = await OffOnFactory.deploy()
  await OffOn.deployed()

  console.log('OffOn', OffOn.address)

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
