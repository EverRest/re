const {expect} = require('chai');
const {ethers} = require('hardhat');

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow
    beforeEach(async () => {
        // Set accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();
        // Deploy
        let RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()
        // Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png")
        await transaction.wait()
        const Escrow = await ethers.getContractFactory("Escrow")
        escrow = await Escrow.deploy(
            realEstate.target,
            seller.address,
            inspector.address,
            lender.address
        )
        // Approve Property
        transaction = await realEstate.connect(seller).approve(escrow.target, 1)
        await transaction.wait()

        // Verify the owner of token ID 1
        const ownerOfToken1 = await realEstate.ownerOf(1);
        console.log("Owner of token ID 1:", ownerOfToken1);

        // List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })
    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const resultNftAddress = await escrow.nftAddress();
            expect(resultNftAddress).to.be.equal(realEstate.target)
        })
        it('Returns seller', async () => {
            const resultSellerAddress = await escrow.seller();
            expect(resultSellerAddress).to.be.equal(seller.address)
        })
        it('Returns inspector', async () => {
            const resultInspectorAddress = await escrow.inspector();
            expect(resultInspectorAddress).to.be.equal(inspector.address)
        })
        it('Returns lender', async () => {
            const resultLenderAddress = await escrow.lender();
            expect(resultLenderAddress).to.be.equal(lender.address)
        })
    })
    describe('Listing', () => {
        it('Updates as listed', async () => {
            const resultIsListed = await escrow.isListed(1);
            expect(resultIsListed).to.be.equal(true)
        })
        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
        it('Returns buyer', async () => {
            const resultBuyerAddress = await escrow.buyer(1);
            expect(resultBuyerAddress).to.be.equal(buyer.address)
        })
        it('Returns purchase price', async () => {
            const resultPurchasePrice = await escrow.purchasePrice(1);
            expect(resultPurchasePrice).to.be.equal(tokens(10))
        })
        it('Returns escrow amount', async () => {
            const resultEscrowAmount = await escrow.escrowAmount(1);
            expect(resultEscrowAmount).to.be.equal(5)
        })
    })

    describe('Deposits', () => {
        it('Updates contract balance', async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait();
            const result = await escrow.connect(inspector).updateInspectionStatus(1, true)
        })
    })

    describe('Inspection', () => {
        it('Updates inspection status', async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Sale', async () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).buyerEarnest(1, {value: tokens(5)})
            await transaction.wait();

            transaction  = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            await lender.sendTransaction({to: escrow.address, value: tokens(5)})

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates ownership', async() => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('Updates balance', async () => {
            expect(await escrow.getBalance()).to.be.equal(0)
        })
    })
})