/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CardData {
  id: number;
  image: string;
}

interface AnimatingCard {
  id: number;
  originalRect: DOMRect;
  side: "left" | "right";
  gridIndex: number;
}

export default function AnimatedCardsPage() {
  const [cards] = useState<CardData[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      image: `/placeholder.svg?height=120&width=120&query=abstract pattern ${
        i + 1
      }`,
    }))
  );

  const [animatingCard, setAnimatingCard] = useState<AnimatingCard | null>(
    null
  );
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectRandomCard = () => {
    if (animatingCard) return; // Don't start new animation if one is running

    const randomIndex = Math.floor(Math.random() * 20);
    const cardElement = cardRefs.current[randomIndex];

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      const side = randomIndex < 10 ? "left" : "right";
      const gridIndex = randomIndex % 10;

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
    // Start first animation after component mounts
    const initialTimer = setTimeout(selectRandomCard, 1000);

    // Set up recurring animations
    const interval = setInterval(selectRandomCard, 6000); // 6 seconds total cycle

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [animatingCard]);

  const leftCards = cards.slice(0, 10);
  const rightCards = cards.slice(10, 20);

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
                src={card.image || "/placeholder.svg"}
                alt={`Card ${card.id + 1}`}
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
              src={cards[animatingCard.id].image || "/placeholder.svg"}
              alt={`Animating Card ${animatingCard.id + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="text-white text-center space-y-8 px-8">
          <h1 className="text-4xl font-bold">Animated Card Gallery</h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Watch as cards automatically animate from the side grids to the
            center. The page is scrollable with plenty of black space for clear
            visibility.
          </p>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10">
        {/* Right Grid */}
        <div className="grid grid-cols-2 gap-2">
          {rightCards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => (cardRefs.current[index + 10] = el)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden shadow-lg transition-all border-2 border-red-500 duration-500",
                "hover:shadow-xl hover:scale-105",
                animatingCard?.id === index + 10
                  ? "opacity-0 scale-0"
                  : "opacity-100 scale-100"
              )}>
              <img
                src={card.image || "/placeholder.svg"}
                alt={`Card ${card.id + 1}`}
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
            height: ${animatingCard?.originalRect.width}px;
          }
        }
      `}</style>
    </div>
  );
}
