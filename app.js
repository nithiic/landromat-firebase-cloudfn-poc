import { initializeApp } from "./node_modules/firebase/firebase-app.js";
//import { getFirestore, collection, addDoc, getDocs } from "./node_modules/firebase/firebase-firestore.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
        apiKey: "AIzaSyD-vHeGcxpQuEo5EnwZf-68Va4qJ89HgVk",
        authDomain: "laundramat-fcb0d.firebaseapp.com",
        projectId: "laundramat-fcb0d",
        storageBucket: "laundramat-fcb0d.firebasestorage.app",
        messagingSenderId: "435784534644",
        appId: "1:435784534644:web:1c371780c6c4a33a84df21",
        measurementId: "G-3XDC09FVQF"
        };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add data to Firestore
async function addData() {
  const name = document.getElementById('name').value;
  const age = document.getElementById('age').value;

  try {
    const docRef = await addDoc(collection(db, 'users'), {
      name: name,
      age: parseInt(age)
    });
    console.log('Document written with ID: ', docRef.id);
  } catch (e) {
    console.error('Error adding document: ', e);
  }
}

// Get data from Firestore
async function getData() {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const dataList = document.getElementById('data-list');
  dataList.innerHTML = '';

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = `${data.name}, ${data.age}`;
    dataList.appendChild(listItem);
  });
}

// Expose functions to the global scope
window.addData = addData;
window.getData = getData;