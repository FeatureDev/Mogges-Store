// API Configuration
// Change this to your phone's IP address when running backend on phone
const CONFIG = {
    // Local development (when running npm start on PC)
    LOCAL_API: 'http://localhost:3000',
    
    // Phone backend (replace with your phone's IP address)
    // Find IP: Settings -> WiFi -> Your Network -> IP Address
    PHONE_API: 'http://192.168.1.100:3000', // CHANGE THIS!
    
    // Set to true when using phone backend
    USE_PHONE: false
};

// Export the active API URL
const API_BASE_URL = CONFIG.USE_PHONE ? CONFIG.PHONE_API : CONFIG.LOCAL_API;

console.log('?? API Configuration:', {
    mode: CONFIG.USE_PHONE ? 'PHONE BACKEND' : 'LOCAL BACKEND',
    url: API_BASE_URL
});
