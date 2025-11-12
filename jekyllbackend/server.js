const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your frontend domain
app.use(cors({
    origin: '*'  // Change this to your site URL in production for security
}));
app.use(bodyParser.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

app.post('/new-post', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        const date = new Date().toISOString().split('T')[0];
        const filename = `_posts/${date}-${title.toLowerCase().replace(/\s+/g,'-')}.md`;

        const postContent = `---
title: "${title}"
date: ${date}
tags: ${tags.join(', ')}
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
