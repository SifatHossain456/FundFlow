export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // replace after deploy

export const FUNDFLOW_ABI = [
  // createCampaign
  {
    "inputs": [
      {"name": "_title", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_imageUrl", "type": "string"},
      {"name": "_target", "type": "uint96"},
      {"name": "_deadline", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [{"name": "id", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // contribute
  {
    "inputs": [{"name": "_id", "type": "uint256"}],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // withdraw
  {
    "inputs": [{"name": "_id", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // refund
  {
    "inputs": [{"name": "_id", "type": "uint256"}],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getCampaign
  {
    "inputs": [{"name": "_id", "type": "uint256"}],
    "name": "getCampaign",
    "outputs": [{
      "components": [
        {"name": "owner", "type": "address"},
        {"name": "withdrawn", "type": "bool"},
        {"name": "target", "type": "uint96"},
        {"name": "deadline", "type": "uint256"},
        {"name": "amountRaised", "type": "uint256"},
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "imageUrl", "type": "string"}
      ],
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  // getCampaigns
  {
    "inputs": [
      {"name": "from", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getCampaigns",
    "outputs": [{
      "components": [
        {"name": "owner", "type": "address"},
        {"name": "withdrawn", "type": "bool"},
        {"name": "target", "type": "uint96"},
        {"name": "deadline", "type": "uint256"},
        {"name": "amountRaised", "type": "uint256"},
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "imageUrl", "type": "string"}
      ],
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  // campaignCount
  {
    "inputs": [],
    "name": "campaignCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // contributions
  {
    "inputs": [
      {"name": "", "type": "uint256"},
      {"name": "", "type": "address"}
    ],
    "name": "contributions",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": false, "name": "target", "type": "uint96"},
      {"indexed": false, "name": "deadline", "type": "uint256"},
      {"indexed": false, "name": "title", "type": "string"}
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "contributor", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "total", "type": "uint256"}
    ],
    "name": "Contributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "contributor", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Refunded",
    "type": "event"
  }
] as const;
