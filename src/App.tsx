import { Address, BaseAddress } from '@emurgo/cardano-serialization-lib-asmjs';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { WalletInfo, WALLET_IDS } from './wallets/base';
import { enable, getAvailableWallets, getBalance, getChangeAddress, getNetwork, getRewardAddresses, getUnusedAddresses, getUsedAddresses } from './walletsGateway';
var md5 = require('md5');

let Buffer = require('buffer/').Buffer

function WalletCard(props: { wallet: WalletInfo, handleClick: Function }) {
  return (
        <div className="p-8 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex h-full flex-col ">
          <button className='flex flex-col' onClick={() => props.handleClick(props.wallet.id)}>
            <div className="flex">
                <img src={props.wallet.icon} alt='wallet-logo' width={28} height={28}/>
                <span className='text-gray-400 ml-2 text-sm grow'>{`id: ${props.wallet.id}`}</span>
            </div>
            <h1 className="text-white font-bold line-clamp-1 mb-2 mt-4">{`Name: ${props.wallet.name}`}</h1>
            <div className="flex mt-auto">
                <p className="flex-1 text-gray-300 text-sm">{`api version: ${props.wallet.apiVersion}`}</p>
            </div>
            </button>
        </div>
  );
}

function App() {
  const [wallets, setWallets] = useState([] as WalletInfo[]);
  const [enabledWallet, setEnabledWallet] = useState<WalletInfo>();
  const [balance, setBalance] = useState<string>();
  const [network, setNetwork] = useState<string>();
  const [address, setAddress] = useState<Address>();
  const [addresses, setAddresses] = useState([] as Address[]);
  const [error, setError] = useState();

  useEffect(() => {
    setWallets(getAvailableWallets());
  },[]);

  const connectWallet = useCallback( async (walletId: WALLET_IDS) => {
    try {
      // clears the error state
      setError(undefined);

      // Enables the wallet
      setEnabledWallet(await enable(walletId));

      // Gets the enabled wallet balance
      setBalance(await getBalance());

      // Gets the enabled wallet network
      setNetwork(await getNetwork());

      setAddresses(await getUsedAddresses());
      setAddress(await getChangeAddress());

    }catch(error: any) {
      setError(error.message || 'unknown errorr');
    }
  }, []);

  const getMoodleLink = async function (addr:any) {

    const raw = await getChangeAddress();
    console.log(Buffer.from(raw, "hex"))
    const changeAddress = Address.from_bytes(Buffer.from(raw, "hex")).to_bech32()
    console.log(changeAddress)

    var accaddr = md5(changeAddress)
    console.log(accaddr);

    // var MOODLEURL = 'http://localhost/moodle-teresa/' // Set the url of Moodle
    // var MOODLEAPITOKEN = 'c7c6036ca496b737e24d964bcef82b0c' // Set the token from Moodle    

    var MOODLEURL = 'http://54.216.2.101/' // Set the url of Moodle
    var MOODLEAPITOKEN = '37099649631154fa7c026f722b43190b' // Set the token from Moodle
    
    var url = MOODLEURL + '/webservice/rest/server.php?wstoken=' + MOODLEAPITOKEN + '&wsfunction=auth_userkey_request_login_url&moodlewsrestformat=json';

    const postdata = new FormData();
    postdata.append('user[firstname]', "anonymous");
    postdata.append('user[lastname]', accaddr.toLowerCase());
    postdata.append('user[email]', (accaddr+"@pocre.io").toLowerCase());
    postdata.append('user[username]', accaddr.toLowerCase());
    postdata.append('user[idnumber]', accaddr.toLowerCase());

    fetch(url, {
      method: 'POST',
      body: postdata
    })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      if(data['errorcode'])
        alert(data['message'])
      else {
        alert(data['loginurl'])
      }
    });
  };

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-auto">
        <div className="container max-w-6xl p-16  h-full w-full">
            <header className="mb-3 py-6 w-full flex flex-col justify-between">
                <div className='flex'>
                    <img src="/logo.svg" className="mr-4 h-6" alt="TxPipe Logo" />
                    <h2 className="text-m text-gray-400 font-normal">Starter Kit provided by TxPipe</h2>
                </div>
                
                <h3 className="text-3xl text-gray-200 font-extrabold mt-4">Wallet Connector</h3>
                <div className="mt-8 rounded-lg border border-blue-500 bg-blue-600 bg-opacity-10 p-4 text-white mb-4">
                    <h1 className="font-bold">Connect to a Wallet</h1>
                    <h3 className="text-sm text-blue-500 mt-2">Select which wallet to connect and perform basic interactions.</h3>
                </div>
            </header>

            {/* Available wallets */}
            {wallets.length ? <>
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                { wallets.map((wallet: WalletInfo) => <WalletCard key={wallet.id} wallet={wallet} handleClick={connectWallet}/>)}
              </div>
            </> : <h3 className="text-3xl text-gray-200 font-extrabold mt-4">No Wallets were found</h3>}

            {/* Connected Wallet information */}
            <div className='mt-8'>
              { enabledWallet ? 
              <>
                <h3 className="text-l text-white font-extrabold mt-4">{`Connected to ${enabledWallet.name}`}</h3>
                <h3 className="text-sm text-gray-200 mt-4">{balance ? `Wallet Balance: ${balance}` : null}</h3>
                <h3 className="text-sm text-gray-200 mt-2">{network ? `Connected to: ${network}` : null}</h3>
                  
                { address ?
                <><button className="mt-8 rounded-lg border border-blue-500 bg-blue-600 bg-opacity-10 p-4 text-white mb-4" onClick={()=>{getMoodleLink(address)}}>Get Moodle Login</button></> : <></>
                }
              </> : 
              <><h3 className="text-l text-gray-400 font-extrabold mt-4">No wallet is enabled. Select a Wallet to enabled it</h3></>}

            </div>
            
            {/* Displays any error message */}
            { error? <>
              <div className="mt-4 rounded-lg border border-red-500 bg-red-600 bg-opacity-10 p-4 text-white">
                  <h1 className="font-bold">Error</h1>
                  <h3 className="text-sm text-red-500 mt-2">{`There was an error connecting to the selected wallet: ${error}`}</h3>
            </div></> : null }
            
        </div>
    </div>
  );  
}

export default App;
