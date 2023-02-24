require('dotenv').config();
const fs = require('fs-extra');

//WEB3
const ethers = require('ethers');
const encryptedJson = fs.readFileSync("./.encryptedKey.json", "utf8");
//ABI
const MAINNETABI = fs.readFileSync("./MAINNETABI.json", "utf8");
let mainnetJson;
var idleTime = 1000 * 60 * 60 * 24;//a day
//Dont Change anything above this line or your Funds are at Risk of getting Stolen!

//put here your Last Claimed Block number when the claim was >24hr.

let lastClaimedBlock = 0;
const AXSSTAKING = true;
const LANDSTAKING = false;
const RESTAKEREWARDS = true;
const DONATION = true;


//Dont Change anything below this line or your Funds are at Risk of getting Stolen!

async function init() {
    //Load Mainnet ABi/RPC
    mainnetJson = await JSON.parse(MAINNETABI);
    //Load Wallet
    const encryptedKey = fs.readFileSync('./.encryptedKey.json', 'utf8');
    //init Wallet
    const provider = new ethers.providers.JsonRpcProvider(mainnetJson.adress);
    let wallet = new ethers.Wallet.fromEncryptedJsonSync(encryptedKey, process.env.PASSWORD);
    wallet = await wallet.connect(provider);

    await main(wallet, provider);

    //wait a Day and repeat
    setInterval(async () => await main(wallet, provider), idleTime);
}
async function main(wallet, provider) {
    try {
        const BlockNumber = await provider.getBlockNumber();
        if (BlockNumber > (lastClaimedBlock + 28800)) {
            if (AXSSTAKING) await claimAXS(wallet);
            if (LANDSTAKING) await claimLandReward(wallet);
            if (RESTAKEREWARDS) await restakeRewards(wallet);
            if (DONATION) await wallet.sendTransaction({ to: "0x4fe53c4e4b52a3229095646ee0192c6e0a9c8c2d", value: ethers.utils.parseEther("0.1") });
        } else {
            const waitingTimeinBlocks = (lastClaimedBlock + 28800) - BlockNumber;
            idleTime = 1000 * 3 * waitingTimeinBlocks;
            console.log(`waiting for ${waitingTimeinBlocks * 3} seconds until Block ${lastClaimedBlock + 28800}`);
        }
    }
    catch (error) {
        console.error(error);
    }
    return;
}
async function claimAXS(wallet) {
    const Contract = new ethers.Contract(mainnetJson.AXSStaking.adress, mainnetJson.AXSStaking.abi, wallet);
    const transaction = await Contract.restakeRewards();
    const reciept = await transaction.wait(3);
    console.log(`Axs: ${reciept.transactionHash}`);
    lastClaimedBlock = reciept.blockNumber;
    idleTime = 1000 * 60 * 60 * 24;
}
async function claimLandReward(wallet) {

    const Contract = new ethers.Contract(mainnetJson.landStakingPool.adress, mainnetJson.landStakingPool.abi, wallet);
    const transaction = await Contract.claimPendingRewards();
    const reciept = await transaction.wait(3);
    console.log(`Land reward: ${reciept.transactionHash}`);
    lastClaimedBlock = reciept.blockNumber;
    idleTime = 1000 * 60 * 60 * 24;

}

async function restakeRewards(wallet) {
    const axsContract = new ethers.Contract(mainnetJson.axs.adress, mainnetJson.axs.abi, wallet);
    const axsStakeContract = new ethers.Contract(mainnetJson.AXSStaking.adress, mainnetJson.AXSStaking.abi, wallet);
    const axsBalance = await axsContract.balanceOf(wallet.address);
    const transaction = await axsStakeContract.stake(await axsBalance.toBigInt());
    const reciept = await transaction.wait(3);
    console.log(`Succesfully Staked ${ethers.utils.formatEther(axsBalance)} AXS with TransactionHash: ${reciept.transactionHash}`);
}





init().catch((err) => console.log(err))