"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { calculateMemberRiskScore, MemberRiskScore } from "@/lib/predictive-ai";

interface PredictiveInsightsProps {
  memberId: string;
  chamaId: string;
}

export default function PredictiveInsights({ memberId, chamaId }: PredictiveInsightsProps) {
  const [insights, setInsights] = useState<MemberRiskScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [memberId, chamaId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await calculateMemberRiskScore(memberId, chamaId);
      setInsights(data);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-purple-600">Analyzing with AI...</span>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case "high":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">AI Predictive Insights</h3>
          <p className="text-xs text-gray-600">Powered by Gemini AI</p>
        </div>
      </div>

      {/* Risk Score */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Risk Score</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getRiskColor(insights.riskScore)}`}>
              {insights.riskScore}
            </span>
            <span className="text-gray-400">/100</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                insights.riskScore >= 70
                  ? "bg-green-500"
                  : insights.riskScore >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${insights.riskScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Reliability</p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getReliabilityColor(
              insights.reliability
            )}`}
          >
            {insights.reliability.toUpperCase()}
          </span>
          <p className="text-xs text-gray-500 mt-2">
            Default Risk: {insights.defaultRisk}%
          </p>
        </div>
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500">Optimal Loan</p>
          </div>
          <p className="text-xl font-bold text-gray-800">
            KES {insights.optimalLoanAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Safe lending amount</p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-500">6-Month Forecast</p>
          </div>
          <p className="text-xl font-bold text-gray-800">
            KES {insights.predictedBalance6Months.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Predicted balance</p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-2 font-medium">AI Analysis:</p>
        <ul className="space-y-2">
          {insights.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warning for high risk */}
      {insights.defaultRisk > 60 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">High Default Risk</p>
            <p className="text-xs text-red-600 mt-1">
              Consider requiring additional collateral or reducing loan amount
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
