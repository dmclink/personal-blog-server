# Description
Server for a personal blog that opens apis to CRUD into database. Allows for a few tiers of users:
1. Unregsitered/public/unverified: can read all blog posts and comments
2. Registered w/email verified: can write comments on blog posts
3. Users with can_post permissions*: can write and edit all blog posts (future consider only editing own blog posts)
4. Users with admin permissions*: no additional functionality (future consider a route to ban users)

*currently no way to register these users through api. must be upgraded manually through database or seeded

# Setup 
Fork and load this repo into a cloud provider or self host.
This project uses prisma, so refer to their docs and ensure you've set up required pre-deploy commands for your hosting solution eg. "pnpm dlx prisma migrate deploy"
Make sure your environment has all required variables seen in .env.example
Run with "start" script eg. "pnpm run start"
There's not currently a way to register a user for posting without seeding the database or modifying the database manually to upgrade user permissions. If seeding, set admin user and pass vars in environment and add a seed command to your pre-deploy 

# Endpoints
## Auth
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/verify-email
GET  /api/auth/confirm-email

## Comments
GET  /api/comments/view/:postId
POST /api/comments/create
POST /api/comments/edit
POST /api/comments/delete

## Posts
GET  /api/posts
POST /api/posts/create
POST /api/posts/publish-draft
POST /api/posts/edit
POST /api/posts/delete
GET  /api/posts/drafts
GET  /api/posts/view/:id
