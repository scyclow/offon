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


describe('OffOn', () => {
  it('should work', async () => {

    const signers = await ethers.getSigners()
    const artist = signers[0]
    const owner = signers[1]
    const notOwner = signers[2]


    const OffOnFactory = await ethers.getContractFactory('OffOn', artist)
    const OffOn = await OffOnFactory.deploy()
    await OffOn.deployed()

    await OffOn.connect(artist)[safeTransferFrom](artist.address, owner.address, 0)

    await OffOn.connect(owner).turnOn()
    await expectRevert(
      OffOn.connect(owner).turnOn(),
      'Cannot turn on if not off'
    )
    expect(await OffOn.connect(owner).isOn()).to.equal(true)

    await OffOn.connect(owner).turnOff()
    await expectRevert(
      OffOn.connect(owner).turnOff(),
      'Cannot turn off if not on'
    )
    expect(await OffOn.connect(owner).isOn()).to.equal(false)


    await expectRevert(
      OffOn.connect(notOwner).turnOn(),
      'Only token owner can turn off or on'
    )
  })
})
