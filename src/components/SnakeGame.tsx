import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_SPEED = 120;

export default function SnakeGame({ onExit, visitorName }: { onExit: () => void; visitorName: string }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const dirRef = useRef(dir);

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  const spawnFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood: { x: number; y: number };
    // do-while avoids no-constant-condition lint rule while keeping the retry logic
    do {
      newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const saveScore = useCallback(async () => {
    if (score === 0) return;
    setSaved(true);
    await supabase.from('scores').insert([{ player_alias: visitorName, score }]);
  }, [score, visitorName]);

  useEffect(() => {
    if (gameOver && !saved) saveScore();
  }, [gameOver, saved, saveScore]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      if (gameOver) return;

      const current = dirRef.current;
      if (e.key === 'ArrowUp' && current.y !== 1) setDir({ x: 0, y: -1 });
      if (e.key === 'ArrowDown' && current.y !== -1) setDir({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft' && current.x !== 1) setDir({ x: -1, y: 0 });
      if (e.key === 'ArrowRight' && current.x !== -1) setDir({ x: 1, y: 0 });
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver, onExit]);

  useEffect(() => {
    if (gameOver) return;
    const moveSnake = () => {
      setSnake((prev) => {
        const head = { x: prev[0].x + dirRef.current.x, y: prev[0].y + dirRef.current.y };

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }
        if (prev.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 5);
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [dir, gameOver, food, spawnFood, score]);

  return (
    <div className="absolute inset-0 z-50 bg-[#0C0C0C]/90 backdrop-blur flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-full max-w-[400px] mb-4 font-mono text-sm uppercase">
        <span className="text-[#D7E2EA]">
          Score: <span className="text-green-400">{score}</span>
        </span>
        <button onClick={onExit} className="text-red-400 hover:text-white transition-colors">
          [ESC] Exit
        </button>
      </div>

      <div
        className="bg-black border-2 border-[#333] grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1/1',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = snake.some((s) => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={i}
              className={`
                border border-[#111]
                ${isHead ? 'bg-green-400' : ''}
                ${isBody && !isHead ? 'bg-green-600' : ''}
                ${isFood ? 'bg-red-500' : ''}
              `}
            />
          );
        })}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center font-mono">
          <h2 className="text-4xl text-red-500 font-bold mb-4">GAME OVER</h2>
          <p className="text-white text-xl mb-6">Score: {score}</p>
          <p className="text-[#D7E2EA] mb-6">{saved ? 'Score saved to global leaderboard!' : 'Saving score...'}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setSnake(INITIAL_SNAKE);
                setDir({ x: 0, y: -1 });
                setGameOver(false);
                setScore(0);
                setSaved(false);
                setFood({ x: 5, y: 5 });
              }}
              className="px-6 py-2 bg-green-500 text-black hover:bg-green-400 font-bold"
            >
              PLAY AGAIN
            </button>
            <button onClick={onExit} className="px-6 py-2 border border-white text-white hover:bg-white/10">
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
