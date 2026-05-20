import { useState } from 'react'
import './App.css'
import { generateFlashcards, generateFlashcardsFromPDF } from './api'

function FlashCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flashcard-wrapper">
      <p className="card-counter">{index + 1} / {total}</p>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <p className="card-label">Question</p>
            <p className="card-text">{card.question}</p>
            <p className="card-hint">Click to reveal answer</p>
          </div>
          <div className="flashcard-back">
            <p className="card-label">Answer</p>
            <p className="card-text">{card.answer}</p>
            <p className="card-hint">Click to flip back</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [text, setText] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePdfUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      alert('Please upload a valid PDF file')
    }
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setFlashcards([])
    setCurrentIndex(0)

    try {
      let cards
      if (pdfFile) {
        const base64 = await toBase64(pdfFile)
        cards = await generateFlashcardsFromPDF(base64)
      } else {
        cards = await generateFlashcards(text)
      }
      setFlashcards(cards)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFlashcards([])
    setText('')
    setPdfFile(null)
    setCurrentIndex(0)
    setError(null)
  }

  if (flashcards.length > 0) {
    return (
      <div className="container">
        <div className="card quiz-card">
          <div className="quiz-header">
            <div>
              <div className="header-badge">AI Powered</div>
              <h1>Cardify</h1>
              <p className="quiz-subtitle">Flashcard Generator</p>
            </div>
            <button className="btn-reset" onClick={handleReset}>Start Over</button>
          </div>

          <FlashCard
            card={flashcards[currentIndex]}
            index={currentIndex}
            total={flashcards.length}
          />

          <div className="nav-buttons">
            <button
              className="btn-nav"
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              className="btn-nav btn-nav-next"
              onClick={() => setCurrentIndex(i => i + 1)}
              disabled={currentIndex === flashcards.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="header-badge">AI Powered</div>
          <h1>Cardify</h1>
          <p className="app-subtitle">Flashcard Generator</p>
          <p className="subtitle">Paste your notes or upload a PDF and get study-ready flashcards in seconds</p>
        </div>

        <div className="divider-line" />

        <div className="section">
          <label className="label">Paste your notes</label>
          <textarea
            className="textarea"
            placeholder="Paste your study notes, textbook content, or anything you want to learn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="divider"><span>or</span></div>

        <div className="section">
          <label className="label">Upload a PDF</label>
          <div className="upload-box" onClick={() => document.getElementById('pdf-input').click()}>
            {pdfFile ? (
              <p className="upload-success">{pdfFile.name} — ready</p>
            ) : (
              <>
                <div className="upload-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="upload-text">Click to upload a PDF</p>
                <p className="upload-hint">.pdf files only</p>
              </>
            )}
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handlePdfUpload}
            />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={(!text && !pdfFile) || loading}
        >
          {loading ? 'Generating...' : 'Generate Flashcards'}
        </button>
      </div>
    </div>
  )
}

export default App