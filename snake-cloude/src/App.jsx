import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 30;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [redFood, setRedFood] = useState([15, 15]);
  const [blueFood, setBlueFood] = useState([20, 20]);
  const [greyFood, setGreyFood] = useState([10, 20]);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback((excludePositions = []) => {
    let newFood;
    const allPositions = [...snake, ...excludePositions];
    do {
      newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
    } while (allPositions.some(pos => pos[0] === newFood[0] && pos[1] === newFood[1]));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setRedFood([15, 15]);
    setBlueFood([20, 20]);
    setGreyFood([10, 20]);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      let newHead = [head[0] + direction.x, head[1] + direction.y];

      // Wrap around borders instead of dying
      if (newHead[0] < 0) newHead[0] = GRID_SIZE - 1;
      if (newHead[0] >= GRID_SIZE) newHead[0] = 0;
      if (newHead[1] < 0) newHead[1] = GRID_SIZE - 1;
      if (newHead[1] >= GRID_SIZE) newHead[1] = 0;

      // Check collision with self
      if (prevSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check red food
      if (newHead[0] === redFood[0] && newHead[1] === redFood[1]) {
        setScore(s => s + 5);
        setRedFood(generateFood([blueFood, greyFood]));
      }
      // Check blue food
      else if (newHead[0] === blueFood[0] && newHead[1] === blueFood[1]) {
        setScore(s => s + 10);
        setBlueFood(generateFood([redFood, greyFood]));
      }
      // Check grey food (bad food)
      else if (newHead[0] === greyFood[0] && newHead[1] === greyFood[1]) {
        setScore(s => s - 10);
        setGreyFood(generateFood([redFood, blueFood]));
      }
      // No food eaten
      else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, redFood, blueFood, greyFood, gameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-green-800">Snake Game</h1>
          <div className="text-2xl font-bold text-green-600">Score: {score}</div>
        </div>

        <div 
          className="relative bg-gray-900 border-4 border-green-600 rounded"
          style={{ 
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE 
          }}
        >
          {snake.map((segment, i) => (
            <div
              key={i}
              className="absolute bg-green-500 rounded-sm"
              style={{
                left: segment[0] * CELL_SIZE,
                top: segment[1] * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                backgroundColor: i === 0 ? '#22c55e' : '#4ade80'
              }}
            />
          ))}
          
          {/* Red food - 5 points */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: redFood[0] * CELL_SIZE,
              top: redFood[1] * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2
            }}
          />

          {/* Blue food - 10 points */}
          <div
            className="absolute bg-blue-500 rounded-full"
            style={{
              left: blueFood[0] * CELL_SIZE,
              top: blueFood[1] * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2
            }}
          />

          {/* Grey food - minus 10 points */}
          <div
            className="absolute bg-gray-500 rounded-full"
            style={{
              left: greyFood[0] * CELL_SIZE,
              top: greyFood[1] * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2
            }}
          />

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-4">Game Over!</div>
                <div className="text-2xl text-white mb-4">Final Score: {score}</div>
                <button
                  onClick={resetGame}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-4xl font-bold text-white">Paused</div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-gray-700">
          <p className="mb-2">Use arrow keys to move</p>
          <p className="text-sm">Press SPACE to pause • Snake wraps around borders</p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> +5 pts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> +10 pts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-500 rounded-full inline-block"></span> -10 pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}