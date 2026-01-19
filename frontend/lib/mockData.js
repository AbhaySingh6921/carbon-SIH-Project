// lib/mockData.js

export const users = [
  {
    id: 1,
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // NGO address
    role: 'NGO',
    name: 'Green World Foundation', // Updated name to match your design
    email: 'contact@greenworld.org', // New field
    status: 'Active', 
    reputation: 98,
    credits: 4500,
    staked: 250
  },
  {
    id: 2,
    address: '0xcB73602bC16b4c3C40455957CB15bF7897F91bb2', // ADMIN address
    role: 'ADMIN',
    name: 'Admin Verifier'
  },
  // --- NEW NGO ---
  {
    id: 3,
    address: '0xf746B55d6c9B17A32F213ef346959249d68F2b67', 
    role: 'NGO',
    name: 'Coastal Restoration Initiative',
     email: 'coastal@ocean.org', // New field
    status: 'Active',               // New field
    reputation: 85,
    credits: 1200,
    staked: 150
  }
];

export const plantations = [
    { id: 101, name: 'Coastal Shield Mangroves', uploaderId: 1, status: 'Verified', treeCount: 5000, location: 'Sundarbans, India', dateSubmitted: '2025-01-15',verificationDate: '2025-02-20'  },
    { id: 102, name: 'Seagrass Restoration Project', uploaderId: 3, status: 'Verified', treeCount: 2200, location: 'Florida Keys, USA', dateSubmitted: '2025-02-10', verificationDate: '2025-03-15' },
    { id: 103, name: 'Coral Reef Restoration', uploaderId: 1, status: 'Verified', treeCount: 800, location: 'Great Barrier Reef', dateSubmitted: '2025-03-05',verificationDate: '2025-04-10' },
    // --- NEW PENDING PROJECTS ---
    { id: 104, name: 'Blue Carbon Wetlands', uploaderId: 1, status: 'Pending', treeCount: 2800, location: 'Chesapeake Bay, USA', dateSubmitted: '2025-09-01' },
    { id: 105, name: 'Kelp Forest Revival', uploaderId: 3, status: 'Pending', treeCount: 3500, location: 'Monterey Bay, USA', dateSubmitted: '2025-08-20' }
];