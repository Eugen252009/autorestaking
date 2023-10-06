const ethers = require('ethers');
const fs = require('fs-extra')
require('dotenv').config();



async function encrypt() {

    // Choose one of the 2 Methods to paste your Key or create a new one
    const wallet =  ethers.Wallet.createRandom(); 
    // var wallet = new ethers.Wallet("PRIVATE_KEY");
    // var wallet = ethers.Wallet.fromMnemonic("Mnemonic_Phrase");

    const encryptedJsonKey = await wallet.encrypt(process.env.PASSWORD);
    console.log(encryptedJsonKey);
    fs.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
}




async function decrypt(password) {
    const encrypted = fs.readFileSync('./.encryptedKey.json', 'utf8');
    let wallet = ethers.Wallet.fromEncryptedJsonSync(encrypted, password);
    console.log(wallet._mnemonic().phrase);
}
encrypt();
// decrypt(process.env.PASSWORD);