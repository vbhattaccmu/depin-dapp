// Smart Contract ABIs
export const BigWaterTokenABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]

export const BigWaterDeviceNFTABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  // Ownership controls used during deployment/hand-off
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
]

export const DeviceRegistryABI = [
  // Aligned to working deployment: owner, deviceId, tokenURI
  'function registerDevice(address owner, string deviceId, string tokenURI) returns (uint256)',
  'function batchRegisterDevices(address[] owners, string[] deviceIds, string[] tokenURIs)',
  'function getDevice(uint256 tokenId) view returns (address owner, string deviceId, string tokenURI, uint256 registeredAt)',
  'function getDeviceNFT(string deviceId) view returns (uint256)',
  'function getDevicesByOwner(address owner) view returns (string[])',
  'function getAllRegisteredOwners() view returns (address[])',
  'function isDeviceRegistered(string deviceId) view returns (bool)',
  'function updateDeviceMetadata(uint256 tokenId, string tokenURI)',
  // one-time handoff helper present in your script
  'function acceptNFTContractOwnership()',
  'event DeviceRegistered(uint256 indexed tokenId, address indexed owner, string deviceId)',
  'event DeviceMetadataUpdated(uint256 indexed tokenId, string tokenURI)',
]

export const RewardDistributionABI = [
  'function submitScore(address participant, uint256 score)',
  'function getScore(address participant) view returns (uint256)',
  'function distributeRewards(address[] memory participants, uint256[] memory amounts)',
  'function getTotalRewardsDistributed() view returns (uint256)',
  'function getUserRewards(address user) view returns (uint256)',
  'event ScoreSubmitted(address indexed participant, uint256 score)',
  'event RewardsDistributed(address indexed participant, uint256 amount)',
]

export const DePINStakingABI = [
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function getStakedBalance(address user) view returns (uint256)',
  'function getTotalStaked() view returns (uint256)',
  'function claimRewards()',
  'function getRewards(address user) view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
]

