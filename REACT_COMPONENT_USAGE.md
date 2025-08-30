# React Component Usage Guide for Animal Crossing Quiz Game

## Overview
This document provides a comprehensive guide for using React components in the Animal Crossing Quiz Game. The application uses a hybrid approach where React components are integrated with legacy JavaScript code.

## Component Structure

### Main Components
- **Header**: Navigation and user authentication status
- **GameContainer**: Main game interface and logic
- **GameControls**: User input controls for the game
- **Footer**: Site footer with links and information

### Context Providers
- **GameProvider**: Manages game state including score, timer, and current item
- **AuthProvider**: Handles user authentication state

## Integration with Legacy Code

The React components are integrated into the game.html file using the following approach:

1. React container divs are placed in the HTML:
   ```html
   <div id="react-header" class="react-container"></div>
   <div id="react-game" class="react-container"></div>
   <div id="react-footer" class="react-container"></div>
   ```

2. The React integration script (game-integration.ts) mounts components into these containers:
   ```typescript
   ReactDOM.createRoot(document.getElementById('react-header')!).render(
     <React.StrictMode>
       <AuthProvider>
         <BrowserRouter>
           <Header />
         </BrowserRouter>
       </AuthProvider>
     </React.StrictMode>
   );
   ```

## GameContainer Component

The GameContainer is the main React component for the game interface:

```tsx
const GameContainer: React.FC = () => {
  const { 
    score, 
    timeLeft, 
    currentItem, 
    feedback, 
    isGameOver, 
    startNewGame 
  } = useGameContext();

  return (
    <div className="game-container">
      <div className="game-stats">
        <div className="score">Score: {score}</div>
        <div className="timer">Time: {timeLeft}</div>
      </div>
      
      {currentItem && (
        <div className="game-content">
          <img src={currentItem.imageUrl} alt="Guess this item" />
          <GameControls />
          <div className="feedback">{feedback}</div>
        </div>
      )}
      
      {isGameOver && (
        <button className="play-again" onClick={startNewGame}>
          Play Again
        </button>
      )}
    </div>
  );
};
```

## GameControls Component

The GameControls component handles user input:

```tsx
const GameControls: React.FC = () => {
  const { 
    submitGuess, 
    isWaitingForNextRound,
    startNextRound,
    selectedCategory,
    setSelectedCategory
  } = useGameContext();
  
  const [guess, setGuess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForNextRound]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGuess(guess);
    setGuess('');
  };
  
  return (
    <div className="game-controls">
      {!isWaitingForNextRound ? (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess..."
            autoComplete="off"
          />
          <button type="submit">Submit</button>
        </form>
      ) : (
        <button onClick={startNextRound}>Next Item</button>
      )}
      
      <div className="category-selector">
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="fish">Fish</option>
          <option value="bugs">Bugs</option>
          <option value="sea">Sea Creatures</option>
          <option value="villagers">Villagers</option>
        </select>
      </div>
    </div>
  );
};
```

## GameState Context

The GameState context provides state management for the game:

```tsx
interface GameContextType {
  score: number;
  timeLeft: number;
  currentItem: GameItem | null;
  feedback: string;
  isGameOver: boolean;
  isWaitingForNextRound: boolean;
  selectedCategory: string;
  difficulty: number;
  submitGuess: (guess: string) => void;
  startNextRound: () => void;
  startNewGame: () => void;
  setSelectedCategory: (category: string) => void;
  setDifficulty: (difficulty: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWaitingForNextRound, setIsWaitingForNextRound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('fish');
  const [difficulty, setDifficulty] = useState(15000);
  
  // Game logic implementation...
  
  const value = {
    score,
    timeLeft,
    currentItem,
    feedback,
    isGameOver,
    isWaitingForNextRound,
    selectedCategory,
    difficulty,
    submitGuess,
    startNextRound,
    startNewGame,
    setSelectedCategory,
    setDifficulty
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
```

## Responsive Design

The React components use responsive design principles:

```css
/* Mobile-first approach */
.game-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

/* Tablet and larger */
@media (min-width: 768px) {
  .game-container {
    padding: 2rem;
  }
  
  .game-controls form {
    display: flex;
    gap: 1rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .game-container {
    max-width: 800px;
  }
}
```

## Best Practices for Component Development

1. **State Management**: Use the GameContext for game-related state and AuthContext for user authentication state.

2. **Component Composition**: Break down complex UI into smaller, reusable components.

3. **Error Handling**: Implement error boundaries and proper error handling in components.

4. **Performance Optimization**: Use React.memo for components that don't need frequent re-renders.

5. **Accessibility**: Ensure all components are accessible with proper ARIA attributes and keyboard navigation.

## Integration with Legacy Code

When integrating React components with legacy code:

1. **Shared State**: Use custom events to communicate between React components and legacy JavaScript.

2. **Progressive Enhancement**: Gradually replace legacy UI elements with React components.

3. **Feature Flags**: Use feature flags to toggle between React and legacy implementations.

## Future Enhancements

1. **Leaderboard Integration**: Enhance the leaderboard with React components.

2. **Animations**: Add smooth transitions and animations for better UX.

3. **Asset Optimization**: Implement lazy loading for images and sounds.

4. **Error Handling**: Implement comprehensive error handling in React components.

5. **Testing**: Add unit and integration tests for React components.
