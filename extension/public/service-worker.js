// Basic service worker to keep the extension active or handle events
console.log("Consensus Service Worker Loaded");

// Allows users to open the side panel by clicking the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
