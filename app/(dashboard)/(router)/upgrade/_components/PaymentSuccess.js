"use client";
import React from 'react';

export default function PaymentSuccess() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center transform">
        <div className="payment-animation">
          <div className="dots-container">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
            <div className="progress-line"></div>
            <div className="success-circle">
              <div className="success-tick"></div>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mt-6 animate-fade-in">Payment Successful!</h2>
        <p className="text-gray-600 mt-2 animate-fade-in-delay">Your plan has been upgraded</p>

        <style jsx>{`
          .payment-animation {
            height: 120px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dots-container {
            width: 240px;
            height: 40px;
            position: relative;
          }

          .dot {
            width: 16px;
            height: 16px;
            background: #e2e8f0;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
          }

          .dot-1 { left: 0; }
          .dot-2 { left: 50%; transform: translate(-50%, -50%); }
          .dot-3 { right: 0; }

          .progress-line {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            height: 4px;
            width: 0;
            background: #4CAF50;
            animation: progress 1.5s ease-in-out forwards;
          }

          .success-circle {
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%) scale(0);
            width: 32px;
            height: 32px;
            background: #4CAF50;
            border-radius: 50%;
            animation: circle-appear 0.5s ease-out forwards;
            animation-delay: 1.5s;
          }

          .success-tick {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg) scale(0);
            width: 8px;
            height: 16px;
            border: solid white;
            border-width: 0 2px 2px 0;
            animation: tick-appear 0.5s ease-out forwards;
            animation-delay: 1.8s;
          }

          @keyframes progress {
            0% {
              width: 0;
              background: #4CAF50;
            }
            100% {
              width: 100%;
              background: #4CAF50;
            }
          }

          @keyframes circle-appear {
            0% {
              transform: translateY(-50%) scale(0);
            }
            50% {
              transform: translateY(-50%) scale(1.2);
            }
            100% {
              transform: translateY(-50%) scale(1);
            }
          }

          @keyframes tick-appear {
            0% {
              transform: translate(-50%, -50%) rotate(45deg) scale(0);
            }
            50% {
              transform: translate(-50%, -50%) rotate(45deg) scale(1.2);
            }
            100% {
              transform: translate(-50%, -50%) rotate(45deg) scale(1);
            }
          }

          .dot-1 {
            animation: dot-color 0.5s ease-out forwards;
            animation-delay: 0.1s;
          }
          .dot-2 {
            animation: dot-color 0.5s ease-out forwards;
            animation-delay: 0.8s;
          }
          .dot-3 {
            animation: dot-color 0.5s ease-out forwards;
            animation-delay: 1.5s;
          }

          @keyframes dot-color {
            to {
              background: #4CAF50;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
