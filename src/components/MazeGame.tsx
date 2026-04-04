import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateShapedMaze, findShortestPath, getShapeName } from '../utils/mazeGenerator';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Play, Gem, Clock, Settings, ArrowRight, SkipForward, Map, Eye, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

const CONCEPTS = [
  { id: 1, name: '공룡', emoji: '🦖', color: 'bg-green-100', wall: 'bg-green-800', path: 'bg-green-50' },
  { id: 2, name: '자동차', emoji: '🚗', color: 'bg-blue-100', wall: 'bg-blue-800', path: 'bg-blue-50' },
  { id: 3, name: '건물', emoji: '🏢', color: 'bg-gray-100', wall: 'bg-gray-800', path: 'bg-gray-50' },
  { id: 4, name: '음식', emoji: '🍔', color: 'bg-yellow-100', wall: 'bg-yellow-800', path: 'bg-yellow-50' },
  { id: 5, name: '사물', emoji: '📦', color: 'bg-orange-100', wall: 'bg-orange-800', path: 'bg-orange-50' },
  { id: 6, name: '동물', emoji: '🐶', color: 'bg-amber-100', wall: 'bg-amber-800', path: 'bg-amber-50' },
  { id: 7, name: '우주', emoji: '🚀', color: 'bg-indigo-100', wall: 'bg-indigo-800', path: 'bg-indigo-50' },
  { id: 8, name: '바다', emoji: '🌊', color: 'bg-cyan-100', wall: 'bg-cyan-800', path: 'bg-cyan-50' },
  { id: 9, name: '식물', emoji: '🌿', color: 'bg-emerald-100', wall: 'bg-emerald-800', path: 'bg-emerald-50' },
  { id: 10, name: '마법', emoji: '✨', color: 'bg-purple-100', wall: 'bg-purple-800', path: 'bg-purple-50' },
];

export default function MazeGame() {
  const [gameState, setGameState] = useState<'menu' | 'concept_select' | 'level_select' | 'playing' | 'cleared' | 'concept_cleared'>('menu');
  const [unlockedConcepts, setUnlockedConcepts] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<Record<number, number>>({ 1: 1 });
  const [currentConcept, setCurrentConcept] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gems, setGems] = useState(5);
  const [maze, setMaze] = useState<number[][]>([]);
  
  const [playerPosState, _setPlayerPos] = useState({ x: 1, y: 1 });
  const playerPosRef = useRef({ x: 1, y: 1 });
  const setPlayerPos = useCallback((pos: {x: number, y: number}) => {
    playerPosRef.current = pos;
    _setPlayerPos(pos);
  }, []);
  const playerPos = playerPosState;

  const [endPos, setEndPos] = useState({ x: 1, y: 1 });
  const [timer, setTimer] = useState(0);
  const [conceptTimes, setConceptTimes] = useState<number[]>([]);
  const [hintPath, setHintPath] = useState<string[]>([]);
  const [canJumpWall, setCanJumpWall] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPreAdModal, setShowPreAdModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(30);

  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const dragStartPosRef = useRef<{x: number, y: number} | null>(null);

  const concept = CONCEPTS.find(c => c.id === currentConcept) || CONCEPTS[0];

  const initLevel = useCallback((conceptId = currentConcept, level = currentLevel) => {
    const { maze: newMaze, startPos, endPos: newEndPos } = generateShapedMaze(conceptId, level);
    setMaze(newMaze);
    setPlayerPos(startPos);
    setEndPos(newEndPos);
    setTimer(0);
    setHintPath([]);
    setCanJumpWall(false);
    setGameState('playing');
  }, [currentConcept, currentLevel, setPlayerPos]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const playSound = (type: 'move' | 'clear' | 'item') => {
    if (!soundEnabled) return;
  };

  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const nx = playerPosRef.current.x + dx;
    const ny = playerPosRef.current.y + dy;

    if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length) {
      if (maze[ny][nx] === 0 || canJumpWall) {
        if (maze[ny][nx] === 1 && canJumpWall) {
          const newMaze = [...maze];
          newMaze[ny] = [...newMaze[ny]];
          newMaze[ny][nx] = 0;
          setMaze(newMaze);
          setCanJumpWall(false);
        }
        
        setPlayerPos({ x: nx, y: ny });
        playSound('move');

        if (nx === endPos.x && ny === endPos.y) {
          handleLevelClear();
        }
      }
    }
  }, [gameState, maze, canJumpWall, endPos, setPlayerPos]);

  const handleBallPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDraggingBall(true);
  }, []);

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!dragStartPosRef.current) return;
    let dx = e.clientX - dragStartPosRef.current.x;
    let dy = e.clientY - dragStartPosRef.current.y;
    
    const threshold = 25; 
    
    while (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(Math.sign(dx), 0);
        dragStartPosRef.current.x += Math.sign(dx) * threshold;
      } else {
        handleMove(0, Math.sign(dy));
        dragStartPosRef.current.y += Math.sign(dy) * threshold;
      }
      dx = e.clientX - dragStartPosRef.current.x;
      dy = e.clientY - dragStartPosRef.current.y;
    }
  }, [handleMove]);

  const handleGlobalPointerUp = useCallback(() => {
    dragStartPosRef.current = null;
    setIsDraggingBall(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handleMove(0, -1);
      if (e.key === 'ArrowDown') handleMove(0, 1);
      if (e.key === 'ArrowLeft') handleMove(-1, 0);
      if (e.key === 'ArrowRight') handleMove(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const handleLevelClear = () => {
    playSound('clear');
    const newTimes = [...conceptTimes, timer];
    setConceptTimes(newTimes);

    if (Math.random() < 0.2) {
      setGems((prev) => prev + 1);
    }

    if (currentLevel >= 20) {
      if (currentConcept === unlockedConcepts) {
        setUnlockedConcepts(prev => prev + 1);
      }
      setGameState('concept_cleared');
    } else {
      setUnlockedLevels(prev => ({
        ...prev,
        [currentConcept]: Math.max(prev[currentConcept] || 1, currentLevel + 1)
      }));
      setGameState('cleared');
    }
  };

  const nextLevel = () => {
    setCurrentLevel((prev) => prev + 1);
    initLevel(currentConcept, currentLevel + 1);
  };

  const nextConcept = () => {
    const nextId = currentConcept + 1;
    setCurrentConcept(nextId);
    setCurrentLevel(1);
    setConceptTimes([]);
    initLevel(nextId, 1);
  };

  const handleBack = () => {
    if (gameState === 'playing') setGameState('level_select');
    if (gameState === 'level_select') setGameState('concept_select');
    if (gameState === 'concept_select') setGameState('menu');
  };

  const useItemShowPath = () => {
    if (gameState !== 'playing') return;
    if (gems >= 1) {
      setGems(gems - 1);
      playSound('item');
      const path = findShortestPath(maze, playerPos.x, playerPos.y, endPos.x, endPos.y);
      const pathStrings = path.map(([x, y]) => `${x},${y}`);
      setHintPath(pathStrings);
      setTimeout(() => setHintPath([]), 3000);
    } else {
      triggerAd();
    }
  };

  const useItemMoveCloser = () => {
    if (gameState !== 'playing') return;
    if (gems >= 1) {
      setGems(gems - 1);
      playSound('item');
      const path = findShortestPath(maze, playerPos.x, playerPos.y, endPos.x, endPos.y);
      if (path.length > 2) {
        const randomIndex = Math.floor(Math.random() * (path.length - 1)) + 1;
        const [nx, ny] = path[randomIndex];
        setPlayerPos({ x: nx, y: ny });
        if (nx === endPos.x && ny === endPos.y) {
          handleLevelClear();
        }
      } else {
        setPlayerPos({ x: endPos.x, y: endPos.y });
        handleLevelClear();
      }
    } else {
      triggerAd();
    }
  };

  const useItemJumpWall = () => {
    if (gameState !== 'playing') return;
    if (gems >= 2) {
      setGems(gems - 2);
      playSound('item');
      setCanJumpWall(true);
    } else {
      triggerAd();
    }
  };

  const useItemClearMap = () => {
    if (gameState !== 'playing') return;
    if (gems >= 3) {
      setGems(gems - 3);
      playSound('item');
      setPlayerPos({ x: endPos.x, y: endPos.y });
      handleLevelClear();
    } else {
      triggerAd();
    }
  };

  const triggerAd = () => {
    setShowPreAdModal(true);
  };

  const confirmWatchAd = () => {
    setShowPreAdModal(false);
    setShowAdModal(true);
    setAdTimer(3);
    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeAd = () => {
    setShowAdModal(false);
    const rand = Math.random();
    let reward = 1;
    if (rand > 0.98) reward = 3;
    else if (rand > 0.90) reward = 2;
    setGems(gems + reward);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-amber-50 text-gray-900'}`}>
      <header className="p-4 flex justify-between items-center shadow-sm bg-opacity-50 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-xl">
          {(gameState === 'playing' || gameState === 'concept_select' || gameState === 'level_select') && (
            <button onClick={handleBack} className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {gameState === 'playing' ? (
            <span className="whitespace-nowrap truncate text-base sm:text-xl">{concept.emoji} {concept.name} 미로</span>
          ) : (
            <span className="whitespace-nowrap truncate text-base sm:text-xl">미로찾기 대모험</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full font-semibold">
            <Gem className="w-4 h-4 text-blue-500" />
            <span>{gems}</span>
            <button onClick={triggerAd} className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full hover:bg-blue-600 transition-colors">+</button>
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {gameState === 'menu' && (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-extrabold mb-2">미로찾기 대모험</h1>
            <p className="text-lg opacity-80">다양한 테마의 미로를 탐험하세요!</p>
            <button 
              onClick={() => setGameState('concept_select')}
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-blue-700 transition transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Play className="w-6 h-6" /> 게임 시작
            </button>
          </div>
        )}

        {gameState === 'concept_select' && (
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">컨셉 선택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {CONCEPTS.map(c => {
                const isUnlocked = c.id <= unlockedConcepts;
                return (
                  <button 
                    key={c.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setCurrentConcept(c.id);
                        setGameState('level_select');
                      }
                    }}
                    className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                      isUnlocked 
                        ? `${c.color} hover:scale-105 shadow-md cursor-pointer` 
                        : 'bg-gray-200 dark:bg-gray-800 opacity-60 cursor-not-allowed grayscale'
                    }`}
                  >
                    <span className="text-4xl">{isUnlocked ? c.emoji : '🔒'}</span>
                    <span className={`font-bold ${isUnlocked ? 'text-gray-900' : ''}`}>{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {gameState === 'level_select' && (
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">{concept.emoji} {concept.name} - 단계 선택</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
                const isUnlocked = level <= (unlockedLevels[currentConcept] || 1);
                return (
                  <button 
                    key={level}
                    onClick={() => {
                      if (isUnlocked) {
                        setCurrentLevel(level);
                        setConceptTimes([]);
                        initLevel(currentConcept, level);
                      }
                    }}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all ${
                      isUnlocked 
                        ? `${concept.color} hover:scale-105 shadow-md cursor-pointer text-gray-900` 
                        : 'bg-gray-200 dark:bg-gray-800 opacity-60 cursor-not-allowed text-gray-500'
                    }`}
                  >
                    {isUnlocked ? level : '🔒'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 px-4">
              <div className="font-bold text-lg">Level {currentLevel}</div>
              <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {concept.name} - {getShapeName(currentConcept, currentLevel)}
              </div>
              <div className="flex items-center gap-1 font-mono text-lg">
                <Clock className="w-5 h-5" />
                {formatTime(timer)}
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full h-[55vh] min-h-[400px]`}>
              <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={8}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                panning={{ disabled: isDraggingBall }}
              >
                <TransformComponent 
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%' }}
                >
                  <div 
                    className="p-2 sm:p-4 mx-auto"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${maze[0]?.length || 1}, minmax(0, 1fr))`,
                      width: '100%',
                      maxWidth: '800px',
                    }}
                  >
                    {maze.map((row, y) => (
                      row.map((cell, x) => {
                        const isWall = cell === 1;
                        const isEmpty = cell === -1;
                        const isPlayer = playerPos.x === x && playerPos.y === y;
                        const isEnd = endPos.x === x && endPos.y === y;
                        const isHint = hintPath.includes(`${x},${y}`);

                        if (isEmpty) {
                          return <div key={`${x}-${y}`} className="bg-transparent aspect-square" />;
                        }

                        return (
                          <div 
                            key={`${x}-${y}`} 
                            className={`
                              ${isWall ? concept.wall : concept.path}
                              ${isHint ? 'bg-yellow-300 opacity-50' : ''}
                              relative flex items-center justify-center aspect-square
                            `}
                          >
                            {isPlayer && (
                              <div 
                                onPointerDown={handleBallPointerDown}
                                className="absolute w-[300%] h-[300%] flex items-center justify-center z-20 cursor-grab active:cursor-grabbing"
                                style={{ touchAction: 'none' }}
                              >
                                <div className={`w-[35%] h-[35%] bg-red-500 rounded-full shadow-lg transition-all duration-150 ${isDraggingBall ? 'scale-125' : ''}`} />
                              </div>
                            )}
                            {isEnd && (
                              <div className="absolute w-full h-full flex items-center justify-center text-xl z-0">
                                🏁
                              </div>
                            )}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </div>

            <div className="w-full grid grid-cols-4 gap-2 mt-6">
              <button onClick={useItemShowPath} className="flex flex-col items-center p-2 bg-white/10 rounded-lg active:bg-white/20 transition-colors">
                <Eye className="w-6 h-6 mb-1 text-purple-500" />
                <span className="text-xs text-center">길 3초 표시<br/>(💎1)</span>
              </button>
              <button onClick={useItemMoveCloser} className="flex flex-col items-center p-2 bg-white/10 rounded-lg active:bg-white/20 transition-colors">
                <Map className="w-6 h-6 mb-1 text-blue-500" />
                <span className="text-xs text-center">도착길 순간이동<br/>(💎1)</span>
              </button>
              <button onClick={useItemJumpWall} className={`flex flex-col items-center p-2 rounded-lg active:bg-white/20 transition-colors ${canJumpWall ? 'bg-green-500/30' : 'bg-white/10'}`}>
                <SkipForward className="w-6 h-6 mb-1 text-green-500" />
                <span className="text-xs text-center">벽 부수기<br/>(💎2)</span>
              </button>
              <button onClick={useItemClearMap} className="flex flex-col items-center p-2 bg-white/10 rounded-lg active:bg-white/20 transition-colors">
                <ArrowRight className="w-6 h-6 mb-1 text-red-500" />
                <span className="text-xs text-center">즉시 클리어<br/>(💎3)</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'cleared' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`p-8 rounded-2xl text-center max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-3xl font-bold mb-2 text-green-500">클리어!</h2>
              <p className="text-xl mb-6">소요 시간: {formatTime(timer)}</p>
              <button 
                onClick={nextLevel}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                다음 단계로
              </button>
            </div>
          </div>
        )}

        {gameState === 'concept_cleared' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`p-8 rounded-2xl text-center max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="text-6xl mb-4">{concept.emoji}</div>
              <h2 className="text-3xl font-bold mb-2 text-yellow-500">컨셉 완료!</h2>
              <p className="mb-2">{concept.name} 테마의 20단계를 모두 클리어했습니다.</p>
              <p className="text-xl font-bold mb-6">총 소요 시간: {formatTime(conceptTimes.reduce((a, b) => a + b, 0))}</p>
              <button 
                onClick={nextConcept}
                className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors"
              >
                다음 컨셉으로
              </button>
            </div>
          </div>
        )}

        {showPreAdModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`p-8 rounded-2xl text-center max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-4">보석이 부족합니다!</h2>
              <p className="mb-6">광고를 시청하고 보석을 획득하시겠습니까?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowPreAdModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl font-bold hover:opacity-80 transition-opacity"
                >
                  취소
                </button>
                <button 
                  onClick={confirmWatchAd}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex flex-col items-center justify-center leading-tight"
                >
                  <span>광고보기</span>
                  <span className="text-xs font-normal opacity-90 mt-0.5">(1개~3개)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdModal && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
            <div className="text-2xl mb-8">광고 시청 중...</div>
            <div className="text-6xl font-bold mb-8">{adTimer}</div>
            {adTimer === 0 ? (
              <button 
                onClick={closeAd}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-green-600 transition-colors"
              >
                보상 받기 (랜덤 받기)
              </button>
            ) : (
              <div className="opacity-50">광고를 끝까지 시청해주세요.</div>
            )}
          </div>
        )}
      </main>

      <div className="h-14 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 border-t border-gray-300 dark:border-gray-700">
        Google AdMob Banner Placeholder (320x50)
      </div>
    </div>
  );
}
