const { getMessaging, getToken } =require("firebase/messaging");

// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
const messaging = getMessaging();
getToken(messaging, { vapidKey:"BO2WiHSOyvC_8gtxFH32XgYuFPTd67d3-U7zdTGufGn5DHm6lVzJjlHvOLNBi6bqfUL54KmUQR-ElWmb9tXrUcw"
 }).then((currentToken:any) => {
  if (currentToken) {
    // Send the token to your server and update the UI if necessary
    // ...
    console.log("hii")
  } else {
    console.log('No registration token available. Request permission to generate one.');
    // ...
  }
}).catch((err:string) => {
  console.log('An error occurred while retrieving token. ', err);
  // ...
});