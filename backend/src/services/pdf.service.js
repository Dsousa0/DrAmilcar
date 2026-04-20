const pdfjs = require('pdfjs-dist/legacy/build/pdf.js')
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters')

pdfjs.GlobalWorkerOptions.workerSrc = ''

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

async function extractText(buffer) {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    stopAtErrors: false,
  })

  const pdf = await loadingTask.promise
  let text = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
  }

  return text
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
