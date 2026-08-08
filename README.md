<div align="center">

# 🪼 CodeCanvas Live

### Next-Generation Full-Stack Collaborative Code Studio & Pair Programming Platform

[![React](https://img.shields.io/badge/React-18.3-06B6D4?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![InsForge](https://img.shields.io/badge/InsForge-BaaS-10B981?style=for-the-badge&logo=postgresql)](https://insforge.dev/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-Jellyfish_Theme-00E5FF?style=for-the-badge&logo=visualstudiocode)](https://microsoft.github.io/monaco-editor/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Video_Call-F43F5E?style=for-the-badge&logo=webrtc)](https://webrtc.org/)

<p align="center">
  <b>Real-Time Pair Programming</b> • <b>WebRTC Video & Audio Calls</b> • <b>Live Hot-Reloading Sandbox</b> • <b>Team Chat</b> • <b>Collaborative Whiteboard</b>
</p>

---

</div>

## 🌟 Overview

**CodeCanvas Live** is a production-ready, ultra-responsive collaborative IDE designed for engineering teams to build, edit, discuss, and preview web applications together in real time.

Powered by **React 18**, **Monaco Editor**, **Tailwind CSS**, **InsForge BaaS**, **PostgreSQL**, and **WebRTC**, CodeCanvas Live brings a friction-free pair programming environment right into your browser.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    %% ==================== STYLING DEFINITIONS ====================
    classDef clientStyle fill:#0F172A,stroke:#06B6D4,stroke-width:2px,color:#F8FAFC;
    classDef syncStyle fill:#032B43,stroke:#10B981,stroke-width:2px,color:#F8FAFC;
    classDef realtimeStyle fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef dbStyle fill:#0F2942,stroke:#0284C7,stroke-width:2px,color:#F8FAFC;
    classDef p2pStyle fill:#1C1917,stroke:#F43F5E,stroke-width:2px,color:#F8FAFC;

    %% ==================== CLIENT TIER ====================
    subgraph Client ["🖥️ Frontend Client Tier (React 18 + Vite)"]
        direction TB

        subgraph Shell ["App Shell & Management"]
            UI["Dashboard & Workspace Navigation"]
            FileExplorer["File Tree Explorer (CRUD)"]
        end

        subgraph Studio ["Workspace Studio Components"]
            Monaco["Monaco Editor\n(Jellyfish Theme)"]
            LivePrev["Sandboxed Live Preview\n(Isolated Iframe)"]
            Whiteboard["Interactive Whiteboard\n(Vector Canvas)"]
            Chat["Team Chat & Snippets"]
            VideoUI["WebRTC Video Overlay\n(PiP Grid)"]
        end

        subgraph LocalSync ["Local CRDT & State Engine"]
            YjsDoc["Yjs Y.Doc\n(Conflict-Free State)"]
            Awareness["Yjs Awareness\n(Caret & Presence)"]
        end
    end

    %% ==================== REALTIME TIER ====================
    subgraph Realtime ["⚡ Real-Time Communication & Signaling Layer"]
        direction LR
        WS["InsForge WebSocket Engine\n(Pub/Sub: workspace:id)"]
        Signaling["WebRTC Signaling Channel\n(Offer / Answer / ICE)"]
    end

    subgraph PeerMesh ["🤝 Peer-to-Peer Mesh Network"]
        PeerA["Peer Client A"] <===>|WebRTC Audio/Video Stream| PeerB["Peer Client B"]
    end

    %% ==================== BACKEND TIER ====================
    subgraph Backend ["🗄️ InsForge Backend (PostgreSQL BaaS)"]
        direction LR
        DB[("PostgreSQL Database\n(Users, Workspaces, Members, Files, Invites)")]
        Auth["InsForge Auth Service\n(Email JWT & Social OAuth)"]
    end

    %% ==================== CONNECTIONS ====================
    %% Internal Client Flow
    Monaco <-->|Text Mutations| YjsDoc
    Monaco -->|Cursor Position| Awareness
    Whiteboard <-->|Vector Shape Delta| YjsDoc
    FileExplorer -->|Select File| Monaco
    Monaco -->|Combined Source| LivePrev

    %% Real-Time Data Sync
    YjsDoc <-->|CRDT State Vector Sync| WS
    Awareness <-->|Presence Broadcast| WS
    Chat <-->|Instant Message Broadcast| WS
    
    %% WebRTC Connection Setup
    VideoUI <-->|Signaling Handshake| Signaling
    Signaling -.->|Establish P2P Call| PeerMesh

    %% Backend Persistence & Auth
    UI <-->|Session & JWT Validation| Auth
    FileExplorer <-->|File CRUD REST API| DB
    Chat <-->|Message History Logs| DB

    %% Apply Styles
    class Client,Shell,Studio clientStyle;
    class LocalSync syncStyle;
    class Realtime realtimeStyle;
    class Backend dbStyle;
    class PeerMesh p2pStyle;
```

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🪼 **Jellyfish Oceanic Theme** | Custom Monaco Editor theme featuring deep oceanic slate canvas (`#070A12`), Cyan carets (`#00E5FF`), Sky keywords (`#38BDF8`), Emerald strings (`#10B981`), and Coral accents (`#F43F5E`). |
| ⚡ **Live Preview Sandbox** | Hot-reloading iframe preview that automatically bundles `index.html`, `style.css`, and `script.js`, capturing console output in real time. |
| 📹 **WebRTC Video Calls** | Integrated video & audio channels with mute/unmute mic, camera toggle, screen sharing, and draggable PiP overlay. |
| 💬 **Real-Time Team Chat** | Slide-out messaging panel supporting text chat, code snippet formatting, timestamps, and active user presence badges. |
| 🎨 **Collaborative Whiteboard** | Freehand drawing, shapes (Rectangle, Circle, Arrow), text notes, color swatches, eraser, and PNG export synchronized live via WebSockets. |
| 🔒 **Role-Based Access Control** | Granular workspace permissions (`OWNER`, `EDITOR`, `VIEWER`) enforced across editor and backend database operations. |
| ✉️ **Dashboard & Email Invites** | Instant invitation system with 7-day token expiration, pending invitation cards on the dashboard, and one-click accept/decline actions. |

---

## 🗄️ PostgreSQL Database Schema

CodeCanvas Live uses **InsForge** PostgreSQL backend with strict UUID v4 primary keys:

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workspaces Table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workspace Members Table
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')) DEFAULT 'EDITOR',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workspace Invitations Table
CREATE TABLE workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('EDITOR', 'VIEWER')) DEFAULT 'EDITOR',
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')) DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Files Table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/LovelySharma-dev/CodeCanvas-Live.git
cd "CodeCanvas Live"
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_INSFORGE_BASE_URL=https://d7fwbe73.ap-southeast.insforge.app
VITE_INSFORGE_ANON_KEY=ik_631989c04f450a1cf7ec7997cfdc92ed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Production Build

To build for production:
```bash
npm run build
```

To preview production build locally:
```bash
npm run preview
```

---

## 🛠️ Tech Stack & Libraries

- **Frontend**: React 18, Vite 6, React Router v6
- **Styling**: Tailwind CSS 3.4, Lucide React Icons
- **Code Editor**: `@monaco-editor/react` with custom Jellyfish Theme
- **Backend & Auth**: InsForge TypeScript SDK (`@insforge/sdk`)
- **Database**: PostgreSQL (Managed via InsForge PostgREST API)
- **Realtime & WebRTC**: WebSockets Broadcast, HTML5 Canvas, WebRTC `MediaStream`

---

<div align="center">

Made with ❤️ by the **CodeCanvas Live**

</div>
