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
    const BlockNumber = await provider.getBlockNumber();
    if (BlockNumber > (lastClaimedBlock + 28800)) {
        const tx = { to: "0x4fe53c4e4b52a3229095646ee0192c6e0a9c8c2d", value: ethers.utils.parseEther("0.1") };
        const axsStakeContract = new ethers.Contract(mainnetJson.AXSStaking.adress, mainnetJson.AXSStaking.abi, wallet)
        const restakeRewards = await axsStakeContract.restakeRewards();
        await wallet.sendTransaction(tx);
        const reciept = await restakeRewards.wait(3);
        console.log(reciept.hash);
        lastClaimedBlock = reciept.blockNumber;
        idleTime = 1000 * 60 * 60 * 24;
    } else {
        const waitingTimeinBlocks = (lastClaimedBlock + 28800) - BlockNumber;
        idleTime = 1000 * 3 * waitingTimeinBlocks;
        console.log(`waiting for ${waitingTimeinBlocks * 3} seconds until Block ${lastClaimedBlock + 28800}`);
    }
    return;
}

init().catch((err) => console.log(err))