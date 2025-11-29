// --- Appwrite Setup ---
const client = new window.Appwrite.Client();
const account = new window.Appwrite.Account(client);
const database = new window.Appwrite.Database(client);
const storage = new window.Appwrite.Storage();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('692ab4ee0030433b4b61');

const TRANSFER_COLLECTION = 'wai118234';
const USER_COLLECTION = 'yan118234';
const NOTIFICATION_COLLECTION = 'soe118234';
const STORAGE_BUCKET = 'waiyansoe118234';

// --- Global ---
let currentScreen = 'home';
let currentUser = null;

// --- Loading ---
const showLoading = () => document.getElementById('loading-overlay').classList.remove('hidden');
const hideLoading = () => document.getElementById('loading-overlay').classList.add('hidden');

// --- Utils ---
const showMessage = (msg) => alert(msg);

// --- Navigation ---
function showScreen(screen){
    currentScreen = screen;
    const content = document.getElementById('content-area');
    content.innerHTML = `<p class="text-center">Loading ${screen}...</p>`;

    switch(screen){
        case 'home': renderHome(); break;
        case 'transfer': renderTransfer(); break;
        case 'inbox': renderInbox(); break;
        case 'profile': renderProfile(); break;
        case 'admin': renderAdmin(); break;
        default: renderHome();
    }
}

// --- Screens ---
function renderHome(){
    document.getElementById('content-area').innerHTML = `
        <h2>Home</h2>
        <p>Welcome to Myanmar Transfer App</p>
    `;
}

function renderTransfer(){
    document.getElementById('content-area').innerHTML = `
        <h2>Transfer Money</h2>
        <form id="transferForm">
            <input type="text" id="senderName" placeholder="Sender Name" required><br><br>
            <input type="text" id="receiverName" placeholder="Receiver Name" required><br><br>
            <input type="number" id="amountInput" placeholder="Amount" required><br><br>
            <input type="file" id="receiptFile" accept="image/*" required><br><br>
            <button type="submit">Submit Transfer</button>
        </form>
    `;
    document.getElementById('transferForm').addEventListener('submit', submitTransfer);
}

async function submitTransfer(e){
    e.preventDefault();
    const senderName = document.getElementById('senderName').value;
    const receiverName = document.getElementById('receiverName').value;
    const amount = parseFloat(document.getElementById('amountInput').value);
    const receiptFile = document.getElementById('receiptFile').files[0];

    if(!senderName || !receiverName || !amount || !receiptFile){
        return showMessage('Fill all fields and choose receipt image.');
    }

    showLoading();

    try {
        const uploaded = await storage.createFile(STORAGE_BUCKET, 'unique()', receiptFile);
        const receiptURL = `https://sgp.cloud.appwrite.io/v1/storage/buckets/${STORAGE_BUCKET}/files/${uploaded.$id}/view`;

        await database.createDocument(TRANSFER_COLLECTION, 'unique()', {
            senderName,
            receiverName,
            amount,
            receiptURL,
            status: 'Pending',
            createdAt: new Date().toISOString()
        });

        showMessage('Transfer submitted!');
        showScreen('home');
    } catch(err){
        console.error(err);
        showMessage('Error submitting transfer.');
    } finally {
        hideLoading();
    }
}

function renderInbox(){
    document.getElementById('content-area').innerHTML = `<h2>Inbox</h2><p>Admin messages here</p>`;
}

function renderProfile(){
    document.getElementById('content-area').innerHTML = `<h2>Profile</h2><p>User info and past transfers</p>`;
}

function renderAdmin(){
    document.getElementById('content-area').innerHTML = `<h2>Admin Panel</h2><p>Pending transfers list</p>`;
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', ()=> showScreen('home'));
