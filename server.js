require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve dashboard.html at root first
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Serve other HTML pages by explicit routes
app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/database", (req, res) => {
    res.sendFile(path.join(__dirname, "database.html"));
});

app.get("/analysis-page", (req, res) => {
    res.sendFile(path.join(__dirname, "analysis.html"));
});

// Now serve static files like CSS, JS, images, index.html etc.
app.use(express.static(__dirname));

// Import your models AFTER defining routes to avoid conflicts
const { WaterData, Issue } = require("./db");

app.get("/data", async (req, res) => {
    try {
        const data = await WaterData.find();
        res.json(data);
    } catch (error) {
        console.error("Error fetching water data:", error);
        res.status(500).json({ error: "Failed to fetch water data" });
    }
});

app.get("/analysis", async (req, res) => {
    try {
        const data = await WaterData.find();
        if (data.length === 0) {
            return res.json({ avgPH: 0, avgTurbidity: 0, avgTemperature: 0 });
        }
        const avgPH = data.reduce((sum, d) => sum + d.pH, 0) / data.length;
        const avgTurbidity = data.reduce((sum, d) => sum + d.turbidity, 0) / data.length;
        const avgTemperature = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
        res.json({ avgPH, avgTurbidity, avgTemperature });
    } catch (error) {
        console.error("Error fetching analysis data:", error);
        res.status(500).json({ error: "Failed to fetch analysis data" });
    }
});

app.get("/issues", async (req, res) => {
    try {
        const issues = await Issue.find().sort({ reportedAt: -1 });
        res.json(issues);
    } catch (error) {
        console.error("Error fetching reported issues:", error);
        res.status(500).json({ error: "Failed to fetch reported issues" });
    }
});

app.post("/add-water-data", async (req, res) => {
    console.log("📥 Received Request Body:", req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Invalid JSON or missing body" });
    }
    const { location, pH, turbidity, temperature } = req.body;
    if (!location || pH == null || turbidity == null || temperature == null) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const newWaterData = new WaterData({ location, pH, turbidity, temperature });
        await newWaterData.save();
        res.json({ message: "Water data added successfully!" });
    } catch (error) {
        console.error("Error saving water data:", error);
        res.status(500).json({ error: "Failed to save water data" });
    }
});

app.post("/submit-issue", async (req, res) => {
    try {
        const { location, issue } = req.body;
        if (!location || !issue) {
            return res.status(400).json({ error: "Location and issue are required" });
        }
        const newIssue = new Issue({
            location,
            issue,
            reportedAt: new Date(),
        });
        await newIssue.save();
        res.json({ message: "Issue reported successfully!" });
    } catch (error) {
        console.error("Error submitting issue:", error);
        res.status(500).json({ error: "Failed to submit issue" });
    }
});

app.post("/remove-duplicates", async (req, res) => {
    try {
        const duplicates = await WaterData.aggregate([
            {
                $group: {
                    _id: { location: "$location", pH: "$pH", turbidity: "$turbidity", temperature: "$temperature" },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);
        let deletedCount = 0;
        for (const record of duplicates) {
            const idsToDelete = record.ids.slice(1);
            const deleteResult = await WaterData.deleteMany({ _id: { $in: idsToDelete } });
            deletedCount += deleteResult.deletedCount;
        }
        res.json({ message: `Removed ${deletedCount} duplicate records.` });
    } catch (error) {
        console.error("Error removing duplicates:", error);
        res.status(500).json({ error: "Failed to remove duplicates" });
    }
});

app.use((req, res) => {
    res.status(404).send("404 Not Found - The requested resource does not exist.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
