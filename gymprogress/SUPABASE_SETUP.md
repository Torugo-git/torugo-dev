# Guia de Ativação do Banco de Dados em Nuvem — GymProgress (Supabase)

O banco de dados do **GymProgress** foi modelado no **Supabase (PostgreSQL)** — gratuito até **50.000 usuários ativos/mês** e **500 MB** de armazenamento (custo **R$ 0** para começar!).

## O que o banco já suporta de fábrica
- **`profiles`**: dados do usuário, plano (`free` / `pro` / `personal_pro`), meta semanal, perfil de BF/Macros e `trainer_id` (para no futuro um Personal Trainer acompanhar seus alunos).
- **`workout_splits`**: fichas de treino com exercícios, séries, faixa de reps e modo `kg` ou `placas`.
- **`workout_logs`**: histórico de treinos finalizados com Volume Total, 1RM (Epley) e PRs batidos.
- **`body_measurements`**: peso, BF%, cintura, peito, braços, pescoço e coxa por data.
- **`body_goals`**: metas corporais do usuário.
- **Segurança (RLS):** cada usuário só enxerga e altera os próprios dados (e um Personal vinculado só pode visualizar os alunos ligados a ele).

## Passo a Passo para Ativar (3 minutos)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita (pode entrar com sua conta do GitHub).
2. Clique em **New Project**:
   - **Name:** `gymprogress`
   - **Region:** `South America (São Paulo)` (mais rápido no Brasil!)
   - Defina uma senha forte para o banco e clique em **Create new project**.
3. No menu lateral esquerdo, clique em **SQL Editor** → **New query**.
4. Copie todo o conteúdo do arquivo **`supabase_schema.sql`**, cole no editor e clique em **Run**.
   - Deve aparecer: `Success. No rows returned`.
5. No menu lateral esquerdo, vá em **Project Settings → API** e copie:
   - **Project URL** (ex.: `https://xxxxx.supabase.co`)
   - **anon public key** (chave pública segura para frontend com RLS ativo)
6. Cole esses 2 valores no topo do arquivo **`cloud.js`** (ou envie para o assistente conectar a tela de Login + Sincronização em Nuvem no `app.html`!).
