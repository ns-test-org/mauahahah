'use client';

import { useEffect, useState, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

type ShapeType = keyof typeof SHAPES;

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  type: ShapeType;
}

export default function TetrisGame() {
  const [board, setBoard] = useState<(ShapeType | null)[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const createNewPiece = useCallback((): Piece => {
    const types = Object.keys(SHAPES) as ShapeType[];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: SHAPES[type],
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[type][0].length / 2),
      y: 0,
      type
    };
  }, []);

  const checkCollision = useCallback((piece: Piece, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }
    
    // Clear completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      setScore(prev => prev + linesCleared * 100);
    }
    
    setBoard(newBoard);
    
    const newPiece = createNewPiece();
    if (checkCollision(newPiece)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, createNewPiece, checkCollision]);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    if (!checkCollision(currentPiece, dx, dy)) {
      setCurrentPiece({
        ...currentPiece,
        x: currentPiece.x + dx,
        y: currentPiece.y + dy
      });
    } else if (dy > 0) {
      mergePiece();
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, mergePiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotated };
    
    if (!checkCollision(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, newY - currentPiece.y + 1)) {
      newY++;
    }
    
    setCurrentPiece({ ...currentPiece, y: newY });
    setTimeout(mergePiece, 50);
  }, [currentPiece, gameOver, isPaused, checkCollision, mergePiece]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createNewPiece());
    }
  }, [currentPiece, gameOver, createNewPiece]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [movePiece, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          dropPiece();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePiece, dropPiece, gameOver]);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(null);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl animate-pulse top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl animate-pulse bottom-0 right-0 translate-x-1/2 translate-y-1/2" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl animate-pulse top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{animationDelay: '4s'}}></div>
        <div className="absolute w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-3xl animate-pulse top-1/4 right-1/4" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse bottom-1/4 left-1/4" style={{animationDelay: '3s'}}></div>
      </div>
      
      <div className="text-center relative z-10">
        <h1 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl">TETRIS</h1>
        
        <div className="flex gap-8 items-start justify-center flex-wrap">
          <div className="bg-black/60 p-6 rounded-xl backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_80px_rgba(139,92,246,0.4)]">
            <div 
              className="grid gap-[1px] bg-gray-800 p-1 rounded-lg shadow-[0_0_60px_rgba(139,92,246,0.6),inset_0_0_30px_rgba(0,0,0,0.5)]"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`
              }}
            >
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="border border-gray-700"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cell ? COLORS[cell] : '#1a1a2e'
                    }}
                  />
                ))
              )}
            </div>
          </div>
          
          <div className="text-white space-y-6">
            <div className="bg-black/60 p-6 rounded-xl backdrop-blur-md min-w-[200px] shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <h2 className="text-2xl font-bold mb-2">Score</h2>
              <p className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">{score}</p>
            </div>
            
            <div className="bg-black/60 p-6 rounded-xl backdrop-blur-md text-left text-sm shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <h3 className="font-bold mb-3 text-lg">Controls</h3>
              <div className="space-y-2">
                <p>← → Move</p>
                <p>↑ Rotate</p>
                <p>↓ Soft Drop</p>
                <p>Space Hard Drop</p>
                <p>P Pause</p>
              </div>
            </div>
            
            {(gameOver || isPaused) && (
              <div className="bg-black/60 p-6 rounded-xl backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                <h2 className="text-2xl font-bold mb-4 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]">
                  {gameOver ? 'Game Over!' : 'Paused'}
                </h2>
                {gameOver && (
                  <button
                    onClick={resetGame}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-[0_5px_20px_rgba(37,99,235,0.5)] hover:shadow-[0_5px_30px_rgba(37,99,235,0.7)]"
                  >
                    Play Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}









