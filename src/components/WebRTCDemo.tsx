import { useState } from 'react';
import { CallModal } from './CallModal';
import { Id } from '../../convex/_generated/dataModel';

export function WebRTCDemo() {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setShowDemo(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Try WebRTC Demo
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">WebRTC Features Demo</h2>
            <button
              onClick={() => setShowDemo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">🎥 Video Calls</h3>
                <p className="text-sm text-purple-700 mb-3">
                  Start group video calls with multiple participants in any channel.
                </p>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li>• HD video quality</li>
                  <li>• Screen sharing</li>
                  <li>• Mute/unmute controls</li>
                  <li>• Responsive design</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">🎵 Audio Calls</h3>
                <p className="text-sm text-green-700 mb-3">
                  High-quality audio calls for better performance and battery life.
                </p>
                <ul className="text-xs text-green-600 space-y-1">
                  <li>• Crystal clear audio</li>
                  <li>• Low bandwidth usage</li>
                  <li>• Background friendly</li>
                  <li>• Mobile optimized</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 How to Use</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>1. Start a Call:</strong> Click the video or audio call button in any channel header</p>
                <p><strong>2. Join a Call:</strong> Look for the green "Call active" indicator and click "Join"</p>
                <p><strong>3. During Calls:</strong> Use the control buttons to mute, turn off video, or share screen</p>
                <p><strong>4. Mobile:</strong> All features work seamlessly on mobile devices</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Requirements</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)</p>
                <p>• Camera and microphone permissions</p>
                <p>• Stable internet connection</p>
                <p>• HTTPS connection (required for WebRTC)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDemo(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close Demo
              </button>
              <button
                onClick={() => {
                  // This would start a demo call in a real implementation
                  alert('Demo call would start here! In the real app, navigate to a channel and click the call buttons.');
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try It Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
