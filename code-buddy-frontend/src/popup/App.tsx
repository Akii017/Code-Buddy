import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const BACKEND_URL = "http://localhost:8000"; // Update if backend runs elsewhere

const App: React.FC = () => {
  const [problemTitle, setProblemTitle] = useState<string>("");

  // Results
  const [hint, setHint] = useState<string>("");

  // Loading states
  const [loadingHint, setLoadingHint] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  // Add state for companies
  const [companies, setCompanies] = useState<{ name: string; year: string }[]>(
    []
  );
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Add state for similar problems
  const [similarProblems, setSimilarProblems] = useState<string[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(["problemDescription"], (result) => {
        if (result.problemDescription)
          setProblemTitle(result.problemDescription);
      });

      function handleMessage(message: any) {
        if (message.type === "PROBLEM_START") {
          setProblemTitle(message.description || "");
        }
      }
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, []);

  // Fetch companies when problemTitle changes
  useEffect(() => {
    if (problemTitle) {
      setLoadingCompanies(true);
      fetch(`${BACKEND_URL}/companies_asked`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_description: problemTitle }),
      })
        .then((res) => res.json())
        .then((data) => setCompanies(data.companies || []))
        .catch(() => setCompanies([]))
        .finally(() => setLoadingCompanies(false));
    }
  }, [problemTitle]);

  return (
    <div
      className={`transition-all duration-300 w-[400px] min-h-[400px] max-h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4`}
      style={{ overflowY: "auto" }}
    >
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            Code Buddy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* BUTTONS & VIDEO (NOT SCROLLABLE) */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-row gap-2">
              {/* Get Hint Button */}
              <Button
                variant="secondary"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 border-2 border-blue-400"
                disabled={!problemTitle || loadingHint}
                onClick={async () => {
                  setActiveTab("hint");
                  setShowVideo(false);
                  setHint("");
                  setLoadingHint(true);
                  try {
                    const res = await fetch(`${BACKEND_URL}/hint`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        problem_description: problemTitle,
                      }),
                    });
                    const data = await res.json();
                    setHint(data.hint || "[No hint available]");
                  } catch {
                    setHint("[Error fetching hint]");
                  }
                  setLoadingHint(false);
                }}
              >
                {loadingHint ? "Loading..." : "Get Hint"}
              </Button>
              {/* Learn Button */}
              <Button
                variant="secondary"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-bold shadow-lg hover:from-yellow-600 hover:to-yellow-800 border-2 border-yellow-400"
                disabled={!problemTitle}
                onClick={() => {
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                      if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                          type: "OPEN_LEARN_OVERLAY",
                        });
                        window.close();
                      }
                    }
                  );
                }}
              >
                Learn
              </Button>
            </div>
            <div className="flex flex-row gap-2">
              {/* Find Error Button */}
              <Button
                variant="secondary"
                className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white font-bold shadow-lg hover:from-green-600 hover:to-green-800 border-2 border-green-400"
                disabled={!problemTitle}
                onClick={async () => {
                  setActiveTab("similar");
                  setShowVideo(false);
                  setLoadingSimilar(true);
                  try {
                    const res = await fetch(`${BACKEND_URL}/similar_problems`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        problem_description: problemTitle,
                      }),
                    });
                    const data = await res.json();
                    setSimilarProblems((data.similar || []).slice(0, 5));
                  } catch {
                    setSimilarProblems(["[Error fetching similar problems]"]);
                  }
                  setLoadingSimilar(false);
                }}
              >
                {loadingSimilar ? "Loading..." : "Similar Problems"}
              </Button>
              {/* Optimal Solution Button */}
              <Button
                variant="secondary"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold shadow-lg hover:from-purple-600 hover:to-purple-800 border-2 border-purple-400"
                disabled={!problemTitle}
                onClick={() => {
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                      if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                          type: "OPEN_OPTIMAL_OVERLAY",
                          problemTitle,
                        });
                        window.close();
                      }
                    }
                  );
                }}
              >
                Optimal Solution
              </Button>
            </div>
          </div>
          {/* SCROLLABLE CONTENT */}
          <ScrollArea
            className="pr-4"
            style={{
              maxHeight: showVideo && activeTab === "video" ? 350 : 400,
            }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-200">
                  Current Problem
                </h3>
                <p className="text-sm text-gray-400">
                  {problemTitle ? problemTitle : "No problem detected"}
                </p>
              </div>
              <Separator className="bg-gray-700" />
              {/* Results display, only show the active tab's content except video */}
              {activeTab === "hint" && hint && (
                <div className="mt-2 text-green-300 whitespace-pre-line">
                  {hint}
                </div>
              )}
              {activeTab === "similar" && (
                <div className="mt-2">
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">
                    Similar Problems
                  </h4>
                  {loadingSimilar ? (
                    <div className="text-gray-400">Loading...</div>
                  ) : similarProblems.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-400 text-xs">
                      {similarProblems.map((title, idx) => (
                        <li key={idx}>{title}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 text-xs">
                      No similar problems found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-1">
              Companies Asked
            </h4>
            {loadingCompanies ? (
              <div className="text-gray-400">Loading...</div>
            ) : companies.length > 0 ? (
              <ul className="list-disc list-inside text-gray-400 text-xs">
                {companies.map((c, idx) => (
                  <li key={idx}>
                    {c.name} ({c.year})
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-xs">
                No company data found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
