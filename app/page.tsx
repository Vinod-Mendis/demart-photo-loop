/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";

// GSAP will be loaded from CDN
declare global {
  interface Window {
    gsap: any;
  }
}

// Fallback animation function for when GSAP is loading
const fallbackAnimateElement = (
  element: HTMLElement,
  fromProps: Record<string, number>,
  toProps: Record<string, number | (() => void)>,
  duration = 1200
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

    const easeInOut =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    let transform = "";
    Object.keys(toProps).forEach((key) => {
      const start = startProps[key] || (key === "scale" ? 1 : 0);
      const end = toProps[key] as number;
      const current = start + (end - start) * easeInOut;

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
  shopName: string;
}

const PhotoLoopApp = () => {
  // Hardcoded 20 participants array
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 1,
      name: "Alice Johnson",
      shopName: "Urban Threads Boutique",
      imageUrl: "https://picsum.photos/150/150?random=1",
    },
    {
      id: 2,
      name: "Bob Smith",
      shopName: "The Golden Harvest Market",
      imageUrl: "https://picsum.photos/150/150?random=2",
    },
    {
      id: 3,
      name: "Carol Davis",
      shopName: "Pixel & Paper Creative Studio",
      imageUrl: "https://picsum.photos/150/150?random=3",
    },
    {
      id: 4,
      name: "David Wilson",
      shopName: "Fresh Bloom Floral Designs",
      imageUrl: "https://picsum.photos/150/150?random=4",
    },
    {
      id: 5,
      name: "Emma Brown",
      shopName: "Luxe Lane Fashion & Accessories",
      imageUrl: "https://picsum.photos/150/150?random=5",
    },
    {
      id: 6,
      name: "Frank Miller",
      shopName: "Brew & Bean Café",
      imageUrl: "https://picsum.photos/150/150?random=6",
    },
    {
      id: 7,
      name: "Grace Lee",
      shopName: "GreenLeaf Organics",
      imageUrl: "https://picsum.photos/150/150?random=7",
    },
    {
      id: 8,
      name: "Henry Garcia",
      shopName: "TechNest Gadgets",
      imageUrl: "https://picsum.photos/150/150?random=8",
    },
    {
      id: 9,
      name: "Ivy Chen",
      shopName: "Blissful Bakes",
      imageUrl: "https://picsum.photos/150/150?random=9",
    },
    {
      id: 10,
      name: "Jack Taylor",
      shopName: "Fit & Fab Activewear",
      imageUrl: "https://picsum.photos/150/150?random=10",
    },
    {
      id: 11,
      name: "Kate Anderson",
      shopName: "Coastal Charm Décor",
      imageUrl: "https://picsum.photos/150/150?random=11",
    },
    {
      id: 12,
      name: "Liam Thomas",
      shopName: "BrightPath Books",
      imageUrl: "https://picsum.photos/150/150?random=12",
    },
    {
      id: 13,
      name: "Mia Rodriguez",
      shopName: "Serenity Spa & Wellness",
      imageUrl: "https://picsum.photos/150/150?random=13",
    },
    {
      id: 14,
      name: "Noah Martinez",
      shopName: "Peak Performance Gym",
      imageUrl: "https://picsum.photos/150/150?random=14",
    },
    {
      id: 15,
      name: "Olivia White",
      shopName: "Golden Glow Jewelry",
      imageUrl: "https://picsum.photos/150/150?random=15",
    },
    {
      id: 16,
      name: "Peter Clark",
      shopName: "Vintage Wheels Auto",
      imageUrl: "https://picsum.photos/150/150?random=16",
    },
    {
      id: 17,
      name: "Quinn Lewis",
      shopName: "Summit Outdoor Gear",
      imageUrl: "https://picsum.photos/150/150?random=17",
    },
    {
      id: 18,
      name: "Ruby Hall",
      shopName: "Bloom & Vine Florist",
      imageUrl: "https://picsum.photos/150/150?random=18",
    },
    {
      id: 19,
      name: "Sam Young",
      shopName: "Urban Eats Diner",
      imageUrl: "https://picsum.photos/150/150?random=19",
    },
    {
      id: 20,
      name: "Tara King",
      shopName: "Starlight Boutique",
      imageUrl: "https://picsum.photos/150/150?random=20",
    },
  ]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [nextAnimationIn, setNextAnimationIn] = useState(3);
  const [showMenu, setShowMenu] = useState(false);
  const [imagesToAdd, setImagesToAdd] = useState(1);
  const [nextId, setNextId] = useState(21);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [newImageIndexes, setNewImageIndexes] = useState<number[]>([]);
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [currentAnimatingPerson, setCurrentAnimatingPerson] =
    useState<Participant | null>(null);
  const [showPersonInfo, setShowPersonInfo] = useState(false);

  // Ref declarations
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  // Load GSAP from CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
    script.async = true;
    script.onload = () => {
      setGsapLoaded(true);
      console.log("GSAP loaded successfully");
    };
    script.onerror = () => {
      console.log("GSAP failed to load, using fallback animation");
      setGsapLoaded(false);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isAnimating || isAddingImages) return;

    const timer = setInterval(() => {
      setNextAnimationIn((prev) => {
        if (prev <= 1) {
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnimating, isAddingImages]);

  // Animation function using GSAP
  const animateImage = (imageElement: HTMLElement | null, side: string) => {
    if (
      isAnimating ||
      !imageElement ||
      !containerRef.current ||
      !centerRef.current
    )
      return;

    setIsAnimating(true);

    // Get the participant data for this image
    const imageId = imageElement.id;
    const imageIndex = parseInt(imageId.split("-")[1]);
    const participant =
      imageIndex < 10
        ? leftSideParticipants[imageIndex]
        : rightSideParticipants[imageIndex - 10];

    setCurrentAnimatingPerson(participant);
    console.log("Currently animating:", participant);

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

    // Create name display element
    const nameElement = document.createElement("div");
    nameElement.id = "animated-name";
    nameElement.className =
      "absolute text-white text-xl font-semibold bg-black bg-opacity-75 px-4 py-2 rounded-lg";
    nameElement.style.left = "50%";
    nameElement.style.top = "calc(50% + 100px)";
    nameElement.style.transform = "translateX(-50%)";
    nameElement.style.zIndex = "1001";
    nameElement.style.opacity = "0";
    nameElement.textContent = participant.name;

    if (gsapLoaded && window.gsap) {
      // Use GSAP for smooth animations
      const gsap = window.gsap;

      // Animate to center with GSAP
      gsap.to(imageElement, {
        x: centerX,
        y: centerY,
        scale: 5,
        zIndex: 1000,
        duration: 1.2,
        ease: "power1.inOut",
        onComplete: () => {
          // Show person info 500ms after image reaches center
          setTimeout(() => {
            setShowPersonInfo(true);
          }, 500);

          // Add name element to center area and fade it in
          if (centerRef.current) {
            centerRef.current.appendChild(nameElement);
            gsap.to(nameElement, {
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
              delay: 0.1,
            });
          }

          // Hold for 3 seconds, then animate back
          setTimeout(() => {
            // Hide person info 500ms before image starts going back
            setShowPersonInfo(false);

            // Fade out name with GSAP (500ms before image starts going back)
            gsap.to(nameElement, {
              opacity: 0,
              duration: 0.5,
              ease: "power1.out",
              onComplete: () => {
                // Remove name element
                if (nameElement.parentNode) {
                  nameElement.parentNode.removeChild(nameElement);
                }
              },
            });

            // Start animating image back 500ms after name starts fading out
            setTimeout(() => {
              gsap.to(imageElement, {
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 1,
                duration: 1.2,
                ease: "power1.inOut",
                onComplete: () => {
                  setIsAnimating(false);
                  setCurrentAnimatingPerson(null);
                  setShowPersonInfo(false);
                  setNextAnimationIn(3);
                },
              });
            }, 500);
          }, 3000);
        },
      });
    } else {
      // Fallback to custom animation if GSAP isn't loaded
      fallbackAnimateElement(
        imageElement,
        {},
        {
          x: centerX,
          y: centerY,
          scale: 5,
          zIndex: 1000,
          onComplete: () => {
            // Show person info 500ms after image reaches center
            setTimeout(() => {
              setShowPersonInfo(true);
            }, 500);

            // Add name element to center area and fade it in
            if (centerRef.current) {
              centerRef.current.appendChild(nameElement);
              setTimeout(() => {
                nameElement.style.transition = "opacity 0.5s ease-in";
                nameElement.style.opacity = "1";
              }, 100);
            }

            // Hold for 3 seconds, then animate back
            setTimeout(() => {
              // Hide person info 500ms before image starts going back
              setShowPersonInfo(false);

              // Fade out name
              nameElement.style.transition = "opacity 0.5s ease-out";
              nameElement.style.opacity = "0";

              setTimeout(() => {
                // Remove name element
                if (nameElement.parentNode) {
                  nameElement.parentNode.removeChild(nameElement);
                }

                // Start animating image back 500ms after name starts fading out
                setTimeout(() => {
                  fallbackAnimateElement(
                    imageElement,
                    {},
                    {
                      x: 0,
                      y: 0,
                      scale: 1,
                      zIndex: 1,
                      onComplete: () => {
                        setIsAnimating(false);
                        setCurrentAnimatingPerson(null);
                        setShowPersonInfo(false);
                        setNextAnimationIn(3);
                      },
                    }
                  );
                }, 500);
              }, 500);
            }, 3000);
          },
        }
      );
    }
  };

  // Start random animation loop
  useEffect(() => {
    if (participants.length === 0 || isAnimating || isAddingImages) return;

    const startRandomAnimation = () => {
      if (isAnimating || isAddingImages) return;

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
  }, [participants, isAnimating, nextAnimationIn, isAddingImages]);

  // Add new images function with animation
  const addNewImages = () => {
    setIsAddingImages(true);
    setShowMenu(false);

    const newImages = Array.from({ length: imagesToAdd }, (_, index) => ({
      id: nextId + index,
      shopName: `Shop ${nextId + index}`,
      name: `Person ${nextId + index}`,
      imageUrl: `https://picsum.photos/150/150?random=${nextId + index}`,
    }));

    // Calculate which indexes will show the new images in the first 20
    const newIndexes: number[] = [];
    const totalParticipants = participants.length;

    // The new images will be at the end, but we need to figure out which of the first 20 will be new
    for (let i = 0; i < imagesToAdd; i++) {
      const newImagePosition = totalParticipants - imagesToAdd + i;
      if (newImagePosition < 20) {
        // This new image will be visible in the first 20
        newIndexes.push(newImagePosition);
      }
    }

    // Also account for images that move into the first 20 positions
    const removedCount = imagesToAdd;
    for (let i = 20 - removedCount; i < 20; i++) {
      if (i >= 0) {
        newIndexes.push(i);
      }
    }

    setNewImageIndexes(newIndexes);

    // First, fade out the old images that will be replaced
    const fadeOutPromises = Array.from({ length: 20 }, (_, index) => {
      return new Promise<void>((resolve) => {
        const imageElement = document.getElementById(`img-${index}`);
        if (imageElement && index < removedCount) {
          imageElement.style.transition =
            "opacity 0.3s ease-out, transform 0.3s ease-out";
          imageElement.style.opacity = "0";
          imageElement.style.transform = "scale(0.8)";
          setTimeout(resolve, 300);
        } else {
          resolve();
        }
      });
    });

    Promise.all(fadeOutPromises).then(() => {
      // Update the participants array
      setParticipants((prev) => {
        const withoutFront = prev.slice(imagesToAdd);
        const updated = [...withoutFront, ...newImages];
        return updated;
      });

      // After a brief delay, fade in the new arrangement
      setTimeout(() => {
        // Reset styles for all images
        for (let i = 0; i < 20; i++) {
          const imageElement = document.getElementById(`img-${i}`);
          if (imageElement) {
            imageElement.style.transition =
              "opacity 0.5s ease-in, transform 0.5s ease-in";
            imageElement.style.opacity = "1";
            imageElement.style.transform = "scale(1)";
          }
        }

        // Add special animation for newly visible images
        setTimeout(() => {
          newIndexes.forEach((index, arrayIndex) => {
            setTimeout(() => {
              const imageElement = document.getElementById(`img-${index}`);
              if (imageElement) {
                imageElement.style.transform = "scale(1.1)";
                imageElement.style.boxShadow =
                  "0 0 20px rgba(59, 130, 246, 0.5)";

                setTimeout(() => {
                  imageElement.style.transition =
                    "transform 0.3s ease-out, box-shadow 0.3s ease-out";
                  imageElement.style.transform = "scale(1)";
                  imageElement.style.boxShadow = "";
                }, 200);
              }
            }, arrayIndex * 100);
          });

          setTimeout(() => {
            setIsAddingImages(false);
            setNewImageIndexes([]);
            // Clear all inline styles
            for (let i = 0; i < 20; i++) {
              const imageElement = document.getElementById(`img-${i}`);
              if (imageElement) {
                imageElement.style.transition = "";
                imageElement.style.transform = "";
                imageElement.style.opacity = "";
                imageElement.style.boxShadow = "";
              }
            }
          }, newIndexes.length * 100 + 500);
        }, 100);
      }, 100);
    });

    setNextId((prev) => prev + imagesToAdd);
  };

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
      {/* Add Images Menu */}
      {showMenu && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-600">
            <h2 className="text-white text-xl mb-4">Add New Images</h2>

            <div className="mb-4">
              <label className="text-gray-300 text-sm block mb-2">
                Number of images to add:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={imagesToAdd}
                onChange={(e) =>
                  setImagesToAdd(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="text-gray-400 text-sm mb-4">
              This will add {imagesToAdd} new image{imagesToAdd > 1 ? "s" : ""}{" "}
              to the end and remove {imagesToAdd} image
              {imagesToAdd > 1 ? "s" : ""} from the front.
            </div>

            <div className="flex gap-3">
              <button
                onClick={addNewImages}
                disabled={!gsapLoaded && window.gsap}
                className={`px-4 py-2 rounded transition-colors ${
                  !gsapLoaded && window.gsap
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                Add Images
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Images Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowMenu(true)}
          disabled={isAddingImages}
          className={`px-4 py-2 rounded-lg transition-colors shadow-lg ${
            isAddingImages
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}>
          {isAddingImages ? "✨ Adding..." : "+ Add Images"}
        </button>
      </div>

      {/* Left Side - 2 columns with 5 images each */}
      <div className="absolute left-28 top-1/2 transform -translate-y-1/2">
        <div className="grid grid-cols-2 gap-4">
          {leftSideParticipants.map((participant, index) => (
            <div key={participant.id} className="relative">
              <img
                id={`img-${index}`}
                src={participant.imageUrl}
                alt={participant.name}
                className={`w-24 h-24 object-cover rounded-lg shadow-lg border-2 border-gray-600 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  newImageIndexes.includes(index) ? "ring-2 ring-blue-400" : ""
                }`}
                draggable={false}
                style={{ position: "relative", zIndex: 1 }}
              />
              {/* <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {participant.name}
                </span>
              </div> */}
            </div>
          ))}
        </div>
      </div>

      {/* Center Area - Animation space */}
      <div
        ref={centerRef}
        className="absolute opacity-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-sm">Animation</div>
          <div className="text-sm">Center</div>
        </div>
      </div>

      <div className="absolute bottom-32 text-center z-50 left-1/2 transform -translate-x-1/2 h-fit">
        <p
          className={`transition-opacity duration-500 text-4xl text-yellow-400 ${
            showPersonInfo ? "opacity-100" : "opacity-0"
          }`}>
          {currentAnimatingPerson?.name}
        </p>
        <p
          className={`transition-opacity duration-500 delay-200 text-2xl text-yellow-700 ${
            showPersonInfo ? "opacity-100" : "opacity-0"
          }`}>
          {currentAnimatingPerson?.shopName}
        </p>
      </div>

      {/* Right Side - 2 columns with 5 images each */}
      <div className="absolute right-28 top-1/2 transform -translate-y-1/2">
        <div className="grid grid-cols-2 gap-4">
          {rightSideParticipants.map((participant, index) => (
            <div key={participant.id} className="relative">
              <img
                id={`img-${index + 10}`}
                src={participant.imageUrl}
                alt={participant.name}
                className={`w-24 h-24 object-cover rounded-lg shadow-lg border-2 border-gray-600 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  newImageIndexes.includes(index + 10)
                    ? "ring-2 ring-blue-400"
                    : ""
                }`}
                draggable={false}
                style={{ position: "relative", zIndex: 1 }}
              />
              {/* <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {participant.name}
                </span>
              </div> */}
            </div>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      {/* <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 rounded-full px-4 py-2">
          <span className="text-white text-sm">
            {isAddingImages
              ? "✨ Adding new images..."
              : isAnimating
              ? "🎬 Animating..."
              : `⏱️ Next animation in ${nextAnimationIn}s`}
          </span>
        </div>
      </div> */}

      {/* Participant counter */}
      {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 rounded-full px-4 py-2">
          <span className="text-white text-sm">
            Showing 20 of {participants.length} participants
          </span>
        </div>
      </div> */}

      {/* Instructions */}
      {/* <div className="absolute bottom-4 left-4">
        <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2">
          <div className="text-white text-xs">
            <div>• 2 columns × 5 images per side</div>
            <div>• Random animation every 3 seconds</div>
            <div>• Images animate to center and back</div>
            <div>• Click "Add Images" to add new ones</div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default PhotoLoopApp;
