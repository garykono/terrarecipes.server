# TerraRecipes API (Node.js + Express + TypeScript + MongoDB)

TerraRecipes is a full-stack recipe management platform featuring fundamental recipe site functions such as structured recipe authoring and user authentication, as well as some more complex features like advanced search and grocery list generation.
This repository contains the **backend API**, built in **Node.js**, **Express**, and **TypeScript**, with **MongoDB/Mongoose** as the database layer.

The API is designed to showcase **production-ready engineering practices**, including:
- Profile-driven request validation and whitelisting  
- A flexible search engine built on MongoDB aggregation  
- Strong separation of concerns  
- Secure authentication with JWT cookies  
- Structured logging, error handling, and environment config  
- Comprehensive TypeScript support across controllers, models, and utilities

---

## ⭐ Features

### **User System & Auth**
- Email & password authentication  
- JWT stored in HTTP-only cookies  
- Signup, login, logout, email verification, password reset  
- Authorization middleware (`protect`, `restrictTo`)  
- Author-based access control on user content

### **Recipes**
- Create/update recipes with ingredients, tags, and metadata  
- Rich querying: text search, facet filters, time filters, multi-field matching, and sorting  
- Normalization of ingredients, measurements and tags

### **Collections**
- User-defined recipe collections  
- CRUD operations  
- Middleware enforcing ownership

### **Advanced Search Engine**
- Profile-driven search architecture:
  - Allowed filters, operations, and fields defined per endpoint  
  - Normalization of query inputs  
  - Compilation into MongoDB queries or aggregation pipelines  
- Weighted text search with relevance scoring  
- Pagination, sorting, and projection controls

### **Grocery Lists**
- Auto-generated lists from recipes  
- Unit normalization and ingredient consolidation  

### **Categories & Standardized Data**
- Static dataset loaders for ingredients and categories  
- Cached in-memory service layer  
- Consistent tagging/metadata across recipes

---

## 🧱 Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express  
- **Language:** TypeScript  
- **Database:** MongoDB Atlas + Mongoose  
- **Logging:** Pino + pino-http  
- **Security:** Helmet, CORS, Rate Limiting, Mongo Sanitize, XSS Clean, HPP  
- **Auth:** JWT (HTTP-only cookies), password hashing, verification emails  
- **Build:** ts-node / tsx for development, `tsc` for production build  

---

## 📦 Folder Structure (Overview)
src/
    app.ts # Express app setup
    server.ts # Server entry, DB connection, process handlers

    controllers/ # Route handlers (thin), auth flows, CRUD wrappers
    routes/ # API route definitions
    models/ # Mongoose schemas + TypeScript types

    normalizers/ # Input normalization (whitelisting and shaping data for functions) per endpoint
    policy/ # Profile definitions: allowed filters/body fields/etc.
    middleware/ # parseInput, compileSearch, auth guards, etc.

    utils/
        searchUtils/ # Search engine: parsing, building, execution
        logger.ts
        env.ts
        apiFeatures.ts
        appError.ts

    services/ # Standardized data service (ingredients/tags)

    types/ # Shared domain-level TypeScript types


    For a detailed explanation of architecture and flow, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🚀 Getting Started

### 1. Install
```bash
pnpm install
# or
npm install
