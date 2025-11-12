const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your frontend domain
app.use(cors({
    origin: '*'  // Change this to your site URL in production
}));
app.use(bodyParser.json());

// GitHub API client
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

app.post('/new-post', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        // UTC date for Jekyll
        const now = new Date();
        const yyyy = now.getUTCFullYear();
        const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(now.getUTCDate()).padStart(2, '0');
        const hh = String(now.getUTCHours()).padStart(2, '0');
        const min = String(now.getUTCMinutes()).padStart(2, '0');
        const ss = String(now.getUTCSeconds()).padStart(2, '0');

        const fullDate = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} +0000`;

        // Slug for filename
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        const filename = `_posts/${yyyy}-${mm}-${dd}-${slug}.md`;

        // Front matter for Jekyll
        const postContent = `---
layout: post
title: "${title}"
date: ${fullDate}
categories: ${tags.join(' ')}
---

${content}
`;

        const repoOwner = process.env.GITHUB_REPO_OWNER;
        const repoName = process.env.GITHUB_REPO_NAME;

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
