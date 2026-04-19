import { Router, Request, Response } from "express";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { fileName, fileContent, path: filePath } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({ message: "fileName and fileContent are required" });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "master";

    if (!githubToken || !owner || !repo) {
      return res.status(500).json({ message: "GitHub CMS not configured on server." });
    }

    // filePath from frontend already includes the filename
    const fullPath = filePath || fileName;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;

    // Get current SHA if file exists (for updates)
    let sha: string | undefined;
    try {
      const existingResp = await fetch(url, {
        headers: { Authorization: `token ${githubToken}`, "User-Agent": "LYRA-App" },
      });
      if (existingResp.ok) {
        const existingData = await existingResp.json() as { sha: string };
        sha = existingData.sha;
      }
    } catch {
      // File doesn't exist yet — that's fine
    }

    // Upload file to GitHub
    const putResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "LYRA-App",
      },
      body: JSON.stringify({
        message: `Upload ${fileName} via LYRA Admin`,
        content: fileContent,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (putResp.ok) {
      const putData = await putResp.json() as { content: { download_url: string; path: string } };
      return res.status(200).json({
        url: putData.content.download_url,
        path: putData.content.path,
      });
    }

    const errText = await putResp.text();
    return res.status(putResp.status).json({ message: "GitHub upload failed", error: errText });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Internal server error", error: msg });
  }
});

export default router;
