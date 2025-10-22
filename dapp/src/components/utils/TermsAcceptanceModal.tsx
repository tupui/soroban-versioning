import React, { useState, useEffect } from "react";

interface TermsAcceptanceModalProps {
  onAccept: () => void;
  onDecline: () => void;
  summaryContent: any;
}

const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  onAccept,
  onDecline,
  summaryContent,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Show modal with slight delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Consider scrolled if user has scrolled at least 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      setHasScrolled(true);
    }
  };

  const handleAccept = () => {
    const acceptanceData = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: "October 21, 2025",
    };

    localStorage.setItem("tansu_tos_accepted", JSON.stringify(acceptanceData));
    onAccept();
  };

  const handleDecline = () => {
    onDecline();
  };

  const summary = summaryContent;
  const sections = summary.sections || {};

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[9999] p-2 sm:p-4">
      <div className="modal relative bg-white shadow-modal rounded-lg max-w-[95vw] w-full sm:w-auto max-w-4xl">
        <div
          className="p-3 sm:p-4 md:p-6 lg:p-8 max-h-[85vh] overflow-auto"
          onScroll={handleScroll}
        >
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="leading-6 text-2xl font-medium text-primary">
                Terms of Service
              </div>
              <div className="text-base text-secondary">
                Please read and accept our Terms of Service to continue
              </div>
              <div className="text-sm text-zinc-600">
                Last Updated: October 21, 2025
              </div>
            </div>

            {/* Important Notice Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-blue-700">
                    Our architecture is fully decentralized—we do not operate
                    backend servers or store user data. We recommend reading our
                    Privacy Policy alongside these Terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
              <p className="text-secondary leading-relaxed">
                {summary.introduction ||
                  "Tansu is a decentralized governance platform operated by Consulting Manao GmbH, located in Austria. By using our dApp, you agree to be bound by these Terms of Service."}
              </p>
            </div>

            {/* Key Points Card */}
            {sections.keyPoints && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔑</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Key Points
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.keyPoints.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <h3 className="font-semibold text-primary mb-1">
                        {item.title}
                      </h3>
                      <p className="text-secondary text-sm">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Risks Card */}
            {sections.importantRisks && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚠️</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Important Risks
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.importantRisks.map((item, index) => (
                    <div key={index} className="bg-red-50 rounded-lg p-3">
                      <h4 className="font-semibold text-red-800 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-red-700 text-sm">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Responsibilities Card */}
            {sections.yourResponsibilities && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📋</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Your Responsibilities
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.yourResponsibilities.map((item, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-700 text-sm font-medium">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Modifications Card */}
            {sections.serviceModifications && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚙️</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Service Modifications
                  </h2>
                </div>

                <div className="space-y-3">
                  <p className="text-secondary text-sm mb-3">
                    {sections.serviceModifications.description}
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-semibold text-yellow-800 mb-1">
                      Administrative Rights
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      {sections.serviceModifications.administrativeRights}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Limitations of Liability Card */}
            {sections.limitationsOfLiability && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🛡️</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Limitations of Liability
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.limitationsOfLiability.map((item, index) => (
                    <div key={index} className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-yellow-700 text-sm font-medium">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information Card */}
            {sections.contactInformation && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📞</span>
                  <h2 className="text-xl font-semibold text-primary">
                    Contact Information
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      {sections.contactInformation.company}
                    </h4>
                    <p className="text-secondary text-sm whitespace-pre-line">
                      {sections.contactInformation.details}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Address:</span>
                    <p className="text-secondary text-sm">
                      {sections.contactInformation.address}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Email:</span>
                    <p className="text-secondary text-sm">
                      {sections.contactInformation.email}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Website:</span>
                    <p className="text-secondary text-sm">
                      {sections.contactInformation.website}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Links */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <div className="flex justify-center gap-4 text-sm">
                <a
                  href="/terms"
                  className="text-primary hover:underline font-medium"
                >
                  Read Full Terms of Service →
                </a>
                <span className="text-gray-400">|</span>
                <a
                  href="/privacy"
                  className="text-primary hover:underline font-medium"
                >
                  Read Privacy Policy →
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 pt-4 border-t border-zinc-200">
              <div className="text-center sm:text-left">
                <p className="text-sm text-secondary">
                  By clicking "Accept", you agree to be bound by these Terms of
                  Service.
                </p>
                {!hasScrolled && (
                  <p className="text-primary text-xs mt-1">
                    Please scroll down to read more before accepting
                  </p>
                )}
              </div>
              <div className="flex gap-4 justify-center sm:justify-end">
                <button
                  onClick={handleDecline}
                  className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold rounded-lg transition-colors duration-200"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!hasScrolled}
                  className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 ${
                    hasScrolled
                      ? "bg-primary hover:bg-secondary text-white"
                      : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptanceModal;
