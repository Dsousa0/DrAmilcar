const pdfParse = require('pdf-parse')
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters')

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

async function extractText(buffer) {
  const data = await pdfParse(buffer)
  return data.text
}

async function splitIntoChunks(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  })
  const docs = await splitter.createDocuments([text])
  return docs.map((doc) => doc.pageContent).filter((c) => c.trim().length > 0)
}

async function processBuffer(buffer) {
  const text = await extractText(buffer)
  const chunks = await splitIntoChunks(text)
  return { text, chunks }
}

module.exports = { extractText, splitIntoChunks, processBuffer }
