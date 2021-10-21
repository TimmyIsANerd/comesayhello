import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
	// Store User's Public wallet
	const [currentAccount, setCurrentAccount] = useState("");
	const [txnCount, setTxnCount] = useState();
	const [waveMessage, setWaveMessage] = useState("");

	// Variable that holds Contract Address
	const [allWaves, setAllWaves] = useState([]);
	const contractAddress = "0x6e7524a02923209A743E04a036CAe435e634F6c6";
	const contractABI = abi.abi;

		

	// Method that collects all waves from contract
	const getAllWaves = async () =>{
		try{
			const { ethereum } = window;
			if(ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);


				// Call getAllWaves from smart contract
				const waves = await wavePortalContract.getAllWaves();

				// We only need address, timestamp and message in our UI
				let wavesCleaned = [];
				waves.forEach(wave =>{
					wavesCleaned.push({
						address:wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message
					});
				});
				// Store Data in State
				setAllWaves(wavesCleaned);

				// Listen for Smart Contract Event Emitters
				wavePortalContract.on('NewWave', (from, timestamp, message)=>{
					console.log('NewWave', from, timestamp, message);

					setAllWaves(prevState => [...prevState,{
						address: from,
						timestamp: new Date(timestamp * 1000),
						message:message
					}]);
				});
			} else {
				console.log("Ethereum object doesn't exist")
			}
		} catch (error){
			console.log(error);
		}
	}
	

	// Checking that we have access to window.Ethereum
	const checkIfWalletIsConnected = async () =>{
		try{
			const { ethereum } = window;
			if(!ethereum){
				console.log('Make sure you have MetaMask installed!');
				return;
			} else {
				console.log('We have the ethereum object', ethereum);

				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				let count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved total wave count...", count.toNumber());
				setTxnCount(count.toNumber());
				getAllWaves();			
			}

			// Check if we are authorized to access the user's wallet

			const accounts = await ethereum.request(
				{
					method:'eth_accounts'
				}
			);
			if(accounts.length !== 0){
				const account = accounts[0];
				console.log("Found an authorized account");
				setCurrentAccount(account);
			} else {
				console.log('No authorized account found');
			}
		} catch(error){
			console.log(error);
		}
	}


	// ConnectWallet
	const connectWallet = async () =>{
		try{
			const { ethereum } = window;
			if(!ethereum){
				alert('Install MetaMask!');
				return;
			}
			const accounts = await ethereum.request({method:"eth_requestAccounts"});
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}


	const wave = async (message) => {
		try {
			const { ethereum } = window;
			if(ethereum) {
				// Ethers library lets Front End talk to our Smart Contract
				// Providers are used to talk to Ethereum Nodes
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				let count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved Total Wave Count...", count.toNumber());

				// Execute the actual wave from smart contract
				const waveTxn = await wavePortalContract.wave(message,{gasLimit:300000});
				console.log("Mining...", waveTxn.hash);
				
				await waveTxn.wait();
				console.log("Mined --", waveTxn.hash);

				count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved Total Wave Count...", count.toNumber());

				return count;
			} else {
				console.log("Ethereum Object Doesn't Exist");
			}
		} catch(error) {
			console.log(error)
		}
	}
	// Run function when page loads
	useEffect(() =>{
		checkIfWalletIsConnected();
	}, [])
	
	return (
		<div className="mainContainer">

		<div className="dataContainer">
			<div className="header">
				<span aria-label="emoji" role="img">👋</span> Hello! I'm Timmy!
				</div>

				<div className="bio">
					MERN Stack Developer getting feet wet with Web 3.0,
					Come say Hi! Connect your Ethereum wallet and wave at me!
				</div>

				{currentAccount && (
						<div>
							<form className="form" onSubmit={(e)=> e.preventDefault() } >
								<input 
								type="text" 
								className="form-control" 
								name="message"
								placeholder="Leave a Message"
								onChange={(e)=> setWaveMessage(e.target.value)}
								value={waveMessage}
								/>
								
								<button className="waveButton" type="submit" onClick={()=> wave(waveMessage)} >
								Wave
								</button>
							</form>
						</div>
					)}

				{/* If there is no current account render Connect Wallet Button*/}
				<div className="button_container">
					{!currentAccount && (
						<button className="waveButton" onClick={connectWallet}>
								Connect MetaMask
						</button>
					)}
				</div>
				{allWaves.map((wave,index)=>{
					return(
						<div key={index} style={{ marginTop:"16px", padding:"8px"}}>
							<div><span>Address</span> : {wave.address}</div>
							<div><span>Time:</span> {wave.timestamp.toString()}</div>
							<div><span>Message:</span> {wave.message}</div>
						</div>
					)
				})}

				{currentAccount &&(
					<div>
						<p>Total Wave : {txnCount}</p>
					</div>
				)}
				
			
			</div>
		</div>
	);
}
