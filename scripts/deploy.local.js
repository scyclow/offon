async function main() {
  const signers = await ethers.getSigners()
  const fellowship = signers[0]

  const FellowshipPatronPassFactory = await ethers.getContractFactory('FellowshipPatronPass', fellowship)
  const FellowshipPatronPass = await FellowshipPatronPassFactory.deploy()
  await FellowshipPatronPass.deployed()


  await FellowshipPatronPass.connect(fellowship).mintBatch(fellowship.address, 20)
  await FellowshipPatronPass.connect(fellowship).addProjectInfo(fellowship.address, fellowship.address, "Test 01")
  await FellowshipPatronPass.connect(fellowship).logPassUse(0, 0)
  await FellowshipPatronPass.connect(fellowship).logPassUse(1, 0)
  await FellowshipPatronPass.connect(fellowship).logPassUse(2, 0)

  console.log('FellowshipPatronPass', FellowshipPatronPass.address)

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
