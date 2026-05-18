const run = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/ai/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Hello from test client", voice: "en-US" })
        });
        const text = await response.text();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", text);
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
};
run();
