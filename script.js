const contractAddress = 0x96D80158D3068E2DD45193e036E99D8d3176f95d;
const abi = [
  "event Buy(address indexed buyer, uint256 amount)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address) public view returns (uint256)"
];

let provider, contract, signer;

const tierThresholds = [0, 5, 10, 20, 50];
const tierLabels = ["None", "Tier 1", "Tier 2", "Tier 3", "Tier 4"];

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    document.getElementById("wallet-status").textContent = `Connected: ${userAddress}`;
    contract = new ethers.Contract(contractAddress, abi, provider);
    fetchProgress(userAddress);
    loadLeaderboard();
  } else {
    alert("Please install MetaMask.");
  }
}

async function fetchProgress(userAddress) {
  const filter = contract.filters.Buy(userAddress);
  const events = await contract.queryFilter(filter, -10000);
  const txCount = events.length;
  const tier = tierThresholds.filter(t => txCount >= t).length - 1;
  document.getElementById("tx-count").textContent = txCount;
  document.getElementById("tier-label").textContent = tierLabels[tier];
  document.getElementById("progress-fill").style.width = Math.min(txCount / 50, 1) * 100 + "%";
}

async function loadLeaderboard() {
  const filter = contract.filters.Buy();
  const events = await contract.queryFilter(filter, -10000);
  const counts = {};
  events.forEach(e => {
    const addr = e.args.buyer;
    counts[addr] = (counts[addr] || 0) + 1;
  });
  const leaderboard = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const ol = document.getElementById("leaderboard");
  ol.innerHTML = "";
  leaderboard.forEach(([addr, count]) => {
    const li = document.createElement("li");
    li.textContent = `${addr} — ${count} txs`;
    ol.appendChild(li);
  });
}