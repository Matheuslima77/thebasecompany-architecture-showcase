# 🏗️ TheBaseCompany: Architecture Showcase & System Design

> **Engineering Disclaimer:** The primary product of TheBaseCompany is a proprietary (Closed-Source) software in production. This repository is an architectural showcase containing isolated code snippets, system design decisions, and technical documentation for portfolio purposes.

## 🎯 The Product
An Omnichannel CRM tailored for the High-Ticket real estate market. The system integrates sales automation and autonomous customer service through AI agents orchestrated via WhatsApp, feeding leads directly into a management Kanban pipeline.

### 🔄 Lead Lifecycle & AI Orchestration Flow

```mermaid
graph TD
    %% Estilização Minimalista
    classDef default fill:#1e1e1e,stroke:#333,stroke-width:1px,color:#fff;
    classDef ia fill:#005bea,stroke:#00c6fb,stroke-width:2px,color:#fff;
    classDef success fill:#00b09b,stroke:#96c93d,stroke-width:2px,color:#fff;
    
    A[WhatsApp / Instagram] -->|Webhook Orquestrado via n8n| B(Agent Laís: Qualificação Automática):::ia
    B --> C{Classificação de Intenção}
    C -->|Lead Qualificado| D[Proposta / Apresentação]
    C -->|Lead Frio| E[Descarte ou Nutrição]
    D --> F[Agendamento de Visita]
    F --> G{Avaliação Pós-Visita}
    G -->|Negativo| H[Re-qualificação]
    G -->|Positivo| I[Consolidação / Fechamento]:::success
    I --> J[Venda Concluída]
    J --> K[Pipeline de Recompra / Indicação]
    K -->|Ciclo Contínuo| J

## 🧠 Architectural Challenges Solved

Scaling a SaaS environment for the real estate sector required engineering decisions focused on consistency, security, and resilience:

* **Atomic Multi-Tenant Provisioning:** Replaced database Triggers with **PostgreSQL RPCs (Supabase)**. Implemented strict `UPSERT` logic to guarantee atomic transactions, effectively eliminating race conditions and ID collisions during simultaneous Account and Workspace creation.
* **Edge-Level Security:** End-to-end route shielding using **Next.js Edge Runtime Middleware**. Session validation and security header injection occur before the request even hits the Node.js server.
* **AI & Webhook Orchestration:** Robust integration between **n8n and the OpenAI API** to manage conversation state, ensuring a seamless handoff between the autonomous agent (Laís) and the broker's Kanban board.

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router, React 19), Server Components, Server Actions (with strict Error Boundaries via `useActionState`), Tailwind CSS.
* **Backend, Auth & DB:** Supabase (PostgreSQL), Next.js Edge Middleware, Magic Links, Row Level Security (RLS).
* **Automation & AI:** n8n, OpenAI API (Autonomous Agents).
* **DevOps & Infrastructure:** Docker, Hostinger VPS, Development Environment via Google Antigravity.

## 📂 Snippets Navigation

In the `/code-snippets` folder of this repository, you will find real code fragments demonstrating proficiency across the stack:

1.  [`rpc_create_tenant_and_link.sql`](#) - UPSERT logic and database atomicity.
2.  [`proxy.ts`](#) - Edge security middleware.
3.  [`tenant_actions.ts`](#) - Secure server mutations with React 19.
