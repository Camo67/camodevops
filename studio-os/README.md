# Studio OS

An all-in-one operating system for creative studios, built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

### Core Modules

1. **Dashboard** - Overview of studio activity, quick actions, and recent updates
2. **CRM**
   - Contacts - Manage leads, clients, crew, vendors, and talents with the "Hat" system
   - Pipeline - Kanban board for tracking deals through sales stages
   - Playbook - Repeatable production processes and workflows
3. **Work**
   - Projects - Track active productions and their status
   - Graph View - Visual relationship mapping between contacts, deals, projects, and crew
   - Tasks - Task management with status tracking and assignments
   - Calendar - Schedule and track meetings, shoots, and deadlines
   - Gear Cage - Equipment management and check-out system
   - Studio Clock - Live billable time tracker for client viewing
4. **Commerce**
   - Store - Manage services and rental offerings
5. **Admin** (Owner Only)
   - Team management
   - Studio settings
   - Billing and subscription

### Special Features

- **Eve AI Assistant** - Floating AI chat for help with drafts, summaries, and suggestions
- **Multi-tenant Support** - Each studio gets their own slug (/s/your-studio)
- **Role-based Access** - Owner, Sales, Producer, Crew, Marketing, Finance, Member roles

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Graph Visualization**: React Flow
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database:
   ```bash
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The Prisma schema includes:

- **Company** - Multi-tenant studio organization
- **User** - Team members with role-based access
- **Contact** - People with multiple "hats" (Lead, Client, Crew, Vendor, Talent)
- **Deal** - Sales pipeline items with stages (Inquiry → Won/Lost)
- **Project** - Active productions linked to deals
- **ProjectCrew** - Many-to-many relationship between projects and contacts
- **Task** - Work items with status and priority
- **GearItem** - Equipment tracking

## Project Structure

```
studio-os/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── pipeline/page.tsx   # Kanban sales pipeline
│   │   ├── graph/page.tsx      # React Flow relationship graph
│   │   ├── clock/page.tsx      # Live billable time tracker
│   │   ├── contacts/page.tsx   # Contact management
│   │   ├── projects/page.tsx   # Project tracking
│   │   ├── tasks/page.tsx      # Task management
│   │   ├── calendar/page.tsx   # Calendar view
│   │   ├── gear/page.tsx       # Equipment management
│   │   ├── playbook/page.tsx   # Production playbooks
│   │   ├── store/page.tsx      # Services/products
│   │   ├── knowledge/page.tsx  # Knowledge base
│   │   ├── admin/page.tsx      # Admin settings
│   │   └── api/eve/route.ts    # Eve AI endpoint
│   ├── components/
│   │   ├── Layout/Sidebar.tsx  # Main navigation
│   │   ├── Graph/CustomNodes.tsx # React Flow custom nodes
│   │   └── EveChat.tsx         # AI assistant chat
│   └── ...
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## Key Concepts

### The "Hat" System
One contact can wear multiple hats - a person can be both a Client on one project and a Vendor on another, without creating duplicate records.

### Automatic Project Creation
When a Deal moves to "Won" in the Pipeline, a Project is automatically created, linking the sales record to production.

### The Graph View
Visualizes the entire journey: Contact → Deal → Project → Crew, making it easy to see relationships and identify bottlenecks.

### Studio Clock
A live timer that displays in large format for client viewing, tracking billable hours at configurable rates.

## Next Steps

1. **Authentication**: Implement NextAuth.js for user login
2. **Database**: Connect to PostgreSQL and run migrations
3. **Eve AI**: Connect to OpenAI/LLM for intelligent responses
4. **Real-time**: Add WebSocket support for live updates
5. **Mobile**: Consider React Native or PWA for mobile access