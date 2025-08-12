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
  retailerName: string;
  imageUrl: string;
  isNew?: boolean;
}

export default function AnimatedCardsPage() {
  const FETCH_INTERVAL_MINUTES = 0.5;
  const FETCH_INTERVAL_MS = FETCH_INTERVAL_MINUTES * 60 * 1000;

  const [pendingData, setPendingData] = useState<CardData[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    console.log("Animation state changed:", isAnimating);
  }, [isAnimating]);
  const [animatingCard, setAnimatingCard] = useState<AnimatingCard | null>(
    null
  );
  const [showText, setShowText] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0); // Changed from lastAnimatedIndex
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [data, setData] = useState<CardData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilFetch, setTimeUntilFetch] = useState(0);
  const [animationsPaused, setAnimationsPaused] = useState(false);

  const fetchPhotoLoop = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsFetching(true);
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

      // Get the last 20 items (most recent) and reverse them so newest are first
      const totalItems = result.data.length;
      const startIndex = Math.max(0, totalItems - 20);

      const newData: CardData[] = result.data
        .slice(startIndex)
        .reverse() // Add this line to reverse the order
        .map(
          (
            item: {
              outletName: string;
              retailerName: string;
              imageUrl: string;
            },
            index: number
          ) => ({
            id: index, // Proper index assignment
            outletName: item.outletName,
            retailerName: item.retailerName,
            imageUrl: item.imageUrl,
          })
        );

      setData((prevData) => {
        if (isInitial) {
          return newData;
        }

        const prevIds = new Set(
          prevData.map((item) => `${item.outletName}-${item.retailerName}`)
        );
        const newItems = newData.filter(
          (item) => !prevIds.has(`${item.outletName}-${item.retailerName}`)
        );

        if (newItems.length === 0) {
          return prevData;
        }

        const markedNewItems = newItems.map((item) => ({
          ...item,
          isNew: true,
        }));

        let updatedData = [...markedNewItems, ...prevData]; // Add new items to FRONT
        if (updatedData.length > 20) {
          updatedData = updatedData.slice(0, 20); // Remove from END (keep first 20)
        }
        updatedData = updatedData.map((item, index) => ({
          ...item,
          id: index,
        }));

        setPendingData(updatedData);
        return prevData;
      });

      setTimeUntilFetch(FETCH_INTERVAL_MS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (isInitial) {
        setTimeout(() => {
          setInitialLoading(false);
          // Resume animations after initial load
          setTimeout(() => {
            setAnimationsPaused(false);
          }, 500); // Small delay to ensure refs are updated
        }, 2000);
      } else {
        setTimeout(() => {
          setIsFetching(false);
          // Resume animations after background fetch
          setTimeout(() => {
            setAnimationsPaused(false);
          }, 500); // Small delay to ensure refs are updated
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (pendingData && !isAnimating) {
      setData(pendingData);
      setPendingData(null);

      // Adjust currentCardIndex if it's out of bounds with new data
      setCurrentCardIndex((prev) => {
        if (prev >= pendingData.length) {
          return prev % pendingData.length; // Wrap around if index is too high
        }
        return prev; // Keep current index if it's still valid
      });
    }
  }, [pendingData, isAnimating]);

  useEffect(() => {
    fetchPhotoLoop(true);
  }, []);

  useEffect(() => {
    const fetchInterval = setInterval(() => {
      fetchPhotoLoop();
    }, FETCH_INTERVAL_MS);

    const countdownInterval = setInterval(() => {
      setTimeUntilFetch((prev) => {
        if (prev <= 1000) {
          return FETCH_INTERVAL_MS;
        }
        return prev - 1000;
      });
    }, 1000);

    setTimeUntilFetch(FETCH_INTERVAL_MS);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(countdownInterval);
    };
  }, [FETCH_INTERVAL_MS]);

  // Modified function to select cards in order
  const selectNextCard = () => {
    // Don't run animations if paused, no data, or already animating
    if (animationsPaused || isAnimating || !data.length) return;

    const cardElement = cardRefs.current[currentCardIndex];

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      const leftGridSize = Math.ceil(data.length / 2);
      const side = currentCardIndex < leftGridSize ? "left" : "right";
      const gridIndex = currentCardIndex % leftGridSize;

      setAnimatingCard({
        id: currentCardIndex,
        originalRect: rect,
        side,
        gridIndex,
      });
      setIsAnimating(true);

      // Move to next card, loop back to 0 when reaching the end
      setCurrentCardIndex((prev) => (prev + 1) % data.length);

      setTimeout(() => setShowText(true), 800);
      setTimeout(() => setShowText(false), 2700);
      setTimeout(() => {
        setAnimatingCard(null);
        setIsAnimating(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!data.length || animationsPaused) return;

    const initialTimer = setTimeout(selectNextCard, 1000);
    const interval = setInterval(selectNextCard, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [data, animatingCard, animationsPaused, currentCardIndex]); // Added currentCardIndex to dependencies

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (initialLoading || (!data.length && !error))
    return (
      <div className="min-h-screen bg-black justify-center text-white flex flex-col items-center">
        <>
          <FloatingStars starCount={100} animationSpeed={1} />
          <div className="w-[45rem] h-52 bg-white/20 rounded-full blur-3xl absolute z-10"></div>
          <div className="w-full h-screen absolute inset-0 z-10">
            <img
              src="/images/background-1.webp"
              alt="background image"
              className="w-full h-full object-fill object-center"
            />
          </div>
          <div className="w-full h-screen absolute inset-0 z-0">
            <img
              src="/images/background-2.webp"
              alt="background image"
              className="w-full h-full object-fill object-center"
            />
          </div>
          <div className="w-full h-screen absolute inset-0 z-20">
            <img
              src="/images/golden-frame.webp"
              alt="golden-frame"
              className="w-full h-full object-fill"
            />
          </div>
        </>
        <div className="z-50 relative">
          <Loader />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center">
            <div className=" mt-4 mb-4"></div>
            Loading...
          </motion.div>
        </div>
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

  const leftCards = data.slice(0, 10);
  const rightCards = data.slice(10, 20);

  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <>
        {/* <FloatingStars starCount={100} animationSpeed={1} /> */}
        <div className="w-[45rem] h-52 bg-white/20 rounded-full blur-3xl absolute z-10"></div>
        <div className="w-full h-screen absolute inset-0 z-10">
          <img
            src="/images/background-1.webp"
            alt="background image"
            className="w-full h-full object-fill object-center"
          />
        </div>
        <div className="w-full h-screen absolute inset-0 z-0">
          <img
            src="/images/background-2.webp"
            alt="background image"
            className="w-full h-full object-fill object-center"
          />
        </div>
        <div className="w-full h-screen absolute inset-0 z-20">
          <img
            src="/images/golden-frame.webp"
            alt="golden-frame"
            className="w-full h-full object-fill"
          />
        </div>
      </>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-[100] bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg backdrop-blur-sm border border-gray-700">
        <div className="flex items-center space-x-2 text-sm">
          {isFetching ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Fetching...</span>
            </>
          ) : animationsPaused ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Animations paused</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Next fetch in {formatTime(timeUntilFetch)} | Card{" "}
                {currentCardIndex + 1}/{data.length}
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Left Grid */}
      <div className="fixed left-28 top-1/2 -translate-y-1/2 z-10">
        <div className="grid grid-cols-2 grid-rows-5 gap-2">
          <AnimatePresence>
            {leftCards.map((card, index) => (
              <motion.div
                key={`${card.outletName}-${card.retailerName}`}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                initial={
                  card.isNew
                    ? {
                        scale: 0,
                        opacity: 0,
                        rotate: 180,
                        x: -50,
                        y: -50,
                      }
                    : false
                }
                animate={{
                  opacity: animatingCard?.id === index ? 0 : 1,
                  rotate: 0,
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                transition={{
                  duration: card.isNew ? 0.8 : 0.5,
                  type: "spring",
                  bounce: 0.4,
                  delay: card.isNew ? Math.random() * 0.3 : 0,
                }}
                className={cn(
                  "w-28 h-28 rounded-lg overflow-hidden shadow-lg relative",
                  "hover:shadow-xl hover:scale-105 transition-transform duration-200",
                  // Add visual indicator for current card
                  currentCardIndex === index &&
                    "ring-2 ring-blue-400 ring-opacity-50"
                )}>
                <img
                  src={card.imageUrl || "/placeholder.svg"}
                  alt={card.outletName || `Card ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen relative">
        {animatingCard && (
          <div
            className="fixed z-50 rounded-lg overflow-hidden shadow-2xl neon-flow"
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
                {data[animatingCard.id]?.retailerName}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showText ? 1 : 0,
                  y: showText ? 0 : 20,
                }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-xl text-violet-400">
                {data[animatingCard.id]?.outletName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Grid */}
      <div className="fixed right-28 top-1/2 -translate-y-1/2 z-10">
        <div className="grid grid-cols-2 grid-rows-5 gap-2">
          <AnimatePresence>
            {rightCards.map((card, index) => (
              <motion.div
                key={`${card.outletName}-${card.retailerName}`}
                ref={(el) => {
                  cardRefs.current[index + 10] = el;
                }}
                initial={
                  card.isNew
                    ? {
                        scale: 0,
                        opacity: 0,
                        rotate: -180,
                        x: 50,
                        y: -50,
                      }
                    : false
                }
                animate={{
                  opacity: animatingCard?.id === index + 10 ? 0 : 1,
                  rotate: 0,
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                transition={{
                  duration: card.isNew ? 0.8 : 0.5,
                  type: "spring",
                  bounce: 0.4,
                  delay: card.isNew ? Math.random() * 0.3 : 0,
                }}
                className={cn(
                  "w-28 h-28 rounded-lg overflow-hidden shadow-lg relative transition-all",
                  "hover:shadow-xl hover:scale-105 transition-transform duration-200",
                  // Add visual indicator for current card
                  currentCardIndex === index + 10 &&
                    "ring-2 ring-blue-400 ring-opacity-50"
                )}>
                <img
                  src={card.imageUrl || "/placeholder.svg"}
                  alt={card.outletName || `Card ${index + 11}`}
                  className="w-full h-full object-cover"
                />
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
