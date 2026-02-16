"use client";

import { useState } from "react";
import { Phone, MessageSquare, Loader2 } from "lucide-react";

export default function TestAfricasTalkingPage() {
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [smsMessage, setSmsMessage] = useState("Hello from SmartChama! This is a test message.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestSMS = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: smsMessage
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Africa's Talking Test</h1>
          <p className="text-slate-400">Test your USSD and SMS integration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* USSD Test Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">USSD Test</h2>
                <p className="text-xs text-slate-500">Test your USSD menu</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-2">Your USSD Code:</p>
                <p className="text-2xl font-bold text-white font-mono">*384*23713#</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-2">Callback URL:</p>
                <p className="text-xs text-emerald-400 font-mono break-all">
                  https://uninaugurated-biscuitlike-madaline.ngrok-free.dev/api/ussd
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-white">Test Options:</p>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>1. Use Africa's Talking Simulator</p>
                  <p>2. Dial from registered phone</p>
                  <p>3. Check ngrok inspector</p>
                </div>
              </div>

              <a 
                href="https://simulator.africastalking.com/" 
                target="_blank"
                className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-center transition-all"
              >
                Open Simulator
              </a>
            </div>
          </div>

          {/* SMS Test Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">SMS Test</h2>
                <p className="text-xs text-slate-500">Send a test SMS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Message
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {smsMessage.length} characters
                </p>
              </div>

              <button
                onClick={sendTestSMS}
                disabled={loading || !phoneNumber || !smsMessage}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test SMS'
                )}
              </button>

              {result && (
                <div className={`p-4 rounded-xl border ${result.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <p className={`text-sm font-bold mb-2 ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.success ? '✅ Success!' : '❌ Error'}
                  </p>
                  <pre className="text-xs text-slate-400 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📚 Testing Instructions</h3>
          
          <div className="space-y-4 text-sm text-slate-400">
            <div>
              <p className="font-bold text-white mb-2">USSD Testing:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open the Africa's Talking Simulator</li>
                <li>Select "USSD" option</li>
                <li>Enter your ngrok callback URL</li>
                <li>Dial *384*23713# in the simulator</li>
                <li>Test all menu options</li>
              </ol>
            </div>

            <div>
              <p className="font-bold text-white mb-2">SMS Testing:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Enter your phone number (with country code)</li>
                <li>Customize the message if needed</li>
                <li>Click "Send Test SMS"</li>
                <li>Check your phone for the message</li>
                <li>Check the response for delivery status</li>
              </ol>
            </div>

            <div>
              <p className="font-bold text-white mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Make sure your API key is correct in .env.local</li>
                <li>Verify ngrok is running and URL is correct</li>
                <li>Check Africa's Talking dashboard for logs</li>
                <li>In sandbox, only registered phones can receive SMS</li>
                <li>Check your dev server terminal for errors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a 
            href="https://account.africastalking.com/apps/sandbox" 
            target="_blank"
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold py-3 rounded-xl text-center transition-all"
          >
            Africa's Talking Dashboard
          </a>
          <a 
            href="http://127.0.0.1:4040" 
            target="_blank"
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold py-3 rounded-xl text-center transition-all"
          >
            ngrok Inspector
          </a>
        </div>

      </div>
    </div>
  );
}
