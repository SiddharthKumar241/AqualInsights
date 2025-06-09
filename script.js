// Fetch Water Quality Data and Display in Table
async function fetchData() {
    try {
        const response = await fetch("/data");
        const data = await response.json();

        document.getElementById("data-display").innerHTML = data.map(d =>
            `<tr>
                <td>${d.location}</td>
                <td>${d.pH}</td>
                <td>${d.turbidity}</td>
                <td>${d.temperature}°C</td>
            </tr>`
        ).join("");
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
fetchData();

async function fetchAnalysis() {
    try {
        const response = await fetch("/analysis");
        const data = await response.json();

        document.getElementById("analysis-table").innerHTML = `
            <tr>
                <td>${data.avgPH.toFixed(2)}</td>
                <td>${data.avgTurbidity.toFixed(2)}</td>
                <td>${data.avgTemperature.toFixed(2)}°C</td>
            </tr>
        `;
    } catch (error) {
        console.error("Error fetching analysis:", error);
    }
}
fetchAnalysis();

async function fetchReports() {
    try {
        const response = await fetch("/issues");
        const reports = await response.json();

        document.getElementById("reports-table").innerHTML = reports.map(r =>
            `<tr>
                <td>${r.location}</td>
                <td>${r.issue}</td>
                <td>${new Date(r.reportedAt).toLocaleString()}</td>
            </tr>`
        ).join("");
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}
fetchReports();

document.getElementById("issue-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const location = document.getElementById("location").value;
    const issue = document.getElementById("issue").value;

    try {
        const response = await fetch("/submit-issue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location, issue })
        });

        const result = await response.json();
        alert(result.message);
        fetchReports(); 
        document.getElementById("issue-form").reset();
    } catch (error) {
        console.error("Error submitting issue:", error);
    }
});

async function removeDuplicates() {
    try {
        const response = await fetch("/remove-duplicates", { method: "POST" });
        const result = await response.json();
        alert(result.message); 
        await fetchData(); 
    } catch (error) {
        console.error("Error removing duplicates:", error);
    }
}


