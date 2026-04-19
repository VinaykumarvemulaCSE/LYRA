"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { fileName, fileContent, path } = req.body;
        const githubToken = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const branch = process.env.GITHUB_BRANCH || "master";
        if (!githubToken || !owner || !repo) {
            return res.status(500).json({ message: "GitHub CMS not configured" });
        }
        const fullPath = path ? `${path}/${fileName}` : fileName;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;
        // 1. Get current SHA if exists
        let sha;
        try {
            const resp = await fetch(url, {
                headers: { Authorization: `token ${githubToken}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                sha = data.sha;
            }
        }
        catch (e) { }
        // 2. Put file
        const putResp = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `token ${githubToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Upload ${fileName} via API`,
                content: fileContent,
                branch,
                sha
            })
        });
        if (putResp.ok) {
            const putData = await putResp.json();
            return res.status(200).json({
                url: putData.content.download_url,
                path: putData.content.path
            });
        }
        else {
            const errText = await putResp.text();
            return res.status(putResp.status).json({ message: "GitHub upload failed", error: errText });
        }
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Error", error: error.message });
    }
});
exports.default = router;
