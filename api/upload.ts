/**
 * Lyra Secure Image Upload API
 * ----------------------------
 * It uses the GITHUB_TOKEN from your environment variables safely.
 */
import { verifyAdmin } from "./utils/auth.js";
import { verifyCsrfToken } from "./utils/csrf.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Server-Side Authentication
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin privileges required." });
  }

  // 1.5 CSRF Protection
  if (!verifyCsrfToken(req)) {
    return res.status(403).json({ message: "CSRF token missing or invalid." });
  }

  const { content, path, fileName } = req.body;

  if (!content || !path) {
    return res.status(400).json({ message: 'Content and Path are required' });
  }

  // Basic Image MIME Type Validation (Sniffing base64 content)
  const isImage = content.startsWith('data:image/') ||
    content.startsWith('/9j/') || // JPEG
    content.startsWith('iVBORw0KGgo') || // PNG
    content.startsWith('R0lGOD') || // GIF
    content.startsWith('UklGR') || // WebP
    content.startsWith('PHN2Zy'); // SVG

  if (!isImage) {
    return res.status(400).json({ message: "Invalid file type. Only image uploads are permitted." });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.VITE_GITHUB_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || "main";

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({ message: 'GitHub configuration missing on server' });
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    // Check if the file already exists (to get the SHA for replacement)
    let sha = null;
    try {
      const getFile = await fetch(url, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });
      if (getFile.ok) {
        const fileData = await getFile.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // New file
    }

    // Upload to GitHub
    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Asset Upload (Serverless): ${fileName || path.split('/').pop()}`,
        content: content,
        branch: BRANCH,
        sha: sha || undefined
      })
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.message || "Failed to upload to GitHub");
    }

    const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${path}`;

    return res.status(200).json({
      success: true,
      url: githubUrl
    });

  } catch (error: any) {
    console.error("Serverless Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
