async function main() {
  const signers = await ethers.getSigners()
  const fellowship = signers[0]

  console.log('deploying')
  const FellowshipPatronPassFactory = await ethers.getContractFactory('FellowshipPatronPass', fellowship)
  const FellowshipPatronPass = await FellowshipPatronPassFactory.deploy()
  await FellowshipPatronPass.deployed()

  console.log('minting')

  await FellowshipPatronPass.connect(fellowship).mintBatch('0xd7dD9612A21F7C249Fb7F33E9C2e9144345e162b', 20)

  console.log('adding project info')
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
