/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Loader from "./components/Loader";
import FloatingStars from "./components/FloatingStars";

interface AnimatingCard {
  id: number;
  originalRect: DOMRect;
  side: "left" | "right";
  gridIndex: number;
}

interface CardData {
  id: number;
  outletName: string;
  bpName: string;
  imageUrl: string;
  isNew?: boolean;
}

export default function AnimatedCardsPage() {
  // Configurable fetch interval (in minutes)
  const FETCH_INTERVAL_MINUTES = 2;
  const FETCH_INTERVAL_MS = FETCH_INTERVAL_MINUTES * 60 * 1000;

  const [animatingCard, setAnimatingCard] = useState<AnimatingCard | null>(
    null
  );
  const [showText, setShowText] = useState(false);
  const [lastAnimatedIndex, setLastAnimatedIndex] = useState<number | null>(
    null
  );
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [data, setData] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilFetch, setTimeUntilFetch] = useState(0);

  const fetchPhotoLoop = async (isInitial = false) => {
    if (!isInitial) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        "https://dmart-backend-qhdt.onrender.com/api/photo-loop"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Extract only outletName, bpName, and imageUrl from each item
      const newData: CardData[] = result.data.map(
        (item: any, index: number) => ({
          id: index,
          outletName: item.outletName,
          bpName: item.bpName,
          imageUrl: item.imageUrl,
        })
      );

      setData((prevData) => {
        if (isInitial) {
          return newData;
        }

        // Compare with previous data to find new items
        const prevIds = new Set(
          prevData.map((item) => `${item.outletName}-${item.bpName}`)
        );
        const updatedData = newData.map((item) => ({
          ...item,
          isNew: !prevIds.has(`${item.outletName}-${item.bpName}`),
        }));

        // Remove 'isNew' flag after animation
        setTimeout(() => {
          setData((prev) => prev.map((item) => ({ ...item, isNew: false })));
        }, 2000);

        return updatedData;
      });

      // Reset countdown
      setTimeUntilFetch(FETCH_INTERVAL_MS);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPhotoLoop(true);
  }, []);

  // Set up fetch interval and countdown
  useEffect(() => {
    const fetchInterval = setInterval(() => {
      fetchPhotoLoop();
    }, FETCH_INTERVAL_MS);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setTimeUntilFetch((prev) => {
        if (prev <= 1000) {
          return FETCH_INTERVAL_MS;
        }
        return prev - 1000;
      });
    }, 1000);

    // Initialize countdown
    setTimeUntilFetch(FETCH_INTERVAL_MS);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(countdownInterval);
    };
  }, [FETCH_INTERVAL_MS]);

  const selectRandomCard = () => {
    if (animatingCard || !data.length) return;

    let randomIndex;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    // If we have more than 1 card, ensure we don't pick the same card as last time
    if (data.length > 1 && lastAnimatedIndex !== null) {
      do {
        randomIndex = Math.floor(Math.random() * data.length);
        attempts++;
      } while (randomIndex === lastAnimatedIndex && attempts < maxAttempts);
    } else {
      randomIndex = Math.floor(Math.random() * data.length);
    }

    const cardElement = cardRefs.current[randomIndex];

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      const leftGridSize = Math.ceil(data.length / 2);
      const side = randomIndex < leftGridSize ? "left" : "right";
      const gridIndex = randomIndex % leftGridSize;

      setAnimatingCard({
        id: randomIndex,
        originalRect: rect,
        side,
        gridIndex,
      });

      // Store the current index as the last animated
      setLastAnimatedIndex(randomIndex);

      setTimeout(() => setShowText(true), 800);
      setTimeout(() => setShowText(false), 2700);
      setTimeout(() => {
        setAnimatingCard(null);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!data.length) return;

    const initialTimer = setTimeout(selectRandomCard, 1000);
    const interval = setInterval(selectRandomCard, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [data, animatingCard]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading || !data.length)
    return (
      <div className="min-h-screen bg-black justify-center text-white flex flex-col items-center">
        <>
          <FloatingStars starCount={100} animationSpeed={1} />
          {/* Blur shadow blob */}
          <div className="w-[45rem] h-52 bg-white/20 rounded-full blur-3xl absolute z-10"></div>
          {/* Background image */}
          <div className="w-full h-screen absolute inset-0 z-0">
            <img
              src="/images/background-2.png"
              alt="background image"
              className="w-full h-full object-fill object-center"
            />
          </div>
          {/* Golden frame */}
          <div className="w-full h-screen absolute inset-0 z-10">
            <img
              src="/images/golden-frame.png"
              alt="golden-frame"
              className="w-full h-full object-fill"
            />
          </div>
        </>
        <Loader />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center">
          <div className="border-b-2 mt-4 mb-4"></div>
          Loading...
        </motion.div>
      </div>
    );

  if (error && !data.length)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          Error: {error}
        </motion.div>
      </div>
    );

  const leftGridSize = Math.ceil(data.length / 2);
  const leftCards = data.slice(0, leftGridSize);
  const rightCards = data.slice(leftGridSize);

  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <>
        <FloatingStars starCount={100} animationSpeed={1} />
        {/* Blur shadow blob */}
        <div className="w-[45rem] h-52 bg-white/20 rounded-full blur-3xl absolute z-10"></div>
        {/* Background image */}
        <div className="w-full h-screen absolute inset-0 z-0">
          <img
            src="/images/background-2.png"
            alt="background image"
            className="w-full h-full object-fill object-center"
          />
        </div>
        {/* Golden frame */}
        <div className="w-full h-screen absolute inset-0 z-10">
          <img
            src="/images/golden-frame.png"
            alt="golden-frame"
            className="w-full h-full object-fill"
          />
        </div>
      </>
      {/* Fetch Status Box */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50 bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg backdrop-blur-sm border border-gray-700">
        <div className="flex items-center space-x-2 text-sm">
          {loading ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Next fetch in {formatTime(timeUntilFetch)}</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Left Grid */}
      <div className="fixed left-28 top-1/2 -translate-y-1/2 z-10">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {leftCards.map((card, index) => (
              <motion.div
                key={`${card.outletName}-${card.bpName}`}
                ref={(el) => (cardRefs.current[index] = el)}
                initial={
                  card.isNew ? { scale: 0, opacity: 0, rotate: 180 } : false
                }
                animate={{
                  // scale: animatingCard?.id === index ? 0 : 1,
                  opacity: animatingCard?.id === index ? 0 : 1,
                  rotate: 0,
                }}
                transition={{
                  duration: card.isNew ? 0.6 : 0.5,
                  type: "spring",
                  bounce: 0.3,
                }}
                className={cn(
                  "w-28 h-28 rounded-lg overflow-hidden shadow-lg",
                  "hover:shadow-xl hover:scale-105 transition-transform duration-200",
                  card.isNew && "ring-2 ring-yellow-400 ring-opacity-75"
                )}>
                <img
                  src={card.imageUrl || "/placeholder.svg"}
                  alt={card.outletName || `Card ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {card.isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    !
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen relative">
        {animatingCard && (
          <div
            className="fixed z-50 rounded-lg overflow-hidden shadow-2xl"
            style={{
              left: animatingCard.originalRect.left,
              top: animatingCard.originalRect.top,
              width: animatingCard.originalRect.width,
              height: animatingCard.originalRect.height,
              animation:
                "cardToCenter 0.8s ease-out forwards, centerToCard 0.8s ease-in 2.7s forwards",
            }}>
            <img
              src={data[animatingCard.id]?.imageUrl || "/placeholder.svg"}
              alt={
                data[animatingCard.id]?.outletName ||
                `Animating Card ${animatingCard.id + 1}`
              }
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <AnimatePresence>
          {animatingCard && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{
                opacity: showText ? 1 : 0,
                y: showText ? 0 : 30,
                scale: showText ? 1 : 0.9,
              }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center absolute bottom-32 left-1/2 -translate-x-1/2 text-white p-4 rounded-lg backdrop-blur-sm">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showText ? 1 : 0,
                  y: showText ? 0 : 20,
                }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl font-semibold mb-2">
                {data[animatingCard.id]?.outletName}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showText ? 1 : 0,
                  y: showText ? 0 : 20,
                }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-xl text-gray-300">
                {data[animatingCard.id]?.bpName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white text-center space-y-8 px-8">
          <h1 className="text-4xl font-bold">Animated Card Gallery</h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Watch as cards automatically animate from the side grids to the
            center. Displaying {data.length} outlets from the photo loop.
            <br />
            <span className="text-sm text-gray-400">
              Auto-refreshes every {FETCH_INTERVAL_MINUTES} minutes
            </span>
          </p>
        </motion.div>
      </div>

      {/* Right Grid */}
      <div className="fixed right-28 top-1/2 -translate-y-1/2 z-10">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {rightCards.map((card, index) => (
              <motion.div
                key={`${card.outletName}-${card.bpName}`}
                ref={(el) => (cardRefs.current[index + leftGridSize] = el)}
                initial={
                  card.isNew ? { scale: 0, opacity: 0, rotate: -180 } : false
                }
                animate={{
                  // scale: animatingCard?.id === index + leftGridSize ? 0 : 1,
                  opacity: animatingCard?.id === index + leftGridSize ? 0 : 1,
                  rotate: 0,
                }}
                transition={{
                  duration: card.isNew ? 0.6 : 0.5,
                  type: "spring",
                  bounce: 0.3,
                }}
                className={cn(
                  "w-28 h-28 rounded-lg overflow-hidden shadow-lg transition-all ",
                  "hover:shadow-xl hover:scale-105 transition-transform duration-200",
                  card.isNew && "ring-2 ring-yellow-400 ring-opacity-75"
                )}>
                <img
                  src={card.imageUrl || "/placeholder.svg"}
                  alt={card.outletName || `Card ${index + leftGridSize + 1}`}
                  className="w-full h-full object-cover"
                />
                {card.isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    !
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardToCenter {
          to {
            left: 50%;
            top: 45%;
            transform: translate(-50%, -50%) scale(3);
            width: 160px;
            height: 160px;
          }
        }

        @keyframes centerToCard {
          from {
            left: 50%;
            top: 45%;
            transform: translate(-50%, -50%) scale(3);
            width: 160px;
            height: 160px;
          }
          to {
            left: ${animatingCard?.originalRect.left}px;
            top: ${animatingCard?.originalRect.top}px;
            transform: translate(0, 0) scale(1);
            width: ${animatingCard?.originalRect.width}px;
            height: ${animatingCard?.originalRect.height}px;
          }
        }
      `}</style>
    </div>
  );
}
