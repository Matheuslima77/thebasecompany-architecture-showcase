# 🏗️ TheBaseCompany: Architecture Showcase & System Design

> **Disclaimer de Engenharia:** O produto principal da TheBaseCompany é um software proprietário (Closed-Source) em produção. Este repositório é uma vitrine arquitetural contendo *code snippets* isolados, decisões de design de sistema e documentação técnica para fins de portfólio.

## 🎯 O Produto
Um CRM Omnichannel focado no mercado imobiliário *High Ticket*. O sistema integra automação de vendas e atendimento autônomo através de agentes de IA orquestrados via WhatsApp, caindo diretamente em um pipeline Kanban gerencial.

## 🧠 Desafios Arquiteturais Resolvidos

Ao escalar um ambiente SaaS para o mercado imobiliário, tomei decisões de engenharia focadas em consistência, segurança e resiliência:

* **Provisionamento Multi-Tenant Atômico:** Substituição de *Triggers* (Gatilhos) de banco de dados por **RPCs no PostgreSQL (Supabase)**. Implementação de lógicas de `UPSERT` para garantir transações atômicas, eliminando *race conditions* e colisões de IDs na criação simultânea de contas e Workspaces.
* **Segurança em Nível de Borda (Edge):** Blindagem de rotas ponta a ponta utilizando **Next.js Edge Runtime Middleware**. A validação de sessões e injeção de cabeçalhos de segurança ocorre antes mesmo da requisição atingir o servidor Node.js.
* **Orquestração de IA e Webhooks:** Integração robusta entre **n8n e OpenAI API** para gerenciar o estado da conversa e garantir o handoff perfeito entre o agente autônomo (Laís) e o Kanban do corretor.

## 🛠️ Stack Tecnológica

* **Frontend:** Next.js (App Router, React 19), Server Components, Server Actions (com Error Boundaries via `useActionState`), Tailwind CSS.
* **Backend, Auth & DB:** Supabase (PostgreSQL), Next.js Edge Middleware, Magic Links, Row Level Security (RLS).
* **Automação & IA:** n8n, OpenAI API (Agentes Autônomos).
* **DevOps & Infraestrutura:** Docker, VPS Hostinger, Ambiente de Desenvolvimento via Google Antigravity.

## 📂 Navegação dos Snippets

Na pasta `/code-snippets` deste repositório, você encontrará fragmentos reais do código que demonstram o domínio da stack:

1.  [`rpc_create_tenant_and_link.sql`](#) - Lógica de UPSERT e atomicidade no banco.
2.  [`proxy.ts`](#) - Middleware de segurança no Edge.
3.  [`tenant_actions.ts`](#) - Mutações seguras no servidor com React 19.
