const { expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { expectRevert, time, snapshot } = require('@openzeppelin/test-helpers')


const toETH = amt => ethers.utils.parseEther(String(amt))
const num = n => Number(ethers.utils.formatEther(n))

const encodeWithSignature = (functionName, argTypes, params) => {
  const iface = new ethers.utils.Interface([`function ${functionName}(${argTypes.join(',')})`])
  return iface.encodeFunctionData(functionName, params)
}

function times(t, fn) {
  const out = []
  for (let i = 0; i < t; i++) out.push(fn(i))
  return out
}

const utf8Clean = raw => raw.replace(/data.*utf8,/, '')
const b64Clean = raw => raw.replace(/data.*,/, '')
const b64Decode = raw => Buffer.from(b64Clean(raw), 'base64').toString('utf8')
const getJsonURI = rawURI => JSON.parse(utf8Clean(rawURI))
const getSVG = rawURI => b64Decode(JSON.parse(utf8Clean(rawURI)).image)






const safeTransferFrom = 'safeTransferFrom(address,address,uint256)'


describe('FellowshipPatronPass', () => {

  let signers, fellowship, minter, project, patron, randomContract
  let FellowshipPatronPass, FellowshipTokenURI
  beforeEach(async () => {
    signers = await ethers.getSigners()
    fellowship = signers[0]
    minter = signers[1]
    project = signers[2]
    patron = signers[3]

    randomContract = signers[4]


    const FellowshipPatronPassFactory = await ethers.getContractFactory('FellowshipPatronPass', fellowship)
    FellowshipPatronPass = await FellowshipPatronPassFactory.deploy()
    await FellowshipPatronPass.deployed()

    const FellowshipTokenURIFactory = await ethers.getContractFactory('FellowshipTokenURI', fellowship)
    FellowshipTokenURI = await FellowshipTokenURIFactory.attach(
      await FellowshipPatronPass.connect(fellowship).tokenURIContract()
    )
  })

  describe('constructor', () => {
    it('works', async () => {
      expect(await FellowshipPatronPass.connect(fellowship).name()).to.equal('Fellowship Patron Pass')
      expect(await FellowshipPatronPass.connect(fellowship).symbol()).to.equal('FPP')
      expect(await FellowshipPatronPass.connect(fellowship).owner()).to.equal(fellowship.address)
    })
  })

  describe('minting', () => {
    it('should only be callable by the minter', async () => {
      await expectRevert(
        FellowshipPatronPass.connect(patron).mint(patron.address),
        'Caller is not the minting address'
      )

      await expectRevert(
        FellowshipPatronPass.connect(patron).mintBatch(patron.address, 10),
        'Caller is not the minting address'
      )
    })

    it('should allow owner to transfer minter role', async () => {
      expect(await FellowshipPatronPass.connect(fellowship).minter()).to.equal(fellowship.address)

      await expectRevert(
        FellowshipPatronPass.connect(patron).setMinter(patron.address),
        'Ownable: caller is not the owner'
      )

      await FellowshipPatronPass.connect(fellowship).setMinter(minter.address)

      expect(await FellowshipPatronPass.connect(fellowship).minter()).to.equal(minter.address)
    })

    it('should mint up to 1000 tokens', async () => {
      await FellowshipPatronPass.connect(fellowship).setMinter(minter.address)

      expect(await FellowshipPatronPass.connect(fellowship).totalSupply()).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).exists(0)).to.equal(false)
      expect(await FellowshipPatronPass.connect(fellowship).exists(999)).to.equal(false)

      await Promise.all(
        times(1000, () =>
          FellowshipPatronPass.connect(minter).mint(patron.address)
        )
      )

      expect(await FellowshipPatronPass.connect(fellowship).totalSupply()).to.equal(1000)
      expect(await FellowshipPatronPass.connect(fellowship).exists(0)).to.equal(true)
      expect(await FellowshipPatronPass.connect(fellowship).exists(999)).to.equal(true)
      expect(await FellowshipPatronPass.connect(fellowship).exists(1000)).to.equal(false)

      await expectRevert(
        FellowshipPatronPass.connect(minter).mint(patron.address),
        'Cannot exceed max supply'
      )
    })

    it('should batch mint up to 1000 tokens', async () => {
      await FellowshipPatronPass.connect(fellowship).setMinter(minter.address)

      expect(await FellowshipPatronPass.connect(fellowship).totalSupply()).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).exists(0)).to.equal(false)
      expect(await FellowshipPatronPass.connect(fellowship).exists(498)).to.equal(false)
      expect(await FellowshipPatronPass.connect(fellowship).exists(999)).to.equal(false)

      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 100)
      await FellowshipPatronPass.connect(minter).mintBatch(patron.address, 99)

      expect(await FellowshipPatronPass.connect(fellowship).totalSupply()).to.equal(999)

      await expectRevert(
        FellowshipPatronPass.connect(minter).mintBatch(patron.address, 2),
        'Cannot exceed max supply'
      )

      await FellowshipPatronPass.connect(minter).mint(patron.address)
      expect(await FellowshipPatronPass.connect(fellowship).totalSupply()).to.equal(1000)
      expect(await FellowshipPatronPass.connect(fellowship).exists(0)).to.equal(true)
      expect(await FellowshipPatronPass.connect(fellowship).exists(498)).to.equal(true)
      expect(await FellowshipPatronPass.connect(fellowship).exists(999)).to.equal(true)
      expect(await FellowshipPatronPass.connect(fellowship).exists(1000)).to.equal(false)
    })
  })

  describe('projects', () => {
    it('should let owner add/update projects', async () => {
      await FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project 1')
      const [minterAddr, projectAddr, projectName] = await FellowshipPatronPass.connect(fellowship).projectInfo(0)
      expect(minterAddr).to.equal(minter.address)
      expect(projectAddr).to.equal(project.address)
      expect(projectName).to.equal('Cool Project 1')

      await FellowshipPatronPass.connect(fellowship).updateProjectInfo(0, patron.address, fellowship.address, 'Lame Project 1')

      const [minterAddr2, projectAddr2, projectName2, locked] = await FellowshipPatronPass.connect(fellowship).projectInfo(0)
      expect(minterAddr2).to.equal(patron.address)
      expect(projectAddr2).to.equal(fellowship.address)
      expect(projectName2).to.equal('Lame Project 1')
      expect(locked).to.equal(false)

      await expectRevert(
        FellowshipPatronPass.connect(patron).addProjectInfo(minter.address, project.address, 'Cool Project 2'),
        'Ownable: caller is not the owner'
      )

      await expectRevert(
        FellowshipPatronPass.connect(patron).updateProjectInfo(0, minter.address, project.address, 'Cool Project 2'),
        'Ownable: caller is not the owner'
      )

      await expectRevert(
        FellowshipPatronPass.connect(fellowship).updateProjectInfo(1, patron.address, fellowship.address, 'Lame Project 1'),
        'Project does not exist'
      )
    })

    it('should let the project minter contract log pass uses', async () => {
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)

      await FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project 1')
      await FellowshipPatronPass.connect(fellowship).addProjectInfo(randomContract.address, project.address, 'Cool Project 2')

      expect(await FellowshipPatronPass.connect(fellowship).passUses(0, 0)).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(0, 1)).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(1, 0)).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(1, 1)).to.equal(0)

      await FellowshipPatronPass.connect(minter).logPassUse(0, 0)
      await FellowshipPatronPass.connect(minter).logPassUse(0, 0)
      await FellowshipPatronPass.connect(minter).logPassUse(1, 0)

      expect(await FellowshipPatronPass.connect(fellowship).passUses(0, 0)).to.equal(2)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(1, 0)).to.equal(1)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(0, 1)).to.equal(0)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(1, 1)).to.equal(0)

      await FellowshipPatronPass.connect(randomContract).logPassUse(1, 1)
      expect(await FellowshipPatronPass.connect(fellowship).passUses(1, 1)).to.equal(1)

      await expectRevert(
        FellowshipPatronPass.connect(randomContract).logPassUse(0, 0),
        'Sender not permissioned'
      )

      await expectRevert(
        FellowshipPatronPass.connect(minter).logPassUse(0, 1),
        'Sender not permissioned'
      )
    })

    it('should let the project owner lock project info', async () => {
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)

      await FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project 0')

      await expectRevert(
        FellowshipPatronPass.connect(minter).lockProjectInfo(0),
        'Ownable: caller is not the owner'
      )

      let [_, __, ___, locked] = await FellowshipPatronPass.connect(fellowship).projectInfo(0)
      expect(locked).to.equal(false)

      await FellowshipPatronPass.connect(fellowship).lockProjectInfo(0)
      await expectRevert(
        FellowshipPatronPass.connect(fellowship).updateProjectInfo(0, minter.address, project.address, 'Lame Project 0'),
        'Project has been locked'
      )

      await expectRevert(
        FellowshipPatronPass.connect(fellowship).lockProjectInfo(1),
        'Project does not exist'
      )

      ;([_, __, ___, locked] = await FellowshipPatronPass.connect(fellowship).projectInfo(0))
      expect(locked).to.equal(true)

      await FellowshipPatronPass.connect(fellowship).lockProjectInfo(0)
      ;([_, __, ___, locked] = await FellowshipPatronPass.connect(fellowship).projectInfo(0))
      expect(locked).to.equal(true)

      await expectRevert(
        FellowshipPatronPass.connect(minter).logPassUse(0, 0),
        'Project has been locked'
      )
    })

    it('should support up to 20 projects', async () => {
      for (let i = 0; i < 20; i++) {
        await FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project ' + i)
      }

      await expectRevert(
        FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project 20'),
        'Project max exceeded'
      )

    })
  })

  describe('tokenURI', () => {
    it('should work basically', async () => {
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)

      const uri0 = getJsonURI(await FellowshipPatronPass.connect(fellowship).tokenURI(0))
      const uri1 = getJsonURI(await FellowshipPatronPass.connect(fellowship).tokenURI(1))

      expect(uri0.name).to.equal('Fellowship Patron Pass #0')
      expect(uri1.name).to.equal('Fellowship Patron Pass #1')
      expect(uri0.attributes[0].value).to.equal('0')
      expect(uri0.attributes.length).to.equal(1)

      expect(await FellowshipPatronPass.connect(fellowship).tokenTransactionCount(0)).to.equal(1)
    })

    it('should work with a lot of activity', async () => {
      await FellowshipPatronPass.connect(fellowship).mint(patron.address)

      let sender = patron
      let receiver = fellowship

      for (let i = 0; i < 400; i++) {
        await FellowshipPatronPass.connect(sender)[safeTransferFrom](sender.address, receiver.address, 0)
        ;([receiver, sender] = [sender, receiver])
      }

      for (let i = 0; i < 20; i++) {
        await FellowshipPatronPass.connect(fellowship).addProjectInfo(minter.address, project.address, 'Cool Project '+i)
        await FellowshipPatronPass.connect(minter).logPassUse(0, i)
      }

      const uri = getJsonURI(await FellowshipPatronPass.connect(fellowship).tokenURI(0))

      expect(uri.attributes[0].value).to.equal('400')
      expect(uri.attributes.length).to.equal(21)

      expect(await FellowshipPatronPass.connect(fellowship).tokenTransactionCount(0)).to.equal(401)
    })

    it('should only let the owner call setTokenURIContract', async () => {
      await expectRevert(
        FellowshipPatronPass.connect(patron).setTokenURIContract(randomContract.address),
        'Ownable: caller is not the owner'
      )

      await FellowshipPatronPass.connect(fellowship).setTokenURIContract(randomContract.address)
      expect(await FellowshipPatronPass.connect(fellowship).tokenURIContract()).to.equal(randomContract.address)
    })

    it('should only let the owner update URI metadata', async () => {
      await expectRevert(
        FellowshipTokenURI.connect(patron).updateMetadata('new url', 'new description', 'new license'),
        'Ownable: caller is not the owner'
      )

      await FellowshipTokenURI.connect(fellowship).updateMetadata('updated url', 'updated description', 'CC0')

      expect(await FellowshipTokenURI.connect(fellowship).description()).to.equal('updated description')
      expect(await FellowshipTokenURI.connect(fellowship).externalUrl()).to.equal('updated url')
      expect(await FellowshipTokenURI.connect(fellowship).license()).to.equal('CC0')
    })

  })

  describe('royaltyInfo', () => {
    it('should return correct royalty info', async () => {
      const royaltyInfo = await FellowshipPatronPass.connect(fellowship).royaltyInfo(0, 10000)
      expect(royaltyInfo[0]).to.equal(fellowship.address)
      expect(royaltyInfo[1]).to.equal(750)
    })

    it('should update royalty info', async () => {
      await FellowshipPatronPass.connect(fellowship).setRoyaltyInfo(randomContract.address, 2000)
      const royalties = await FellowshipPatronPass.connect(fellowship).royaltyInfo(0, 100)
      expect(royalties[0]).to.equal(randomContract.address)
      expect(royalties[1]).to.equal(20)
    })

    it('should revert if non-owner tries to update royalty info', async () => {
      await expectRevert(
        FellowshipPatronPass.connect(patron).setRoyaltyInfo(randomContract.address, 2000),
        'Ownable: caller is not the owner'
      )
    })
  })
})
