import { useCallback, useEffect, useState } from 'react'

const STARTING_LIVES = 10
const VALUES = Array.from({ length: 10 }, (_, index) => index + 1)

function createDeck() {
  const deck = [...VALUES, ...VALUES].map((value, index) => ({
    id: `${value}-${index}`,
    value,
    state: 'hidden',
  }))

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]]
  }

  return deck
}

function App() {
  const [cards, setCards] = useState(createDeck)
  const [selectedIds, setSelectedIds] = useState([])
  const [matches, setMatches] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [result, setResult] = useState('playing')
  const [hasMismatch, setHasMismatch] = useState(false)

  const hideMismatch = useCallback(() => {
    if (!hasMismatch || result !== 'playing') return

    setCards((currentCards) =>
      currentCards.map((card) =>
        selectedIds.includes(card.id) ? { ...card, state: 'hidden' } : card,
      ),
    )
    setSelectedIds([])
    setHasMismatch(false)
  }, [hasMismatch, result, selectedIds])

  useEffect(() => {
    window.addEventListener('click', hideMismatch)
    return () => window.removeEventListener('click', hideMismatch)
  }, [hideMismatch])

  function selectCard(event, id) {
    event.stopPropagation()

    if (result !== 'playing') return

    const selectedCard = cards.find((card) => card.id === id)
    if (!selectedCard || selectedCard.state !== 'hidden') return

    if (hasMismatch) {
      const previousIds = selectedIds
      setCards((currentCards) =>
        currentCards.map((card) => {
          if (card.id === id) return { ...card, state: 'visible' }
          if (previousIds.includes(card.id)) return { ...card, state: 'hidden' }
          return card
        }),
      )
      setSelectedIds([id])
      setHasMismatch(false)
      return
    }

    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === id ? { ...card, state: 'visible' } : card,
      ),
    )

    if (selectedIds.length === 0) {
      setSelectedIds([id])
      return
    }

    const firstCard = cards.find((card) => card.id === selectedIds[0])
    const pairIds = [selectedIds[0], id]

    if (firstCard.value === selectedCard.value) {
      setCards((currentCards) =>
        currentCards.map((card) =>
          pairIds.includes(card.id) ? { ...card, state: 'matched' } : card,
        ),
      )
      setSelectedIds([])
      setMatches((currentMatches) => {
        const nextMatches = currentMatches + 1
        if (nextMatches === 10) setResult('won')
        return nextMatches
      })
      return
    }

    setSelectedIds(pairIds)
    setHasMismatch(true)
    setLives((currentLives) => {
      const nextLives = currentLives - 1
      if (nextLives === 0) setResult('lost')
      return nextLives
    })
  }

  return (
    <main className="game">
      <h1>Memory Matching</h1>

      <div className="cards" aria-label="Memory cards">
        {cards.map((card, index) => (
          <button
            className={`card ${card.state !== 'hidden' ? 'revealed' : ''}`}
            key={card.id}
            type="button"
            onClick={(event) => selectCard(event, card.id)}
            aria-label={
              card.state === 'hidden'
                ? `Hidden card ${index + 1}`
                : `Card ${index + 1}, number ${card.value}`
            }
            disabled={card.state === 'matched' || result !== 'playing'}
          >
            {card.state !== 'hidden' ? card.value : ''}
          </button>
        ))}
      </div>

      <footer aria-live="polite">
        <span>Match: {matches}</span>
        <span>Live: {lives}</span>
        {result === 'won' && <span>You WIN</span>}
        {result === 'lost' && <span>You LOST</span>}
      </footer>
    </main>
  )
}

export default App
