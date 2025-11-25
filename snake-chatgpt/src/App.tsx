import React, { useEffect, useRef, useState } from "react";

// React Snake Game - single-file component
// Usage: paste into a React project (Vite / CRA). If you don't use Tailwind, replace classNames or add simple CSS.

const CELL_SIZE = 20; // pixels
const WIDTH = 24; // number of cells horizontally
const HEIGHT = 18; // number of cells vertically
const INITIAL_SNAKE = [ { x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 } ];
const INITIAL_DIRECTION = { x: 1, y: 0 };

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [apple, setApple] = useState(randomApple(INITIAL_SNAKE));
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(8); // frames per second
  const lastMoveRef = useRef(0);
  const dirRef = useRef(direction);
  const snakeRef = useRef(snake);
  const runningRef = useRef(running);

  // Keep refs in sync for use inside the animation loop
  useEffect(() => { dirRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    const handleKey = (e) => {
      // Arrow keys and WASD
      const key = e.key;
      let newDir = dirRef.current;
      if ((key === "ArrowUp" || key === "w") && dirRef.current.y !== 1) newDir = { x: 0, y: -1 };
      if ((key === "ArrowDown" || key === "s") && dirRef.current.y !== -1) newDir = { x: 0, y: 1 };
      if ((key === "ArrowLeft" || key === "a") && dirRef.current.x !== 1) newDir = { x: -1, y: 0 };
      if ((key === "ArrowRight" || key === "d") && dirRef.current.x !== -1) newDir = { x: 1, y: 0 };
      setDirection(newDir);
      // space to pause/resume
      if (key === " ") setRunning(r => !r);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    let rafId;
    const step = (timestamp) => {
      if (!lastMoveRef.current) lastMoveRef.current = timestamp;
      const msPerFrame = 1000 / speed;
      if (runningRef.current && timestamp - lastMoveRef.current >= msPerFrame) {
        moveSnake();
        lastMoveRef.current = timestamp;
      }
      draw();
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  function moveSnake() {
    const cur = snakeRef.current;
    const dir = dirRef.current;
    const head = { x: cur[0].x + dir.x, y: cur[0].y + dir.y };

    // wrap-around behavior
    head.x = (head.x + WIDTH) % WIDTH;
    head.y = (head.y + HEIGHT) % HEIGHT;

    // check collision with self
    for (let i = 0; i < cur.length; i++) {
      if (cur[i].x === head.x && cur[i].y === head.y) {
        // game over
        setRunning(false);
        return;
      }
    }

    const ateApple = head.x === apple.x && head.y === apple.y;
    const newSnake = [head, ...cur];
    if (!ateApple) newSnake.pop();

    setSnake(newSnake);

    if (ateApple) {
      setScore(s => s + 1);
      // increase speed slightly every few apples
      setSpeed(s => Math.min(20, s + (score % 3 === 2 ? 1 : 0)));
      setApple(randomApple(newSnake));
    }
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // high-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * CELL_SIZE * dpr;
    canvas.height = HEIGHT * CELL_SIZE * dpr;
    canvas.style.width = `${WIDTH * CELL_SIZE}px`;
    canvas.style.height = `${HEIGHT * CELL_SIZE}px`;
    ctx.scale(dpr, dpr);

    // background
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // grid (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // apple
    ctx.fillStyle = "#ef4444"; // red-500
    drawCell(ctx, apple.x, apple.y);

    // snake
    for (let i = 0; i < snake.length; i++) {
      const p = snake[i];
      // head darker
      ctx.fillStyle = i === 0 ? "#10b981" : "#34d399"; // green shades
      drawCell(ctx, p.x, p.y, i === 0);
    }
  }

  function drawCell(ctx, x, y, rounded = false) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const pad = 2;
    const w = CELL_SIZE - pad * 2;
    const h = CELL_SIZE - pad * 2;
    if (rounded) {
      const r = 4;
      roundRect(ctx, px + pad, py + pad, w, h, r, true, false);
    } else {
      ctx.fillRect(px + pad, py + pad, w, h);
    }
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === "number") radius = { tl: radius, tr: radius, br: radius, bl: radius };
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function resetGame() {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setApple(randomApple(INITIAL_SNAKE));
    setRunning(false);
    setScore(0);
    setSpeed(8);
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-800 p-6">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">React Snake</h1>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-md" />
            <div className="text-sm mt-2 text-slate-300">Use arrow keys or WASD to move. Space to pause.</div>
          </div>
          <div className="w-40">
            <div className="mb-3">
              <div className="text-sm text-slate-400">Score</div>
              <div className="text-3xl font-mono">{score}</div>
            </div>
            <div className="mb-3">
              <div className="text-sm text-slate-400">Speed</div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={4}
                  max={20}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                />
                <div className="w-8 text-right">{speed}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="px-3 py-2 rounded bg-emerald-500 text-white font-semibold"
                onClick={() => setRunning(true)}
              >
                Start
              </button>
              <button
                className="px-3 py-2 rounded bg-yellow-500 text-white font-semibold"
                onClick={() => setRunning(r => !r)}
              >
                {running ? "Pause" : "Resume"}
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600 text-white font-semibold"
                onClick={resetGame}
              >
                Reset
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Built with React + Canvas. Tailwind classes used for layout — remove or replace if you don't use Tailwind.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function randomApple(snake) {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  let x, y;
  do {
    x = Math.floor(Math.random() * WIDTH);
    y = Math.floor(Math.random() * HEIGHT);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}
