import { API_BASE_URL } from "./config.js";

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("register-form");
    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get input values
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        // Basic validation
        if (!name || !email || !password) {
            errorMessage.textContent = "All fields are required.";
            errorMessage.style.display = "block";
            return;
        }

        console.log("Register attempt:", { email });

        // Connect to backend API here

        try {

            const response = await fetch(`${API_BASE_URL}/api/register`, {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Success
            alert("Account created successfully!");
            window.location.href = "login.html";

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = "block";
        }


    });

});
