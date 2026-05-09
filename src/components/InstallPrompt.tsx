import React, { useState } from 'react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const { isInstallable, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed, dismissed, or not installable and not iOS
  if (isStandalone || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 flex items-start gap-4"
      >
        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 mt-1">
          <Download className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Install GradePro</h3>
          <p className="text-sm text-slate-500 mt-1">
            {isIOS ? (
              <>Install this app on your iPhone: tap <Share className="inline w-4 h-4 mx-1" /> and then <strong>Add to Home Screen</strong>.</>
            ) : (
              "Add GradePro to your home screen for quick access and offline use."
            )}
          </p>
          
          {!isIOS && isInstallable && (
            <button
              onClick={promptInstall}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Install App
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
