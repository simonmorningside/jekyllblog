const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your frontend domain
app.use(cors({
    origin: '*'  // Change to your site URL in production
}));
app.use(bodyParser.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

app.post('/new-post', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        // Format date like: 2025-11-04 18:50:38 -0600
        const tzOffset = -now.getTimezoneOffset(); // in minutes
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
        const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
        const fullDate = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} ${tzSign}${tzHours}${tzMinutes}`;

        // Slug for filename
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const filename = `_posts/${yyyy}-${mm}-${dd}-${slug}.md`;

        // Build front matter like your example
        const frontMatter = `---
layout: post
title: "${title}"
date:   ${fullDate}
categories: ${tags.join(' ')}
---
`;

        const postContent = frontMatter + '\n' + content + '\n';

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
