1. Visão Geral
Este projeto consiste em uma plataforma web para upload de arquivos PDF, processamento de texto e um chat interativo. O sistema deve responder perguntas do usuário utilizando apenas o contexto extraído dos documentos enviados, utilizando a técnica de RAG.

2. Stack Tecnológica
Frontend: React.js + Vite (TailwindCSS para UI).

Backend: Node.js (Express ou Fastify).

Banco de Dados (Dados): MongoDB (Metadados de arquivos, usuários e logs).

Banco de Dados (Vetores): ChromaDB ou LanceDB (Rodando via Docker ou Local).

Orquestração de IA: LangChain.js.

Processamento de PDF: pdf-parse ou langchain/document_loaders/fs/pdf.

3. Arquitetura de Dados e Pipeline (Lógica de Negócio)
A. Fluxo de Ingestão (Upload)
Upload: O frontend envia um .pdf para o backend.

Extração: O backend lê o PDF e extrai o texto bruto.

Chunking (Divisão): O texto é dividido em pedaços menores (ex: 1000 caracteres com 200 de sobreposição/overlap) para manter o contexto semântico.

Embeddings: Cada pedaço de texto é enviado para um modelo de embedding (OpenAI text-embedding-3-small ou local via Transformers.js).

Armazenamento:

O texto original e o vetor (array de números) são salvos no Banco Vetorial.

Referências do arquivo (nome, path, ID do usuário) são salvas no MongoDB.

B. Fluxo de Query (Chat)
Pergunta: O usuário envia uma dúvida via chat no React.

Vetorização da Query: A pergunta do usuário é convertida em um vetor usando o mesmo modelo de embedding do passo anterior.

Busca por Similaridade: O sistema busca no Banco Vetorial os 4 ou 5 "chunks" mais similares à pergunta (Busca de Cosseno).

Prompt Augmentation: O sistema monta um prompt para a LLM:

"Você é um assistente técnico. Use os seguintes trechos de documentos para responder à pergunta do usuário. Se a resposta não estiver no texto, diga que não sabe.
CONTEXTO: {trechos_recuperados}
PERGUNTA: {pergunta_do_usuario}"

Geração: A LLM (GPT-4 ou Claude) gera a resposta e o backend a envia para o frontend.

4. Requisitos de Implementação para o Claude Code
Backend (Node.js)
Criar endpoint POST /upload que aceite multipart/form-data.

Implementar RecursiveCharacterTextSplitter do LangChain.

Configurar integração com Banco Vetorial (ChromaDB/LanceDB).

Frontend (React)
Interface de chat com scroll automático e suporte a Markdown (p/ respostas da IA).

Componente de upload com feedback visual de progresso.

Gerenciamento de estado para listar arquivos já "indexados".

5. Estratégia de Migração para VPS
Utilizar docker-compose para subir o container do App, MongoDB e Banco Vetorial.

Garantir que o volume do Banco Vetorial seja persistente no host da VPS.

Usar Nginx como Proxy Reverso para servir o build do Vite e a API.