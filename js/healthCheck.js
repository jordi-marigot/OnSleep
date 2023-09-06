// Import the necessary modules.
const electron = require('electron');
const os = require('os');
const net = require('net');

// Define a function to get the private IP address.
function getIP() {
  // Get a list of all network interfaces.
  const ifaces = os.networkInterfaces();

  // Initialize a variable to store the IP address.
  let ip = '';

  // Iterate over the network interfaces.
  Object.keys(ifaces).forEach((ifname) => {
    // Get the list of addresses for each interface.
    ifaces[ifname].forEach((iface) => {
      // Check if the address is an IPv4 address and is not an internal address.
      if (iface.family === 'IPv4' && !iface.internal) {
        // Set the IP address to the first IPv4 address that is not an internal address.
        ip = iface.address;
      }
    });
  });

  // Return the IP address.
  return ip;
}

// Define the main app object.
const app = electron.app;

// Create the main window.
const mainWindow = electron.BrowserWindow.create({
  width: 800,
  height: 600,
});

// Define an interval that sends the IP address to the server every minute.
const interval = setInterval(() => {
  // Get the private IP address.
  const ip = getIP();

  // Create a socket and connect to the server.
  const socket = new net.Socket();
  socket.connect({ host: '1.1.1.1', port: 8022 }, () => {
    // Write the IP address to the socket.
    socket.write(ip);

    // Close the socket.
    socket.end();
  });
}, 60000);

// Load the index.html file in the main window.
mainWindow.loadURL('http://localhost:3000');

// Show the main window when it is ready.
app.on('ready', () => {
  mainWindow.show();
});

// Quit the app when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});
