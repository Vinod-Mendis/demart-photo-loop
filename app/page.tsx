/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";

// GSAP-like animation function (simplified for this environment)
const animateElement = (
  element: HTMLElement,
  fromProps: Record<string, number>,
  toProps: Record<string, number | (() => void)>,
  duration = 800
) => {
  const startTime = performance.now();
  const startProps: Record<string, number> = {};

  // Get initial values
  Object.keys(toProps).forEach((key) => {
    if (key === "x" || key === "y") {
      startProps[key] = parseFloat(
        element.style.transform?.match(
          new RegExp(`translate${key.toUpperCase()}\\(([^)]+)\\)`)
        )?.[1] || "0"
      );
    } else if (key === "scale") {
      startProps[key] = parseFloat(
        element.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || "1"
      );
    } else if (key === "zIndex") {
      startProps[key] = parseInt(element.style.zIndex || "1");
    }
  });

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);

    let transform = "";
    Object.keys(toProps).forEach((key) => {
      const start = startProps[key] || (key === "scale" ? 1 : 0);
      const end = toProps[key] as number;
      const current = start + (end - start) * easeOut;

      if (key === "x") {
        transform += `translateX(${current}px) `;
      } else if (key === "y") {
        transform += `translateY(${current}px) `;
      } else if (key === "scale") {
        transform += `scale(${current}) `;
      } else if (key === "zIndex") {
        element.style.zIndex = Math.round(current).toString();
      }
    });

    if (transform) {
      element.style.transform = transform.trim();
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (toProps.onComplete) {
      setTimeout(toProps.onComplete as () => void, 0);
    }
  };

  requestAnimationFrame(animate);
};
interface Participant {
  id: number;
  name: string;
  imageUrl: string;
}

const PhotoLoopApp = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextAnimationIn, setNextAnimationIn] = useState(3);
  // Ref declarations
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  // Generate 100 participants with placeholder images
  useEffect(() => {
    const generateParticipants = () => {
      return Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `Person ${index + 1}`,
        imageUrl: `https://picsum.photos/150/150?random=${index + 1}`,
      }));
    };

    setParticipants(generateParticipants());
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isAnimating) return;

    const timer = setInterval(() => {
      setNextAnimationIn((prev) => {
        if (prev <= 1) {
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnimating]);

  // Animation function
  const animateImage = (imageElement: HTMLElement | null, side: string) => {
    if (
      isAnimating ||
      !imageElement ||
      !containerRef.current ||
      !centerRef.current
    )
      return;

    setIsAnimating(true);

    // Get positions
    const imageRect = imageElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerRect = centerRef.current.getBoundingClientRect();

    // Calculate center position relative to image's current position
    const centerX =
      centerRect.left +
      centerRect.width / 2 -
      (imageRect.left + imageRect.width / 2);
    const centerY =
      centerRect.top +
      centerRect.height / 2 -
      (imageRect.top + imageRect.height / 2);

    // Reset any existing transforms
    imageElement.style.transform = "";

    // Animate to center
    animateElement(
      imageElement,
      {},
      {
        x: centerX,
        y: centerY,
        scale: 2.5,
        zIndex: 1000,
        onComplete: () => {
          // Hold for 1 second, then animate back
          setTimeout(() => {
            animateElement(
              imageElement,
              {},
              {
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 1,
                onComplete: () => {
                  setIsAnimating(false);
                  setNextAnimationIn(3);
                },
              }
            );
          }, 1000);
        },
      }
    );
  };

  // Start random animation loop
  useEffect(() => {
    if (participants.length === 0 || isAnimating) return;

    const startRandomAnimation = () => {
      if (isAnimating) return;

      // Choose random side (first 10 from each side)
      const side = Math.random() < 0.5 ? "left" : "right";
      const imageIndex = Math.floor(Math.random() * 10);

      const imageId =
        side === "left" ? `img-${imageIndex}` : `img-${imageIndex + 10}`;
      const imageElement = document.getElementById(imageId);

      if (imageElement) {
        animateImage(imageElement, side);
      }
    };

    // Start animation when countdown reaches 0
    if (nextAnimationIn === 1) {
      setTimeout(startRandomAnimation, 1000);
    }
  }, [participants, isAnimating, nextAnimationIn]);

  if (participants.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading participants...</div>
      </div>
    );
  }

  const leftSideParticipants = participants.slice(0, 10);
  const rightSideParticipants = participants.slice(10, 20);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden relative">
      {/* Left Side - 2 columns with 5 images each */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
        <div className="grid grid-cols-2 gap-4">
          {leftSideParticipants.map((participant, index) => (
            <div key={participant.id} className="relative">
              <img
                id={`img-${index}`}
                src={participant.imageUrl}
                alt={participant.name}
                className="w-24 h-24 object-cover rounded-lg shadow-lg border-2 border-gray-600 cursor-pointer transition-all duration-200 hover:scale-105"
                draggable={false}
                style={{ position: "relative", zIndex: 1 }}
              />
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {participant.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Area - Animation space */}
      <div
        ref={centerRef}
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-sm">Animation</div>
          <div className="text-sm">Center</div>
        </div>
      </div>

      {/* Right Side - 2 columns with 5 images each */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
        <div className="grid grid-cols-2 gap-4">
          {rightSideParticipants.map((participant, index) => (
            <div key={participant.id} className="relative">
              <img
                id={`img-${index + 10}`}
                src={participant.imageUrl}
                alt={participant.name}
                className="w-24 h-24 object-cover rounded-lg shadow-lg border-2 border-gray-600 cursor-pointer transition-all duration-200 hover:scale-105"
                draggable={false}
                style={{ position: "relative", zIndex: 1 }}
              />
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {participant.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 rounded-full px-4 py-2">
          <span className="text-white text-sm">
            {isAnimating
              ? "🎬 Animating..."
              : `⏱️ Next animation in ${nextAnimationIn}s`}
          </span>
        </div>
      </div>

      {/* Participant counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 rounded-full px-4 py-2">
          <span className="text-white text-sm">
            Showing 20 of {participants.length} participants
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2">
          <div className="text-white text-xs">
            <div>• 2 columns × 5 images per side</div>
            <div>• Random animation every 3 seconds</div>
            <div>• Images animate to center and back</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoLoopApp;
