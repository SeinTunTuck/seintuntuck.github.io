import { useCallback, useEffect, useState } from 'react'

const STARTING_LIVES = 10
const VALUES = Array.from({ length: 10 }, (_, index) => index + 1)

function makeDeck() {
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
  const [cards, setCards] = useState(makeDeck)
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

  function chooseCard(event, id) {
    event.stopPropagation()

    if (result !== 'playing') return

    const chosenCard = cards.find((card) => card.id === id)
    if (!chosenCard || chosenCard.state !== 'hidden') return

    if (hasMismatch) {
      const mismatchedIds = selectedIds
      setCards((currentCards) =>
        currentCards.map((card) => {
          if (card.id === id) return { ...card, state: 'visible' }
          if (mismatchedIds.includes(card.id)) return { ...card, state: 'hidden' }
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

    if (firstCard.value === chosenCard.value) {
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

  function startNewGame(event) {
    event.stopPropagation()
    setCards(makeDeck())
    setSelectedIds([])
    setMatches(0)
    setLives(STARTING_LIVES)
    setResult('playing')
    setHasMismatch(false)
  }

  const instruction =
    result === 'won'
      ? 'Every pair found — brilliant memory!'
      : result === 'lost'
        ? 'No lives left. Shuffle the deck and try again.'
        : hasMismatch
          ? 'Not a match. Choose another card to continue.'
          : 'Find all 10 pairs before you run out of lives.'

  return (
    <main className="game-shell">
      <section className="game" aria-labelledby="game-title">
        <header className="game-header">
          <div>
            <p className="eyebrow">Number pairs</p>
            <h1 id="game-title">Memory Match</h1>
          </div>
          <button className="new-game" type="button" onClick={startNewGame}>
            <span aria-hidden="true">↻</span> New game
          </button>
        </header>

        <div className="scoreboard" aria-label="Game score">
          <div className="score-block">
            <span>Matches</span>
            <strong>{matches}<small>/10</small></strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${matches * 10}%` }} />
          </div>
          <div className="score-block lives">
            <span>Lives</span>
            <strong>{lives}<small>/10</small></strong>
          </div>
        </div>

        <p className="instruction" aria-live="polite">{instruction}</p>

        <div className="card-grid" aria-label="Memory cards">
          {cards.map((card, index) => {
            const isRevealed = card.state !== 'hidden'
            return (
              <button
                className={`card ${isRevealed ? 'is-revealed' : ''} ${card.state === 'matched' ? 'is-matched' : ''}`}
                data-value={card.value}
                key={card.id}
                type="button"
                onClick={(event) => chooseCard(event, card.id)}
                aria-label={
                  card.state === 'matched'
                    ? `Card ${index + 1}, matched number ${card.value}`
                    : isRevealed
                      ? `Card ${index + 1}, number ${card.value}`
                      : `Hidden card ${index + 1}`
                }
                aria-pressed={isRevealed}
                disabled={card.state === 'matched' || result !== 'playing'}
              >
                <span className="card-inner">
                  <span className="card-front" aria-hidden="true">
                    <span>?</span>
                  </span>
                  <span className="card-back" aria-hidden="true">
                    <span>{card.value}</span>
                    {card.state === 'matched' && <i>✓</i>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {result !== 'playing' && (
          <div className={`result ${result}`} role="status">
            <span className="result-icon" aria-hidden="true">
              {result === 'won' ? '★' : '×'}
            </span>
            <div>
              <h2>{result === 'won' ? 'You win!' : 'Game over'}</h2>
              <p>
                {result === 'won'
                  ? `You matched all 10 pairs with ${lives} ${lives === 1 ? 'life' : 'lives'} left.`
                  : `You found ${matches} ${matches === 1 ? 'pair' : 'pairs'}. Give it another go!`}
              </p>
            </div>
            <button type="button" onClick={startNewGame}>Play again</button>
          </div>
        )}

        <footer>
          <span className="legend-swatch matched" /> Matched
          <span className="legend-swatch hidden" /> Hidden
        </footer>
      </section>
    </main>
  )
}

export default App
