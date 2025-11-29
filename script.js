// --- Appwrite Setup ---
const client = new Appwrite.Client();
const database = new Appwrite.Databases(client);
const storage = new Appwrite.Storage();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('692ab4ee0030433b4b61');

const DATABASE_ID = '692abb320000cc971136';
const TRANSFER_COLLECTION = 'wai118234';
const NOTIFICATION_COLLECTION = 'soe118234';
const STORAGE_BUCKET = 'waiyansoe118234';

// --- Global State ---
let currentScreen = 'home';
let userTransfers = [];
let userNotifications = [];

// --- Utils ---
const showMessage = (msg,type='info')=>alert(msg);
const showScreen = (screen)=>{
    currentScreen=screen;
    if(screen==='home') renderHome();
    if(screen==='transfer') renderTransfer();
    if(screen==='inbox') renderInbox();
    if(screen==='profile') renderProfile();
    if(screen==='admin') renderAdminPanel();
};

// --- Home ---
const renderHome=()=>document.getElementById('content-area').innerHTML=`<h2>Home</h2><p>Welcome Guest</p>`;

// --- Transfer ---
const renderTransfer=()=>{
    document.getElementById('content-area').innerHTML=`
    <h2>Transfer</h2>
    <form id="transfer-form">
        <input type="text" id="senderName" placeholder="Sender Name" required>
        <input type="text" id="receiverName" placeholder="Receiver Name" required>
        <input type="number" id="amountInput" placeholder="Amount" required>
        <select id="amountDirection">
            <option value="THB_MMK">THB ➜ MMK</option>
            <option value="MMK_THB">MMK ➜ THB</option>
        </select>
        <select id="transferType">
            <option value="account">Account</option>
            <option value="home">Home Delivery</option>
        </select>
        <input type="text" id="deliveryAddress" placeholder="Delivery Address (if home)">
        <input type="file" id="receiptFile" required>
        <button type="button" onclick="submitTransfer()">Submit Transfer</button>
    </form>
    <h3>Your Transfer History</h3>
    <div id="transfer-history"></div>
    `;
    loadUserTransfers();
};

const submitTransfer=async()=>{
    const senderName=document.getElementById('senderName').value;
    const receiverName=document.getElementById('receiverName').value;
    const amount=parseFloat(document.getElementById('amountInput').value);
    const amountDirection=document.getElementById('amountDirection').value;
    const transferType=document.getElementById('transferType').value;
    const deliveryAddress=document.getElementById('deliveryAddress').value || 'N/A';
    const receiptFile=document.getElementById('receiptFile').files[0];

    if(!senderName||!receiverName||!amount||!receiptFile) return showMessage('All fields required','error');

    try{
        const fileID=`${Date.now()}_${receiptFile.name}`;
        const uploadedFile=await storage.createFile(STORAGE_BUCKET,fileID,receiptFile);

        const THB_TO_MMK=50; const MMK_TO_THB=1/50;
        let amountTHB, amountMMK;
        if(amountDirection==='THB_MMK'){ amountTHB=amount; amountMMK=amount*THB_TO_MMK; }
        else { amountMMK=amount; amountTHB=amount*MMK_TO_THB; }

        await database.createDocument(DATABASE_ID,TRANSFER_COLLECTION,'unique()',{
            senderId:'guest',
            senderName,
            receiverName,
            transferType,
            deliveryAddress,
            amountTHB,
            amountMMK,
            amountDirection,
            receiptFileId:uploadedFile.$id,
            status:'Pending',
            timestamp:new Date().toISOString()
        });

        showMessage('Transfer submitted successfully!');
        document.getElementById('transfer-form').reset();
        loadUserTransfers();
    }catch(err){ console.error(err); showMessage('Error submitting transfer','error'); }
};

// --- Transfer History (guest only shows all transfers) ---
const loadUserTransfers=async()=>{
    try{
        const response=await database.listDocuments(DATABASE_ID,TRANSFER_COLLECTION);
        userTransfers=response.documents||[];
        let html='';
        userTransfers.forEach(t=>{
            html+=`<div class="card">
            <strong>${t.senderName} ➜ ${t.receiverName}</strong>
            <p>${t.amountTHB} THB / ${t.amountMMK} MMK</p>
            <p>Status: ${t.status}</p>
            </div>`;
        });
        document.getElementById('transfer-history').innerHTML=html;
    }catch(err){ console.error(err); }
};

// --- Inbox (guest: shows all notifications) ---
const renderInbox=async()=>{
    try{
        const response=await database.listDocuments(DATABASE_ID,NOTIFICATION_COLLECTION);
        userNotifications=response.documents||[];
        let html='<h2>Inbox</h2>';
        if(userNotifications.length===0){ html+='<p>No messages</p>'; }
        else{ userNotifications.forEach(n=>{
            html+=`<div class="card"><strong>${n.title}</strong><p>${n.message}</p>${n.imageURL?`<img src="${n.imageURL}">`:''}</div>`; }); }
        document.getElementById('content-area').innerHTML=html;
    }catch(err){ console.error(err); showMessage('Error loading inbox','error'); }
};

// --- Profile ---
const renderProfile=()=>{ 
    document.getElementById('content-area').innerHTML=`
    <h2>Profile</h2>
    <p>Username: Guest</p>
    <p>User ID: guest</p>
    `;
};

// --- Admin Panel (hidden) ---
const renderAdminPanel=()=>{
    document.getElementById('content-area').innerHTML='<h2>Admin Panel</h2><p>Admin access only</p>';
};

// --- Init ---
window.onload=()=>{
    showScreen('home');
};
