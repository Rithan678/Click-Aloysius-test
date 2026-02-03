export const selfieStorage = {
  setEmbedding: (embedding) => {
    localStorage.setItem('selfieEmbedding', JSON.stringify(embedding))
  },
  getEmbedding: () => {
    const data = localStorage.getItem('selfieEmbedding')
    return data ? JSON.parse(data) : null
  },
  hasEmbedding: () => {
    return !!localStorage.getItem('selfieEmbedding')
  },
  clear: () => {
    localStorage.removeItem('selfieEmbedding')
  }
}
