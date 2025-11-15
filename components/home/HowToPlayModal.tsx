"use client";

import { useEffect, useState } from "react";
import CameraSelectionModal from "./CameraSelectionModal";

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectController: () => void;
  onConnectCamera: () => void;
}

export default function HowToPlayModal({
  isOpen,
  onClose,
  onConnectController,
  onConnectCamera,
}: HowToPlayModalProps) {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'checking' | 'connected' | 'notFound'>('idle');
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [showCameraSelection, setShowCameraSelection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'gameplay' | 'camera' | 'controller' | 'inventory'>('gameplay');

  const handleConnectCamera = () => {
    // Always show camera selection when button is clicked
    setShowCameraSelection(true);
  };

  const handleCameraSelected = async (camera: CameraDevice) => {
    setSelectedCamera(camera);
    setCameraStatus('checking');
    
    try {
      // Try to access the selected camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: { exact: camera.deviceId } } 
      });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setCameraStatus('connected');
    } catch (error) {
      console.error('Error connecting to camera:', error);
      setCameraStatus('notFound');
      setSelectedCamera(null);
    }
  };

  // Reset camera status when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCameraStatus('idle');
      setSelectedCamera(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={handleBackdropClick}
    >
      <div
        className="pixel-modal-glass relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="pixel-close-button absolute top-4 right-4 z-10"
          aria-label="Close"
        >
          ×
        </button>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Title */}
          <h2
            className="text-2xl md:text-3xl text-white mb-8 text-center"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            HOW TO PLAY
          </h2>

          {/* Two sections side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Left section - Controller and Camera info */}
            <div className="bg-black bg-opacity-40 p-4 rounded border-2 border-white border-opacity-20">
              <h3
                className="text-base md:text-lg text-white mb-3"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                CONTROLLER & CAMERA
              </h3>
              <div className="space-y-2 text-white text-xs md:text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                <button
                  onClick={() => setSelectedSection('gameplay')}
                  className={`w-full text-left p-2 rounded transition-all ${
                    selectedSection === 'gameplay'
                      ? 'bg-cyan-400 bg-opacity-20 border-2 border-cyan-400'
                      : 'hover:bg-white hover:bg-opacity-10 border-2 border-transparent'
                  }`}
                >
                  <span className="text-cyan-400">GAMEPLAY:</span>
                  <br />
                  <span className="opacity-90">Run forward, collect items (ammo, coins, orbs), and avoid terrain obstacles.</span>
                </button>
                <button
                  onClick={() => setSelectedSection('camera')}
                  className={`w-full text-left p-2 rounded transition-all ${
                    selectedSection === 'camera'
                      ? 'bg-cyan-400 bg-opacity-20 border-2 border-cyan-400'
                      : 'hover:bg-white hover:bg-opacity-10 border-2 border-transparent'
                  }`}
                >
                  <span className="text-cyan-400">CAMERA:</span>
                  <br />
                  <span className="opacity-90">Detects physical movement: jumping, crouching, standing, and arm motion.</span>
                </button>
                <button
                  onClick={() => setSelectedSection('controller')}
                  className={`w-full text-left p-2 rounded transition-all ${
                    selectedSection === 'controller'
                      ? 'bg-cyan-400 bg-opacity-20 border-2 border-cyan-400'
                      : 'hover:bg-white hover:bg-opacity-10 border-2 border-transparent'
                  }`}
                >
                  <span className="text-cyan-400">CONTROLLER:</span>
                  <br />
                  <span className="opacity-90">Tracks movement, direction, and gyroscope for aiming and firing.</span>
                </button>
                <button
                  onClick={() => setSelectedSection('inventory')}
                  className={`w-full text-left p-2 rounded transition-all ${
                    selectedSection === 'inventory'
                      ? 'bg-cyan-400 bg-opacity-20 border-2 border-cyan-400'
                      : 'hover:bg-white hover:bg-opacity-10 border-2 border-transparent'
                  }`}
                >
                  <span className="text-cyan-400">INVENTORY:</span>
                  <br />
                  <span className="opacity-90">Display shows ammo, coins, and calories burnt.</span>
                </button>
              </div>
            </div>

            {/* Right section - Dynamic video based on selection */}
            <div className="bg-black bg-opacity-40 p-4 rounded border-2 border-white border-opacity-20">
              {selectedSection === 'gameplay' && (
                <div className="w-full">
                  <h4 className="text-base md:text-lg text-cyan-400 mb-3 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    GAMEPLAY
                  </h4>
                  <div className="w-full aspect-video bg-black rounded overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      {/* Replace with your gameplay video source */}
                      <source src="/videos/gameplay.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
              
              {selectedSection === 'camera' && (
                <div className="w-full">
                  <h4 className="text-base md:text-lg text-cyan-400 mb-3 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    CAMERA
                  </h4>
                  <div className="w-full aspect-video bg-black rounded overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      {/* Replace with your camera video source */}
                      <source src="/videos/camera.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
              
              {selectedSection === 'controller' && (
                <div className="w-full">
                  <h4 className="text-base md:text-lg text-cyan-400 mb-3 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    CONTROLLER
                  </h4>
                  <div className="w-full aspect-video bg-black rounded overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      {/* Replace with your controller video source */}
                      <source src="/videos/controller.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
              
              {selectedSection === 'inventory' && (
                <div className="w-full">
                  <h4 className="text-base md:text-lg text-cyan-400 mb-3 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    INVENTORY
                  </h4>
                  <div className="w-full aspect-video bg-black rounded overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      {/* Replace with your inventory video source */}
                      <source src="/videos/inventory.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connect buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onConnectController}
              className="pixel-button-glass"
            >
              CONNECT CONTROLLER
            </button>
            <button
              onClick={handleConnectCamera}
              className="pixel-button-glass"
              disabled={cameraStatus === 'checking'}
            >
              {cameraStatus === 'checking' 
                ? "CHECKING..." 
                : cameraStatus === 'connected'
                ? "SELECT CAMERA"
                : cameraStatus === 'notFound'
                ? "TRY AGAIN"
                : "CONNECT CAMERA"}
            </button>
          </div>
          
          {/* Camera status message */}
          {cameraStatus === 'connected' && selectedCamera && (
            <p 
              className="text-center text-green-400 text-xs mt-2 opacity-80"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CONNECTED: {selectedCamera.label}
            </p>
          )}
          {cameraStatus === 'notFound' && (
            <p 
              className="text-center text-red-400 text-xs mt-2 opacity-80"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CAMERA NOT FOUND - CLICK TO TRY AGAIN
            </p>
          )}
        </div>
      </div>

      {/* Camera Selection Modal */}
      <CameraSelectionModal
        isOpen={showCameraSelection}
        onClose={() => setShowCameraSelection(false)}
        onSelectCamera={handleCameraSelected}
      />
    </div>
  );
}

