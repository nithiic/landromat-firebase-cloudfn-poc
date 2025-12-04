/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require('cors')({ origin: true });
const { initializeApp } = require('firebase-admin/app');

const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require("firebase-admin/auth");


 //import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
const {  ref,  uploadString  } = require("firebase-functions/storage");

const ORDER_STATUS = {
   TAKEN: "taken",
   CHECKED: "checked",
   RECEIEVED_AT_STORE: "received_at_store",
   QUEUED_FOR_WASHING: "",
   QUEUED_FOR_IRONING: "",
   QUEUED_FOR_SPECIAL_WASHING: "",
   WASHING_COMPLETE: "washing_complete",
   IRONING_COMPLETE: "",
   ORDER_PROCESSED: "",
   QUEUED_FOR_DELEIVERY: "",
   CUSTOMER_NOT_REACHABLE: "customer_not_reachable",
   CANCELLED: "cancelled",
   DAMAGED: "damaged",
   DELIVERED: "delivered",
   CLOSED: "closed"

};

const ROLE = {
   EMPLOYEE: "employee",
   ADMIN: "admin"
}

var admin = require("firebase-admin");

//var serviceAccount = require("./hello-world-klemsr-firebase-adminsdk-fbsvc-238cbeefc7.json");
/*
admin.initializeApp({
   credential: admin.credential.cert(serviceAccount)
});
*/

admin.initializeApp({
   storageBucket: "hello-world-klemsr.firebasestorage.app",
});

admin.firestore().settings({ 
   ignoreUndefinedProperties: true,
   databaseId: 'klemsr-test' 
});

 

// For cost control, you can set the maximum number of contai
// ners that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
   logger.info("Hello logs!", { structuredData: true });
   response.send("Hello World from Klemsr!");
});

async function checkifUserIsValid(idToken) {

   try {
      const decodedToken = await getAuth().verifyIdToken(idToken);

      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getUserProfile : emailId : ", emailId);
      console.info("getUserProfile : userId : ", userId);

      const db = getFirestore();

      console.info("getUserProfile : db connected ");


      const userObj = await db.collection('users').doc(emailId).get();
      console.info("getUserProfile : snapshot rcvd ", userObj);

      return userObj.exists;
   } catch (error) {
      console.error("checkifUserIsValid error", error);
      return null;
   }




}


exports.getUserProfile = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token
      /*
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.info("getUserProfile : decodedToken : ", decodedToken);
      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getUserProfile : emailId : ", emailId);
      console.info("getUserProfile : userId : ", userId);

      const db = getFirestore();

      console.info("getUserProfile : db connected ");
 
      const userObj = await db.collection('users').doc(emailId).get();
      console.info("getUserProfile : snapshot rcvd ", userObj);

      if (!userObj.exists) {
            console.log('No such document!');
             response.send({ status: 404, message: "User not registered" });
      }
      */
      let isValidUser = await checkifUserIsValid(idToken);
      if (!isValidUser) {
         console.log('No such document!');
         response.send({ status: 404, message: "User not registered" });
      }

      const userObj = await db.collection('users').doc(emailId).get();
      let data = userObj.data();
      let userProfile = {
         id: userObj.id,
         name: data.name,
         email: data.email,
         token: idToken
      }
      console.info("getUserProfile : sending response ", userProfile);
      response.send({ status: 200, data: userProfile });
   } catch (error) {
      console.error("getUserProfile : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});



exports.getMyOrders = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.info("getMyOrders : decodedToken : ", decodedToken);
      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getMyOrders : emailId : ", emailId);
      console.info("getMyOrders : userId : ", userId);

      const db = getFirestore();

      console.info("getMyOrders : db connected ");

      const usersRef = db.collection('orders');

      const snapshot = await usersRef.where('takenBy', '==', emailId)
                                     .where('status', '!=', ORDER_STATUS.CLOSED)
                                     .get();
      //const snapshot = await usersRef.where('name', '==', 'Nithya').get();
      //const snapshot = await db.collection('orders').doc(emailId).get();
      console.info("getMyOrders : snapshot rcvd ", snapshot);


      let docs = [];
      snapshot.forEach(doc => {
         console.info("getMyOrders : snapshot doc ", doc);
         let data = doc.data();
         docs.push({
            id: doc.id,
            orderDesc: data.orderDesc,
            status: data.status,
            takenBy: data.takenBy,
            assignedTo: data.assignedTo
         });
      });
      console.info("getMyOrders : sending response ", docs);
      response.send({ status: 200, data: docs });
   } catch (error) {
      console.error("getMyOrders : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});


exports.getMyAssignedOrders = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.info("getMyAssignedOrders : decodedToken : ", decodedToken);
      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getMyAssignedOrders : emailId : ", emailId);
      console.info("getMyAssignedOrders : userId : ", userId);

      const db = getFirestore();

      console.info("getMyAssignedOrders : db connected ");

      const usersRef = db.collection('orders');

      const snapshot = await usersRef.where('assignedTo', '==', emailId)
                                     .where('status', '!=', ORDER_STATUS.CLOSED).get();
      //const snapshot = await usersRef.where('name', '==', 'Nithya').get();
      //const snapshot = await db.collection('orders').doc(emailId).get();
      console.info("getMyAssignedOrders : snapshot rcvd ", snapshot);


      let docs = [];
      snapshot.forEach(doc => {
         console.info("getMyAssignedOrders : snapshot doc ", doc);
         let data = doc.data();
         docs.push({
            id: doc.id,
            orderDesc: data.orderDesc,
            status: data.status,
            takenBy: data.takenBy,
            assignedTo: data.assignedTo
         });
      });
      console.info("getMyAssignedOrders : sending response ", docs);
      response.send({ status: 200, data: docs });
   } catch (error) {
      console.error("getMyAssignedOrders : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});



exports.getAllPendingOrders = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.info("getAllPendingOrders : decodedToken : ", decodedToken);
      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getAllPendingOrders : emailId : ", emailId);
      console.info("getAllPendingOrders : userId : ", userId);

      const db = getFirestore();

      console.info("getAllPendingOrders : db connected ");

      const usersRef = db.collection('orders');

      const snapshot = await usersRef.where('status', '!=', ORDER_STATUS.CLOSED).get();
      //const snapshot = await usersRef.where('name', '==', 'Nithya').get();
      //const snapshot = await db.collection('orders').doc(emailId).get();
      console.info("getAllPendingOrders : snapshot rcvd ", snapshot);


      let docs = [];
      snapshot.forEach(doc => {
         console.info("getAllPendingOrders : snapshot doc ", doc);
         let data = doc.data();
         docs.push({
            id: doc.id,
            orderDesc: data.orderDesc,
            status: data.status,
            takenBy: data.takenBy,
            assignedTo: data.assignedTo
         });
      });
      console.info("getAllPendingOrders : sending response ", docs);
      response.send({ status: 200, data: docs });
   } catch (error) {
      console.error("getAllPendingOrders : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});


exports.getAllEmployees = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.info("getAllEmployees : decodedToken : ", decodedToken);
      let emailId = decodedToken.email;
      let userId = decodedToken.uid;

      console.info("getAllEmployees : emailId : ", emailId);
      console.info("getAllEmployees : userId : ", userId);

      const db = getFirestore();

      console.info("getAllEmployees : db connected ");

      const usersRef = db.collection('users');

      const snapshot = await usersRef.where('role', '==', ROLE.EMPLOYEE).get();
      //const snapshot = await usersRef.where('name', '==', 'Nithya').get();
      //const snapshot = await db.collection('orders').doc(emailId).get();
      console.info("getAllEmployees : snapshot rcvd ", snapshot);


      let docs = [];
      snapshot.forEach(doc => {
         console.info("getAllEmployees : snapshot doc ", doc);
         let data = doc.data();
         docs.push({
            id: doc.id,
            name: data.name,
            emailId: data.emailId
         });
      });
      console.info("getAllEmployees : sending response ", docs);
      response.send({ status: 200, data: docs });
   } catch (error) {
      console.error("getAllEmployees : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});


exports.getAllStores = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   try {
      // get emailId from the Token

      let isValidUser = await checkifUserIsValid(idToken);
      if (!isValidUser) {
         console.log('No such document!');
         response.send({ status: 404, message: "User not registered" });
      }
 
      const db = getFirestore();

      console.info("getAllStores : db connected ");

      const storeRef = db.collection('stores');

      const snapshot = await storeRef.get();
 
      console.info("getAllStores : snapshot rcvd ", snapshot);

      let docs = [];
      snapshot.forEach(doc => {
         console.info("getAllStores : snapshot doc ", doc);
         let data = doc.data();
         docs.push({
            id: doc.id,
            name: data.name,
            phone: data.phone,
            location: data.location
         });
      });
      console.info("getAllStores : sending response ", docs);
      response.send({ status: 200, data: docs });
   } catch (error) {
      console.error("getAllStores : ", error);
      response.send({ status: 500, error: error });
   }




   // get role and details from user collections

});

exports.searchCustomer = onRequest({ cors: true }, async (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;


   try {

      let isValidUser = await checkifUserIsValid(idToken);

      if (!isValidUser) {
         console.log('No such document!');
         response.send({ status: 404, message: "User not registered" });
      }

      const db = getFirestore();

      console.info("searchCustomer : db connected ");

      let phoneNumber = payload.phoneNumber;
      console.info("searchCustomer : payload phoneNumber : ",phoneNumber);
      const customerObj = await db.collection('customers').doc(phoneNumber).get();
      console.error("searchCustomer customerObj : ", customerObj);
      let data = customerObj.data();
      if (customerObj.exists) {
         let result = {
            name: data.name,
            phoneNumber: phoneNumber,
            emailId: data.email
         };
         console.error("searchCustomer result : ", result);
         response.send({ status: 200, data: result });
      } else {
         response.send({ status: 404, message: "Customer not found!" });
      }


   } catch (error) {
      console.error("searchCustomer : ", error);
      response.send({ status: 500, error: error });
   }





});


exports.createOrder = onRequest({ cors: true }, async (request, response) => {
   // create a new order
   const payload = request.body;
   const idToken = payload.idToken;
   try {

      const decodedToken = await getAuth().verifyIdToken(idToken);

      let emailId = decodedToken.email;
      console.info("createOrder : decodedToken : ", emailId);

      //const db = admin.firestore()
      const db = getFirestore();

      let order = {
         orderDesc: payload.orderDesc,
         takenBy: emailId,
         status: ORDER_STATUS.TAKEN,
         storeId : payload.storeId,
         customerPhonenumber : payload.customerPhonenumber
      };

      const res = await db.collection('orders').add(order);
      console.info("createOrder : sending response ", res);
      //response.send({ status: 200, data: res.id });
      response.send({ status: 200, data: res.id, message: "order created updated successfully" });
   } catch (error) {
      console.error("createOrder : ", error);
      response.send({ status: 500, error: error });
   }


});


exports.updateOrderStatus = onRequest({ cors: true }, async (request, response) => {
   // create a new order
   const payload = request.body;
   const idToken = payload.idToken;
   try {

      const decodedToken = await getAuth().verifyIdToken(idToken);

      let emailId = decodedToken.email;
      console.info("updateOrderStatus : decodedToken : ", emailId);
      console.info("updateOrderStatus : orderId : ", payload.orderId);
      console.info("updateOrderStatus : orderStatus : ", payload.orderStatus);
      console.info("updateOrderStatus : assignedTo : ", payload.assignedTo);

      //const db = admin.firestore()
      const db = getFirestore();

      const res = await db.collection('orders').doc(payload.orderId).update(
         {
            status: payload.orderStatus,
            assignedTo: payload.assignedTo
         });
      console.info("updateOrderStatus : sending response ", res);
      response.send({ status: 200, data: res.id, message: "order status updated successfully" });
   } catch (error) {
      console.error("updateOrderStatus : ", error);
      response.send({ status: 500, error: error });
   }


});

exports.uploadSingleImage = onRequest({ cors: true }, (request, response) => {

   const payload = request.body;
   const idToken = payload.idToken;
   const imageStr = payload.imageStr;
   let base64Image = base64String.split(';base64,').pop();


   const bucket = getStorage().bucket();


  // logger.info("uploadImage idToken : ", idToken);
  // logger.info("uploadImage imageStr : ", imageStr);

   const storage = getStorage();
   const storageRef = ref(storage, 'some-child');

  

   response.send("uploadImage  -- image recvd",);
});
exports.getUserInfo = onRequest({ cors: true }, (request, response) => {


   const payload = request.body;
   const idToken = payload.idToken;
   logger.info("Hello idToken!", idToken);

   // initializeApp();

   // idToken comes from the client app
   getAuth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
         const uid = decodedToken.uid;
         logger.info("Hello decodedToken!", decodedToken);
         // ...
      })
      .catch((error) => {
         // Handle error
         console.error(error);
      });


   //const db = admin.firestore()
   const db = getFirestore();
   /*
      db.listCollections().then(snapshot => {
         snapshot.forEach(snaps => {
            console.log(snaps["_queryOptions"].collectionId); // LIST OF ALL COLLECTIONS
         })
   
         response.send("Hello World from Klemsr getUserInfo! .. all ");
      })
         .catch(error => {
            console.error(error);
            response.send("Hello World from Klemsr getUserInfo error !");
         });
   */

   const usersRef = db.collection('users');

   usersRef.where('name', '==', 'Nithya').get().then(
      (snapshot) => {
         snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
            response.send(doc);
         });
      }
   ).catch(
      error => {
         console.error(error);
         response.send("Hello World from Klemsr getUserInfo error !");
      }
   );;


   /*
   
      const users = db.collection('users');//.doc("Xput4exQrfKYkdAN7PVF");
      //const queryRef = users.where('name', '==', 'Nithya');
      
      //const cityRef = db.collection('cities').doc('SF');
      users.get().then( (doc) =>{
         if (!doc.exists) {
            console.log('No such document!');
         } else {
            console.log('Document data:', doc.data());
         }
       }
   
      ).catch( (error)=>{
         console.log('Document error:', error);
      });
     */



   //response.send("Hello World from Klemsr getUserInfo!");
});

