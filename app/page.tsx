/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatingCard {
  id: number;
  originalRect: DOMRect;
  side: "left" | "right";
  gridIndex: number;
}

export default function AnimatedCardsPage() {
  const [animatingCard, setAnimatingCard] = useState<AnimatingCard | null>(
    null
  );
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPhotoLoop = async () => {
    setLoading(true);
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
      const filteredData = result.data.map((item, index) => ({
        id: index,
        outletName: item.outletName,
        bpName: item.bpName,
        imageUrl: item.imageUrl,
      }));

      setData(filteredData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotoLoop();
  }, []);

  const selectRandomCard = () => {
    if (animatingCard || !data.length) return; // Don't start if animating or no data

    const randomIndex = Math.floor(Math.random() * data.length);
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

      // Return to original position after 3-4 seconds
      setTimeout(() => {
        setAnimatingCard(null);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!data.length) return; // Don't start animations until data is loaded

    // Start first animation after component mounts
    const initialTimer = setTimeout(selectRandomCard, 1000);

    // Set up recurring animations
    const interval = setInterval(selectRandomCard, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [data, animatingCard]);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  if (!data.length)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        No data available
      </div>
    );

  const leftGridSize = Math.ceil(data.length / 2);
  const leftCards = data.slice(0, leftGridSize);
  const rightCards = data.slice(leftGridSize);

  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10">
        {/* Left Grid */}
        <div className="grid grid-cols-2 gap-2">
          {leftCards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => (cardRefs.current[index] = el)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden shadow-lg transition-all duration-500 border-2 border-red-500",
                "hover:shadow-xl hover:scale-105",
                animatingCard?.id === index
                  ? "opacity-0 scale-0"
                  : "opacity-100 scale-100"
              )}>
              <img
                src={card.imageUrl || "/placeholder.svg"}
                alt={card.outletName || `Card ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen relative">
        {animatingCard && (
          <div
            className="fixed z-50 rounded-lg overflow-hidden shadow-2xl border-2 border-blue-500"
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
            {/* Optional: Display outlet info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
              <p className="truncate">{data[animatingCard.id]?.outletName}</p>
              <p className="truncate text-gray-300">
                {data[animatingCard.id]?.bpName}
              </p>
            </div>
          </div>
        )}
        <div className="text-white text-center space-y-8 px-8">
          <h1 className="text-4xl font-bold">Animated Card Gallery</h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Watch as cards automatically animate from the side grids to the
            center. Displaying {data.length} outlets from the photo loop.
          </p>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10">
        {/* Right Grid */}
        <div className="grid grid-cols-2 gap-2">
          {rightCards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => (cardRefs.current[index + leftGridSize] = el)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden shadow-lg transition-all border-2 border-red-500 duration-500",
                "hover:shadow-xl hover:scale-105",
                animatingCard?.id === index + leftGridSize
                  ? "opacity-0 scale-0"
                  : "opacity-100 scale-100"
              )}>
              <img
                src={card.imageUrl || "/placeholder.svg"}
                alt={card.outletName || `Card ${index + leftGridSize + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes cardToCenter {
          to {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(3);
            width: 200px;
            height: 200px;
          }
        }

        @keyframes centerToCard {
          from {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(3);
            width: 200px;
            height: 200px;
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
