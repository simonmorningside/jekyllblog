const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your frontend domain
app.use(cors({
    origin: '*' // Replace with your frontend URL in production
}));
app.use(bodyParser.json());

// GitHub client
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

app.post('/new-post', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        // Current timestamp
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec} -0600`;

        // Create a slug for filename
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        const filename = `_posts/${yyyy}-${mm}-${dd}-${slug}.md`;

        // Build front matter + content
        const postContent = `---
layout: post
title: "${title}"
date:   ${timestamp}
categories: ${tags.join(' ')}
tags: [${tags.join(', ')}]
---

${content}
`;

        // Repository info from environment variables
        const repoOwner = process.env.GITHUB_REPO_OWNER;
        const repoName = process.env.GITHUB_REPO_NAME;

        // Create or update file on GitHub
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: filename,
            message: `New post: ${title}`,
            content: Buffer.from(postContent).toString('base64'),
            branch: "main"
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
