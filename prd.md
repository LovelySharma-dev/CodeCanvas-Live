# 📄 Product Requirement Document (PRD)

## **Project Title:** CodeCanvas Live
**Document Version:** 2.0 *(Enterprise & Advanced Feature Specification)*  
**Tech Stack:** React (Vite), Tailwind CSS, PostgreSQL, InsForge, Monaco Editor, Yjs (CRDT), WebRTC, WebSockets  

---

## 1. 📌 Product Overview
**DevHuddle** is an all-in-one, real-time collaborative engineering workspace built for developers, distributed software teams, technical interviewers, and educators. It unifies high-performance multi-file code editing, visual architecture diagramming, zero-latency audio/video huddles, in-browser code execution, AI pair programming, and interactive debugging into a seamless, high-velocity platform.

---

## 2. 🎯 Core Objectives
* **Sub-50ms Code Synchronization:** Provide conflict-free real-time collaborative code editing across global users using Yjs CRDTs over WebSockets.
* **Unified Visual & Code Workspace:** Bridge system architecture design and code through bi-directional whiteboard-to-code node anchoring.
* **Frictionless Team Communication:** Integrated low-latency WebRTC audio/video huddles with spatial sound, screen sharing, and active speaker spotlighting.
* **End-to-End Developer Workflow:** Enable in-browser script execution, automated unit testing, AI code refactoring, time-travel session playback, and direct GitHub/Vercel deployment pipelines.

---

## 3. 👤 User Personas & Target Audience
* **Senior Engineers & Tech Leads:** For architectural design reviews, complex system pair programming, and incident response war rooms.
* **Technical Interviewers & Hiring Managers:** To conduct end-to-end coding assessments, system design interviews, automated candidate grading, and private candidate evaluation.
* **Coding Bootcamps & Educators:** For live interactive lectures, student mentoring, and scrubbable session replays.

---

## 4. 🚀 Complete Feature Specifications

### 🔐 Feature 1: Authentication & Identity Management
* **Authentication Providers:** Email/Password, Google OAuth 2.0, GitHub OAuth.
* **User Profiles:** Display Name, Custom Avatar/Gravatar, Custom Bio, Tech Stack Badges, User Availability Status (Online, In Huddle, Away, Do Not Disturb).
* **Session Persistence:** Secure JWT handling with automatic token refresh via InsForge Auth.

### 🏢 Feature 2: Workspace Management & Granular RBAC
* **Workspace Lifecycle:** Create, rename, clone, archive, and transfer ownership of workspaces.
* **Member Invitations:** Shareable instant-join links with auto-expiring tokens or direct email invites.
* **Role-Based Access Control (RBAC):**
  * **Owner:** Absolute permissions (manage roles, billing/settings, transfer/delete workspace, lock canvas/files).
  * **Editor:** Full write access to files, whiteboard, terminal, and huddles.
  * **Viewer:** Read-only access to files/canvas, audio/video listener mode, no code execution privileges.
* **Presence Engine:** Real-time online avatars header displaying active file location and current active tool per user.

### 💻 Feature 3: Collaborative Code Editor & Multi-File Tree
* **Editor Engine:** Monaco Editor (VS Code core) with syntax highlighting, auto-closing tags, and linting for 30+ languages.
* **Conflict-Free Real-Time Sync:** Yjs CRDT framework for real-time text sync, multi-caret selection, line attribution tooltips, and individual user cursor color coding.
* **File Explorer Tree:** Full CRUD operations on files and folders, drag-and-drop file organization, context menus, and multi-tab code navigation.
* **Live Sandboxed Preview:** Hot-reloading sandboxed `iframe` rendering for HTML, CSS, JavaScript, and React, complete with mirrored console log outputs (`console.log`, `warn`, `error`).

### 🎨 Feature 4: Interactive Architecture Whiteboard
* **Infinite Canvas Engine:** Vector-based canvas with pan, zoom (10%-500%), dot-grid toggles, and minimap navigation.
* **Drawing Tools:** Freehand pencil, architectural shapes (Servers, Databases, Microservices, Clients, Cloud clouds), smart connectors/arrows, sticky notes, and text boxes.
* **Real-Time Synchronous Rendering:** Instant state propagation of canvas elements across all connected peers using WebSockets.
* **Canvas Exporting:** High-resolution export options including PNG, SVG, PDF, or JSON canvas snapshots.

### 📹 Feature 5: WebRTC Video & Audio Huddle
* **Peer-to-Peer Communication:** Multi-party audio/video call powered by WebRTC mesh topology.
* **Media Controls:** Toggle microphone/camera, background blur, screen sharing (full display or window), and audio noise suppression.
* **Active Speaker Detection:** Visual glowing outline around the speaking user's feed with auto-prioritized video layout.
* **Spatial Audio & Grid View:** Floating, resizable video grid overlayable across editor or canvas tabs.

---

### ✨ ADVANCED & UNIQUE FEATURES

### 🤖 Feature 6: AI Co-Pilot & System Architect
* **Inline AI Generator (`Ctrl+K`):** Highlight code and trigger natural language prompts to write functions, refactor code, generate docstrings, or fix syntax errors.
* **AI Architecture Generator:** Type system prompt on the whiteboard (e.g., *"Design an event-driven payment system with Kafka and Redis"*) to automatically generate linked visual architecture nodes.
* **Automated Code Reviewer:** Single-click workspace scan that highlights security risks, performance bottlenecks, dead code, and memory leaks.

### 🔗 Feature 7: Bi-Directional Whiteboard-to-Code Anchoring
* **Interactive Node Linking:** Click an architectural diagram node (e.g., `Auth Service Node`) to instantly open and highlight the underlying code file (`/src/services/auth.js`).
* **Live Status Badging:** Diagram nodes dynamically display live visual tags showing uncommitted file edits, active cursors working on that component, or test suite status.

### ⏪ Feature 8: Time-Travel Session Replay & Timeline Scrubbing
* **Session Event Recorder:** Automatically records timestamped editor keystrokes, whiteboard strokes, file modifications, and execution logs.
* **Interactive Playback Controls:** Play back coding or interview sessions with scrubbable progress bar, speed controls (0.5x to 4x), jump to event keyframes, and video export.

### 🎯 Feature 9: Interview Assessment & Candidate Grading Suite
* **Private Interviewer Panel:** Dual-view system where interviewers write hidden evaluations, score candidates across customizable rubrics (1-10 scale), and take private timestamped notes.
* **Candidate Assessment Presets:** Pre-load interview challenges with problem statements, starter templates, time limits, and automated assertion test runners.
* **Automated Test Suite Runner:** Custom assertion engine evaluating candidate code against public and hidden unit test suites with instant feedback.

### 💻 Feature 10: In-Browser WebContainer / Multi-Language Runtime
* **In-Browser Terminal Engine:** Integrated terminal running client-side WebContainers (Node.js/NPM) or Pyodide (Python), enabling users to run `npm install`, start web servers, or execute scripts directly in the browser without serverless sandboxes.

### 📦 Feature 11: Direct GitHub Sync & One-Click Deployment
* **GitHub Integration:** Commit, pull, branch, and push code directly to GitHub repositories from inside the workspace UI.
* **Instant Cloud Deploy:** Deploy live preview applications directly to Vercel or Netlify with a single button click.

### 💬 Feature 12: Spatial In-Editor Code Comments & Threading
* **Inline Threaded Comments:** Highlight specific code lines to open floating comment threads (like Google Docs), mention team members with `@user`, and mark issues as resolved.

### 📊 Feature 13: Live Analytics & Code Contribution Heatmaps
* **Team Analytics Panel:** Real-time metrics showing total lines edited per user, time spent per file, active collaboration ratio, and commit readiness metrics.

---

## 5. 🛠 Technical Architecture & Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React (Vite), TypeScript | Component rendering, state management, SPA routing |
| **Styling & UI** | Tailwind CSS, Lucide Icons | Responsive UI layout & modern icon set |
| **Code Editor** | `@monaco-editor/react`, `y-monaco` | Text editor core, syntax highlighting, Yjs bindings |
| **Canvas Engine** | Excalidraw Core / Fabric.js | Vector canvas drawing & shape state management |
| **Backend & Database** | PostgreSQL, InsForge | Relational database, auto REST endpoints & authentication |
| **Real-Time Collaboration** | Yjs, InsForge WebSockets | CRDT text sync, cursor broadcasting, and presence |
| **Video & Audio** | WebRTC (PeerJS / LiveKit Engine) | Peer-to-peer video streaming & screen sharing |
| **Code Execution** | `@webcontainer/api` / Pyodide | Client-side in-browser Node.js & Python runtime |
| **AI Integration** | OpenAI API / Anthropic SDK | AI code completion, code review, and architecture generation |

---

## 6. 🗄 Database Schema (PostgreSQL Highlights)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    status VARCHAR(20) DEFAULT 'online',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces Table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_interview_mode BOOLEAN DEFAULT FALSE,
    github_repo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace Members & RBAC
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'editor',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Workspace Files Table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    content TEXT DEFAULT '',
    file_type VARCHAR(20) NOT NULL,
    linked_whiteboard_node_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Whiteboard Canvas State Table
CREATE TABLE whiteboard_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    canvas_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threaded Code Comments
CREATE TABLE code_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Replays (Time-Travel Engine)
CREATE TABLE session_replays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    event_stream JSONB NOT NULL,
    duration_seconds INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical Interview Evaluations
CREATE TABLE interview_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    private_notes TEXT,
    code_quality_score INT CHECK (code_quality_score BETWEEN 1 AND 10),
    system_design_score INT CHECK (system_design_score BETWEEN 1 AND 10),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
## 7. 🎯 Non-Functional Requirements
Performance: Code synchronization latency must remain under 50ms globally using CRDTs. WebRTC audio/video call connection setup time must be under 1.5s.

Security & Isolation: Code running inside the live preview iframe or WebContainer execution terminal must be isolated (sandbox="allow-scripts allow-same-origin"). Database access strictly governed by PostgreSQL Row Level Security (RLS) policies via InsForge.

Scalability & Resiliency: Workspace state must auto-save locally (IndexedDB) and remotely every 5 seconds to prevent data loss during network disconnection.

## 8. 📅 Milestone Roadmap

### Phase 1: Foundation & Identity — PostgreSQL schema deployment on InsForge, Google/GitHub OAuth configuration, workspace creation, and member RBAC matrix.

### Phase 2: Code Engine & Execution — Integrate Monaco Editor with Yjs real-time CRDT sync, multi-file explorer tree, live preview iframe, and WebContainer terminal execution.

### Phase 3: Visuals & Communication — Build interactive whiteboard canvas with node-to-file link anchoring, WebRTC peer-to-peer audio/video huddle mesh, and interview mode evaluation panels.

### Phase 4: Intelligence & Release — Add OpenAI code assistant (Ctrl+K), time-travel session recorder player, GitHub sync API, and deploy frontend to Vercel.