// Content script for Code Buddy
console.log('Code Buddy content script loaded.');

// Function to extract problem title only
function getProblemTitle(): string {
  return document.querySelector('.text-title-large a')?.textContent?.trim() || '';
}

// Function to observe DOM changes for submission results
function observeSubmissions() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');
        if (resultElement) {
          const isSuccess = resultElement.textContent?.includes('Success');
          const details = resultElement.textContent || '';
          const codeElement = document.querySelector('[data-mode-id="text/x-python"]') || 
                            document.querySelector('[data-mode-id="text/javascript"]');
          const code = codeElement?.textContent || '';

          // Store code and error/result in chrome.storage.local
          chrome.storage.local.set({
            userCode: code,
            submissionError: isSuccess ? '' : details
          });

          chrome.runtime.sendMessage({
            type: 'SUBMISSION_RESULT',
            result: isSuccess ? 'success' : 'error',
            details,
            code
          });
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to extract code from Monaco editor on submissions page
function extractSubmissionCode(): string | null {
  const codeContainer = document.querySelector('.flexlayout__tabset_content .view-lines');
  if (!codeContainer) return null;
  const lines = Array.from(codeContainer.querySelectorAll('.view-line'));
  return lines.map(line => line.textContent || '').join('\n');
}

// Initialize when the page loads
function initialize() {
  // Check if we're on a LeetCode problem page
  if (window.location.pathname.includes('/problems/')) {
    const title = getProblemTitle();
    console.log('Detected problem title:', title);
    if (title) {
      chrome.runtime.sendMessage({
        type: 'PROBLEM_START',
        description: title
      });
      chrome.storage.local.set({ problemDescription: title });
      console.log('Sent PROBLEM_START', title);
    }
    // Start observing for submissions
    observeSubmissions();
  } else if (window.location.pathname.includes('/submissions/')) {
    // On submissions page, try to extract code
    setTimeout(() => {
      const code = extractSubmissionCode();
      if (code) {
        chrome.storage.local.set({ userCode: code });
        chrome.runtime.sendMessage({
          type: 'SUBMISSION_CODE',
          code
        });
        console.log('Extracted submission code:', code);
      } else {
        console.log('Could not extract code from submissions page.');
      }
    }, 1000); // Wait for DOM to render
  }
}

// Run initialization
initialize();

// Listen for page changes (for SPA navigation)
window.addEventListener('popstate', initialize);
window.addEventListener('pushstate', initialize);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "OPEN_LEARN_OVERLAY") {
    if (document.getElementById("code-buddy-learn-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "code-buddy-learn-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.95)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "20px";
    closeBtn.style.right = "30px";
    closeBtn.style.fontSize = "2rem";
    closeBtn.style.background = "none";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = () => overlay.remove();
    overlay.appendChild(closeBtn);
    // Loading and error elements
    const loadingDiv = document.createElement("div");
    loadingDiv.innerText = "Loading video...";
    loadingDiv.style.color = "#fff";
    loadingDiv.style.fontSize = "1.2rem";
    overlay.appendChild(loadingDiv);
    const errorDiv = document.createElement("div");
    errorDiv.style.color = "#ff6666";
    errorDiv.style.fontSize = "1.2rem";
    errorDiv.style.display = "none";
    overlay.appendChild(errorDiv);
    document.body.appendChild(overlay);
    // Get problem title from chrome.storage.local
    chrome.storage.local.get(["problemDescription"], (result) => {
      const problemTitle = result.problemDescription;
      if (!problemTitle) {
        loadingDiv.style.display = "none";
        errorDiv.innerText = "No problem detected.";
        errorDiv.style.display = "block";
        return;
      }
      // Fetch videoId from backend
      fetch("http://localhost:8000/youtube_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `LeetCode ${problemTitle} solution` }),
      })
        .then((res) => res.json())
        .then((data) => {
          loadingDiv.style.display = "none";
          if (data.videoId) {
            const video = document.createElement("iframe");
            video.width = "90%";
            video.height = "80%";
            video.src = `https://www.youtube.com/embed/${data.videoId}`;
            video.title = "YouTube video player";
            video.frameBorder = "0";
            video.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            video.allowFullscreen = true;
            overlay.appendChild(video);
          } else {
            errorDiv.innerText = data.error || "No video found.";
            errorDiv.style.display = "block";
          }
        })
        .catch(() => {
          loadingDiv.style.display = "none";
          errorDiv.innerText = "Error fetching video.";
          errorDiv.style.display = "block";
        });
    });
  }
  if (message.type === "OPEN_OPTIMAL_OVERLAY") {
    if (document.getElementById("code-buddy-optimal-overlay")) return;
    // Overlay background
    const overlay = document.createElement("div");
    overlay.id = "code-buddy-optimal-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(20, 20, 40, 0.85)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.overflowY = "auto";
    // Card container
    const card = document.createElement("div");
    card.style.background = "#18181b";
    card.style.borderRadius = "18px";
    card.style.padding = "36px 32px 32px 32px";
    card.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.37)";
    card.style.maxWidth = "700px";
    card.style.width = "90vw";
    card.style.maxHeight = "90vh";
    card.style.overflowY = "auto";
    card.style.position = "relative";
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "18px";
    closeBtn.style.right = "22px";
    closeBtn.style.width = "36px";
    closeBtn.style.height = "36px";
    closeBtn.style.borderRadius = "50%";
    closeBtn.style.background = "#232136";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "1.5rem";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.transition = "background 0.2s";
    closeBtn.onmouseenter = () => (closeBtn.style.background = "#a78bfa");
    closeBtn.onmouseleave = () => (closeBtn.style.background = "#232136");
    closeBtn.onclick = () => overlay.remove();
    card.appendChild(closeBtn);
    // Title
    const title = document.createElement("h2");
    title.innerText = "Optimal & Brute-force Solution";
    title.style.color = "#fff";
    title.style.fontSize = "2rem";
    title.style.fontWeight = "bold";
    title.style.margin = "0 0 24px 0";
    title.style.textAlign = "center";
    card.appendChild(title);
    // Loading
    const loadingDiv = document.createElement("div");
    loadingDiv.innerText = "Loading solution...";
    loadingDiv.style.color = "#fff";
    loadingDiv.style.fontSize = "1.2rem";
    loadingDiv.style.margin = "32px";
    card.appendChild(loadingDiv);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    // Fetch optimal solution from backend
    fetch("http://localhost:8000/optimal_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem_description: message.problemTitle }),
    })
      .then((res) => res.json())
      .then((data) => {
        loadingDiv.remove();
        if (data.error) {
          const err = document.createElement("div");
          err.innerText = data.error;
          err.style.color = "#ff6666";
          card.appendChild(err);
          return;
        }
        // Tab state
        let optimalLang = "python";
        let bruteLang = "python";
        // Tab buttons
        const langs = [
          { key: "cpp", label: "C++" },
          { key: "java", label: "Java" },
          { key: "python", label: "Python" },
          { key: "javascript", label: "Javascript" },
        ];
        // Helper to create tab buttons
        function createTabBar(selected: any, setSelected: any, color: any) {
          const bar = document.createElement("div");
          bar.style.marginBottom = "12px";
          langs.forEach(({ key, label }) => {
            const btn = document.createElement("button");
            btn.innerText = label;
            btn.style.marginRight = "10px";
            btn.style.padding = "6px 18px";
            btn.style.borderRadius = "6px";
            btn.style.border = selected === key ? `2px solid ${color}` : "1px solid #444";
            btn.style.background = selected === key ? color : "#232136";
            btn.style.color = selected === key ? "#fff" : "#a1a1aa";
            btn.style.fontWeight = selected === key ? "bold" : "normal";
            btn.style.fontSize = "1rem";
            btn.style.cursor = "pointer";
            btn.style.transition = "background 0.2s, color 0.2s";
            btn.onmouseenter = () => {
              if (selected !== key) btn.style.background = "#312e81";
            };
            btn.onmouseleave = () => {
              btn.style.background = selected === key ? color : "#232136";
            };
            btn.onclick = () => {
              setSelected(key);
              renderContent();
            };
            bar.appendChild(btn);
          });
          return bar;
        }
        // Helper to create code block
        function createCodeBlock(code: any) {
          const wrap = document.createElement("div");
          wrap.style.maxHeight = "320px";
          wrap.style.overflow = "auto";
          wrap.style.background = "#232136";
          wrap.style.borderRadius = "8px";
          wrap.style.padding = "16px";
          wrap.style.marginBottom = "18px";
          wrap.style.fontFamily = "'Fira Mono', 'Consolas', 'monospace'";
          wrap.style.fontSize = "15px";
          wrap.style.color = "#f1f5f9";
          const pre = document.createElement("pre");
          pre.style.margin = "0";
          pre.style.whiteSpace = "pre";
          pre.style.fontFamily = "inherit";
          pre.style.fontSize = "inherit";
          pre.innerText = code;
          wrap.appendChild(pre);
          return wrap;
        }
        // Main content rendering
        let contentDiv = document.createElement("div");
        contentDiv.style.width = "100%";
        card.appendChild(contentDiv);
        function sectionHeader(text: any) {
          const h = document.createElement("h3");
          h.innerText = text;
          h.style.color = "#a78bfa";
          h.style.fontSize = "1.25rem";
          h.style.fontWeight = "bold";
          h.style.margin = "24px 0 10px 0";
          return h;
        }
        function renderContent() {
          contentDiv.innerHTML = "";
          // Optimal Solution
          contentDiv.appendChild(sectionHeader("Optimal Solution"));
          contentDiv.appendChild(createTabBar(optimalLang, (k: any) => (optimalLang = k), "#a78bfa"));
          let optCode = data[`optimal_code_${optimalLang}`];
          contentDiv.appendChild(createCodeBlock(optCode));
          // Explanation and complexities
          const optExp = document.createElement("div");
          optExp.innerHTML = `<b style='color:#fbbf24'>Explanation:</b> <span style='color:#e0e7ef'>${data.optimal_explanation}</span>`;
          optExp.style.marginBottom = "10px";
          contentDiv.appendChild(optExp);
          const optTime = document.createElement("div");
          optTime.innerHTML = `<b style='color:#fbbf24'>Time Complexity:</b> <span style='color:#e0e7ef'>${data.optimal_time_complexity}</span>`;
          optTime.style.marginBottom = "4px";
          contentDiv.appendChild(optTime);
          const optSpace = document.createElement("div");
          optSpace.innerHTML = `<b style='color:#fbbf24'>Space Complexity:</b> <span style='color:#e0e7ef'>${data.optimal_space_complexity}</span>`;
          optSpace.style.marginBottom = "18px";
          contentDiv.appendChild(optSpace);
          // Brute-force Solution
          contentDiv.appendChild(sectionHeader("Brute-force Solution"));
          contentDiv.appendChild(createTabBar(bruteLang, (k: any) => (bruteLang = k), "#f472b6"));
          let bruteCode = data[`brute_code_${bruteLang}`];
          contentDiv.appendChild(createCodeBlock(bruteCode));
          // Brute explanation and complexities
          const bruteExp = document.createElement("div");
          bruteExp.innerHTML = `<b style='color:#fbbf24'>Explanation:</b> <span style='color:#e0e7ef'>${data.brute_explanation}</span>`;
          bruteExp.style.marginBottom = "10px";
          contentDiv.appendChild(bruteExp);
          const bruteTime = document.createElement("div");
          bruteTime.innerHTML = `<b style='color:#fbbf24'>Time Complexity:</b> <span style='color:#e0e7ef'>${data.brute_time_complexity}</span>`;
          bruteTime.style.marginBottom = "4px";
          contentDiv.appendChild(bruteTime);
          const bruteSpace = document.createElement("div");
          bruteSpace.innerHTML = `<b style='color:#fbbf24'>Space Complexity:</b> <span style='color:#e0e7ef'>${data.brute_space_complexity}</span>`;
          bruteSpace.style.marginBottom = "18px";
          contentDiv.appendChild(bruteSpace);
          // Comparison
          contentDiv.appendChild(sectionHeader("Comparison"));
          const comp = document.createElement("div");
          comp.innerText = data.comparison;
          comp.style.color = "#e0e7ef";
          comp.style.marginBottom = "10px";
          contentDiv.appendChild(comp);
        }
        renderContent();
      })
      .catch(() => {
        loadingDiv.innerText = "Error fetching solution.";
      });
  }
});