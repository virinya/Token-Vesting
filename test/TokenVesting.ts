import { JunJunToken, JunJunToken__factory, TokenVesting, TokenVesting__factory} from "../typechain";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenVesting", async function () {
    let tokenVesting: TokenVesting;
    let token: JunJunToken;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    const wei = ethers.BigNumber.from(10).pow(18)
    const initialSupply = ethers.BigNumber.from(100000000).mul(wei);
    const tokenAmount = ethers.BigNumber.from(10000).mul(wei);
    const firstClaim = ethers.BigNumber.from(50).mul(wei);
    const secondClaim = ethers.BigNumber.from(150).mul(wei);
    const distributionPercent = 1;
    const timeInterval = 2630000;
    
    beforeEach(async () => {
        // Create address
        [owner, addr1, addr2] = await ethers.getSigners();

        // Create Tokens
        const Token = (await ethers.getContractFactory("JunJunToken", owner)) as JunJunToken__factory;
        token = await Token.deploy(initialSupply);
        await token.deployed();

        // Create Token Vesting
        const TokenVesting = (await ethers.getContractFactory("TokenVesting")) as TokenVesting__factory;
        tokenVesting = await TokenVesting.deploy(
            token.address,
            distributionPercent,
            timeInterval
        );
        await tokenVesting.deployed();

        // Approve token
        await token.connect(owner).approve(tokenVesting.address, tokenAmount);
    })

    describe("Deployment", function () {
        it("Should set the right initial supply", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(await token.totalSupply()).to.equal(ownerBalance);
        });

        it("Should set the right token address", async function () {
            expect(await tokenVesting.junTokenAddress()).to.equal(token.address);
        });

        it("Should set the right distribution percent", async function () {
            expect(await tokenVesting.distributionPercent()).to.equal(1);
        });

        it("Should set the right time interval", async function () {
            expect(await tokenVesting.timeInterval()).to.equal(2630000);
        });

        describe("Owner record shareholder info", function () {
            it("Should set the right token amount", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                expect((await tokenVesting.shareholder(addr1.address)).tokenAmount).to.equal(tokenAmount);
            })

            it("Should set the right start date", async function () {
                let currentTime = ethers.BigNumber.from(await new Date().getTime()).div(1000);
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                // check if startt date for addr1 is correct by comparing to current day
                expect((await tokenVesting.shareholder(addr1.address)).startDate.div(3600)).to.equal(currentTime.div(3600))
            })
        })

        describe("ShareHolder claimToken", function () {
            it("Should transfer the right amount at the first pay round", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                await time.increase(timeInterval)
                await tokenVesting.connect(addr1).claimToken(firstClaim);

                expect((await tokenVesting.shareholder(addr1.address)).claimedAmount).to.equal(firstClaim);
            })

            it("Should transfer the right amount at the second pay round", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                await time.increase(timeInterval * 2)
                await tokenVesting.connect(addr1).claimToken(secondClaim);

                expect((await tokenVesting.shareholder(addr1.address)).claimedAmount).to.equal(secondClaim);
            })

            it("Should transfer the right amount at the last pay round", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                await time.increase(timeInterval * 100)
                await tokenVesting.connect(addr1).claimToken(tokenAmount);

                expect((await tokenVesting.shareholder(addr1.address)).claimedAmount).to.equal(tokenAmount);
            })

            it("Should not transfer token since all token has been claimed", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                await time.increase(timeInterval * 100)
                await tokenVesting.connect(addr1).claimToken(tokenAmount);
                await time.increase(timeInterval);
                
                await expect(tokenVesting.connect(addr1).claimToken(ethers.BigNumber.from(1).mul(wei))).to.be.rejectedWith("[TokenVesting.claimToken] all token claimed")
            })

            it("Should not transfer token more than claim limit", async function () {
                await tokenVesting.connect(owner).recordShareholderInfo(addr1.address, tokenAmount);
                await time.increase(timeInterval)

                await expect(tokenVesting.connect(addr1).claimToken(ethers.BigNumber.from(500).mul(wei))).to.be.rejectedWith("[TokenVesting.claimToken] claim amount exceed claim limit")
            })
        })
    })
})
