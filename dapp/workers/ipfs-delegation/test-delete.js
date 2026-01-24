
const WORKER_URL = "http://localhost:8787";

async function testDelete() {
    console.log(`Testing DELETE request to worker at: ${WORKER_URL}`);
    try {
        const response = await fetch(WORKER_URL, {
            method: "DELETE",
        });

        console.log(`Response status: ${response.status} ${response.statusText}`);

        if (response.status === 405) {
            console.log("✅ SUCCESS: Worker correctly returned 405 Method Not Allowed for DELETE request.");
        } else {
            console.error(`❌ FAILURE: Worker returned unexpected status ${response.status}`);
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ FAILURE: Network error or worker not running.", error);
        process.exit(1);
    }
}

testDelete();
