import { useState, useEffect } from "react";
import { XMarkIcon, ArrowRightIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

export default function PageGuide({ guideKey, steps, onComplete }) {
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    // Kullanıcıya özel guide key'i kontrol et (user email/id ile birleştirilmiş)
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userSpecificKey = `${guideKey}_${user.email || user._id || user.id}`;
        const hasSeenGuide = localStorage.getItem(userSpecificKey);
        if (!hasSeenGuide) {
          setShowGuide(true);
        }
      } catch (e) {
        // User data parse edilemezse göster
        const hasSeenGuide = localStorage.getItem(guideKey);
        if (!hasSeenGuide) {
          setShowGuide(true);
        }
      }
    } else {
      // User yoksa genel key kullan
      const hasSeenGuide = localStorage.getItem(guideKey);
      if (!hasSeenGuide) {
        setShowGuide(true);
      }
    }
  }, [guideKey]);

  const handleCloseGuide = () => {
    setShowGuide(false);
    // Kullanıcıya özel key kullan
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userSpecificKey = `${guideKey}_${user.email || user._id || user.id}`;
        localStorage.setItem(userSpecificKey, "true");
      } catch (e) {
        localStorage.setItem(guideKey, "true");
      }
    } else {
      localStorage.setItem(guideKey, "true");
    }
    if (onComplete) onComplete();
  };

  const handleNextGuide = () => {
    if (guideStep < steps.length - 1) {
      setGuideStep(guideStep + 1);
    } else {
      handleCloseGuide();
    }
  };

  const handlePrevGuide = () => {
    if (guideStep > 0) {
      setGuideStep(guideStep - 1);
    }
  };

  if (!showGuide || steps.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] p-8 rounded-3xl w-full max-w-lg shadow-2xl border-2 border-[#14b8a6]/30 relative">
        <button 
          onClick={handleCloseGuide}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{steps[guideStep].icon}</div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {steps[guideStep].title}
          </h2>
          <p className="text-gray-300 leading-relaxed">
            {steps[guideStep].description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === guideStep
                  ? "w-8 bg-[#14b8a6]"
                  : "w-2 bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {guideStep > 0 && (
            <button
              onClick={handlePrevGuide}
              className="flex-1 px-4 py-3 bg-[#0f172a] hover:bg-[#1a2332] text-white rounded-xl font-semibold transition border border-gray-700"
            >
              Geri
            </button>
          )}
          <button
            onClick={handleNextGuide}
            className="flex-1 px-4 py-3 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            {guideStep === steps.length - 1 ? (
              <>
                <CheckBadgeIcon className="w-5 h-5" />
                Başlayalım
              </>
            ) : (
              <>
                İleri
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

