/* ── RUPIQ AI · All-in-one JS with Supabase Auth ── */

import { supabase, saveAIReport, upsertUserProfile } from "./supabase.js";

document.addEventListener("DOMContentLoaded", function () {
  window.onerror = function (m, s, l, c, e) {
    console.error("RUPIQ ERR", m, "line", l, e);
  };

  /* THEME */
  const html = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");
  function setTheme(t) {
    if (!themeBtn) return;
    html.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
    localStorage.setItem("rupiq-theme", t);
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      setTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
  setTheme(localStorage.getItem("rupiq-theme") || "dark");

  /* AUTH with Supabase */
  let currentUser = null;
  let pendingAction = null;

  function updateNavAuth() {
    const guest = document.getElementById("navGuest");
    const user = document.getElementById("navUser");
    if (!guest || !user) return;

    if (currentUser) {
      guest.style.display = "none";
      user.style.display = "flex";
      const navAvatar = document.getElementById("navAvatar");
      const navUsername = document.getElementById("navUsername");
      if (navAvatar && currentUser.user_metadata?.name) {
        navAvatar.textContent = currentUser.user_metadata.name[0].toUpperCase();
      } else if (navAvatar && currentUser.email) {
        navAvatar.textContent = currentUser.email[0].toUpperCase();
      }
      if (navUsername && currentUser.user_metadata?.name) {
        navUsername.textContent = currentUser.user_metadata.name.split(" ")[0];
      } else if (navUsername && currentUser.email) {
        navUsername.textContent = currentUser.email.split("@")[0];
      }
    } else {
      guest.style.display = "flex";
      user.style.display = "none";
    }
  }

  // Initialize auth state
  async function initAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
    }
    updateNavAuth();
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event);
    if (session?.user) {
      currentUser = session.user;
    } else {
      currentUser = null;
    }
    updateNavAuth();
  });

  initAuth();

  function openAuth(tab) {
    const authOverlay = document.getElementById("authOverlay");
    if (!authOverlay) return;

    tab = tab || "login";
    authOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    switchTab(tab);
    const authError = document.getElementById("authError");
    const authSuccess = document.getElementById("authSuccess");
    if (authError) authError.style.display = "none";
    if (authSuccess) authSuccess.style.display = "none";
  }

  function closeAuth() {
    const authOverlay = document.getElementById("authOverlay");
    if (!authOverlay) return;
    authOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function handleAuthClick(e) {
    const authOverlay = document.getElementById("authOverlay");
    if (e.target === authOverlay) closeAuth();
  }

  function switchTab(t) {
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginPage = document.getElementById("loginPage");
    const signupPage = document.getElementById("signupPage");
    const authError = document.getElementById("authError");
    const authSuccess = document.getElementById("authSuccess");

    if (tabLogin) tabLogin.classList.toggle("active", t === "login");
    if (tabSignup) tabSignup.classList.toggle("active", t === "signup");
    if (loginPage) loginPage.classList.toggle("active", t === "login");
    if (signupPage) signupPage.classList.toggle("active", t === "signup");
    if (authError) authError.style.display = "none";
    if (authSuccess) authSuccess.style.display = "none";
  }

  function showAuthError(msg) {
    const el = document.getElementById("authError");
    const successEl = document.getElementById("authSuccess");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
    if (successEl) successEl.style.display = "none";
  }

  function showAuthSuccess(msg) {
    const el = document.getElementById("authSuccess");
    const errorEl = document.getElementById("authError");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
    if (errorEl) errorEl.style.display = "none";
  }

  async function doLogin() {
    const emailEl = document.getElementById("loginEmail");
    const passEl = document.getElementById("loginPass");
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim();
    const pass = passEl.value;

    if (!email || !pass) {
      showAuthError("Please fill in all fields.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (error) throw error;

      currentUser = data.user;
      const userName =
        data.user.user_metadata?.name || data.user.email.split("@")[0];
      showAuthSuccess("Welcome back, " + userName.split(" ")[0] + "!");
      updateNavAuth();
      setTimeout(() => {
        closeAuth();
        if (pendingAction) {
          pendingAction();
          pendingAction = null;
        }
      }, 900);
    } catch (error) {
      console.error("Login error:", error);
      showAuthError(error.message || "Login failed. Please try again.");
    }
  }

  async function doSignup() {
    const nameEl = document.getElementById("signupName");
    const emailEl = document.getElementById("signupEmail");
    const passEl = document.getElementById("signupPass");
    if (!nameEl || !emailEl || !passEl) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const pass = passEl.value;

    if (!name || !email || !pass) {
      showAuthError("Please fill in all fields.");
      return;
    }
    if (pass.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showAuthError("Please enter a valid email.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: pass,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      currentUser = data.user;
      showAuthSuccess("Welcome to RUPIQ AI, " + name.split(" ")[0] + "!");
      updateNavAuth();
      setTimeout(() => {
        closeAuth();
        if (pendingAction) {
          pendingAction();
          pendingAction = null;
        }
      }, 900);
    } catch (error) {
      console.error("Signup error:", error);
      showAuthError(error.message || "Signup failed. Please try again.");
    }
  }

  async function logOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      currentUser = null;
      updateNavAuth();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  function requireLogin(action) {
    if (currentUser) {
      action();
      return;
    }
    pendingAction = action;
    openAuth("login");
  }

  /* ANALYSIS MODAL */
  let currentFeature = "fire";
  const featureConfig = {
    health: {
      icon: "📊",
      title: "Money Health Score",
      sub: "Get a 0–100 score with full financial breakdown",
      badge: "Health Analysis",
    },
    fire: {
      icon: "🚀",
      title: "FIRE Planner",
      sub: "Your personalised path to early retirement",
      badge: "FIRE Planning",
    },
    tax: {
      icon: "💰",
      title: "Tax Optimizer",
      sub: "Maximise savings with smart tax strategies",
      badge: "Tax Analysis",
    },
    invest: {
      icon: "📈",
      title: "Investment Guidance",
      sub: "Custom portfolio strategy for your goals",
      badge: "Portfolio Analysis",
    },
  };

  function openModal(feature) {
    console.log("openModal:", feature);
    currentFeature = feature || "fire";
    const cfg = featureConfig[currentFeature];

    const modalIcon = document.getElementById("modalIcon");
    const modalTitle = document.getElementById("modalTitle");
    const modalSub = document.getElementById("modalSub");
    const resultPanel = document.getElementById("resultPanel");
    const errorMsg = document.getElementById("errorMsg");
    const modalOverlay = document.getElementById("modalOverlay");

    if (modalIcon) modalIcon.textContent = cfg.icon;
    if (modalTitle) modalTitle.textContent = cfg.title;
    if (modalSub) modalSub.textContent = cfg.sub;
    if (resultPanel) resultPanel.classList.remove("show");
    if (errorMsg) errorMsg.style.display = "none";
    if (modalOverlay) {
      modalOverlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) {
      modalOverlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  function handleModalClick(e) {
    const modalOverlay = document.getElementById("modalOverlay");
    if (e.target === modalOverlay) closeModal();
  }

  /* FORMAT */
  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 10000000) return "\u20B9" + (n / 10000000).toFixed(1) + "Cr";
    if (n >= 100000) return "\u20B9" + (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return "\u20B9" + (n / 1000).toFixed(0) + "K";
    return "\u20B9" + n;
  }

  /* GROQ CONFIG */
  var GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
  var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  var GROQ_MODEL = "llama-3.1-8b-instant";

  /* PROMPT BUILDERS */
  function buildFirePrompt(inc, exp, sav, age, goal) {
    var sr = inc > 0 ? Math.round((sav / inc) * 100) : 0;
    var annExp = exp * 12;
    var fireNum = annExp * 25; // 4% rule
    var prompt =
      "You are a FIRE (Financial Independence, Retire Early) planning expert specialised in India.\n\n";
    prompt += "USER PROFILE:\n";
    prompt += "Monthly Income: Rs" + inc + "\n";
    prompt += "Monthly Expenses: Rs" + exp + "\n";
    prompt += "Monthly Savings: Rs" + sav + " (" + sr + "% savings rate)\n";
    prompt += "Annual Expenses: Rs" + annExp + "\n";
    prompt += "Current Age: " + age + " years\n";
    prompt += "Goal: " + goal + "\n\n";
    prompt +=
      "FIRE Number estimate (25x annual expenses): Rs" + fireNum + "\n\n";
    prompt +=
      "Respond ONLY with a single valid JSON object. No markdown fences, no explanation, just JSON.\n";
    prompt +=
      "Required structure (replace every number/string with real calculated values):\n";
    prompt += '{"fire_number":' + fireNum + ",";
    prompt += '"current_retirement_age":60,';
    prompt += '"optimized_retirement_age":48,';
    prompt += '"years_to_fire":20,';
    prompt += '"summary":"Write 2-3 sentences specific to this user.",';
    prompt += '"monthly_investment_needed":' + Math.round(sav * 0.9) + ",";
    prompt += '"investment_breakdown":[';
    prompt +=
      '{"instrument":"Equity SIP (Mutual Funds)","amount":' +
      Math.round(sav * 0.55) +
      ',"expected_return":"12-15%","reason":"Core wealth builder for FIRE corpus"},';
    prompt +=
      '{"instrument":"PPF (Public Provident Fund)","amount":12500,"expected_return":"7.1%","reason":"Tax-free guaranteed debt allocation"},';
    prompt +=
      '{"instrument":"NPS (National Pension System)","amount":' +
      Math.round(sav * 0.1) +
      ',"expected_return":"10-12%","reason":"Additional 80CCD tax deduction"},';
    prompt +=
      '{"instrument":"Emergency Fund (Liquid Fund)","amount":' +
      Math.round(sav * 0.07) +
      ',"expected_return":"6-7%","reason":"6-month expense buffer"}';
    prompt += "],";
    prompt += '"milestones":[';
    prompt +=
      '{"age":' +
      (age + 3) +
      ',"milestone":"Emergency fund and debt free","target_corpus":' +
      exp * 6 +
      "},";
    prompt +=
      '{"age":' +
      (age + 10) +
      ',"milestone":"Half FIRE corpus reached","target_corpus":' +
      Math.round(fireNum / 2) +
      "},";
    prompt +=
      '{"age":' +
      (age + 18) +
      ',"milestone":"FIRE achieved - retire!","target_corpus":' +
      fireNum +
      "}";
    prompt += "],";
    prompt +=
      '"lifestyle_tips":["Automate all SIPs on salary day","Increase SIP by 10 percent every April","Track expenses weekly"],';
    prompt +=
      '"key_metric":"Motivational insight with specific rupee numbers and timeline for this user."}';
    prompt +=
      "\n\nCalculate real numbers using 12% equity returns and 7% inflation. Be very specific to this user profile.";
    return prompt;
  }

  function buildHealthPrompt(inc, exp, sav, age, goal) {
    var sr = inc > 0 ? Math.round((sav / inc) * 100) : 0;
    var prompt =
      "You are an expert personal finance advisor for Indian users.\n\n";
    prompt +=
      "USER PROFILE:\nMonthly Income: Rs" +
      inc +
      "\nMonthly Expenses: Rs" +
      exp +
      "\nMonthly Savings: Rs" +
      sav +
      " (" +
      sr +
      "% rate)\nAge: " +
      age +
      "\nGoal: " +
      goal +
      "\n\n";
    prompt += "Respond ONLY with valid JSON (no markdown). Structure:\n";
    prompt +=
      '{"score":72,"grade":"B","summary":"2-3 sentence assessment specific to user.",';
    prompt += '"strengths":["strength1","strength2","strength3"],';
    prompt += '"weaknesses":["weakness1","weakness2"],';
    prompt +=
      '"action_items":[{"priority":"High","action":"action here","impact":"impact here"},{"priority":"Medium","action":"action here","impact":"impact here"},{"priority":"Low","action":"action here","impact":"impact here"}],';
    prompt +=
      '"monthly_budget_suggestion":{"needs":50,"wants":20,"savings":15,"investments":15},';
    prompt +=
      '"key_metric":"One motivational insight with specific rupee numbers."}\n\n';
    prompt +=
      "Score based on: savings rate (ideal 20%+), expense ratio, age-appropriate savings. Use Indian context (SIP, PPF, FD, ELSS).";
    return prompt;
  }

  function buildTaxPrompt(inc, exp, sav, age, goal) {
    var annInc = inc * 12;
    var prompt = "You are a senior Indian tax consultant.\n\n";
    prompt +=
      "USER PROFILE:\nMonthly Income: Rs" +
      inc +
      " | Annual: Rs" +
      annInc +
      "\nMonthly Expenses: Rs" +
      exp +
      "\nMonthly Savings: Rs" +
      sav +
      "\nAge: " +
      age +
      "\nGoal: " +
      goal +
      "\n\n";
    prompt += "Respond ONLY with valid JSON (no markdown). Structure:\n";
    prompt +=
      '{"annual_income":' +
      annInc +
      ',"old_regime_tax":80000,"new_regime_tax":65000,"recommended_regime":"New","potential_savings":45000,';
    prompt += '"summary":"2-3 sentence tax overview specific to user.",';
    prompt +=
      '"deductions_available":[{"section":"80C","instruments":["ELSS","PPF","Life Insurance"],"max_limit":150000,"current_utilization":100000,"tax_saving":30000},{"section":"80D","instruments":["Health Insurance"],"max_limit":25000,"current_utilization":15000,"tax_saving":4500},{"section":"HRA","instruments":["House Rent Allowance"],"max_limit":"Varies","current_utilization":"If renting","tax_saving":20000},{"section":"80CCD(1B)","instruments":["NPS"],"max_limit":50000,"current_utilization":25000,"tax_saving":7500}],';
    prompt +=
      '"action_plan":[{"action":"action1","instrument":"product","invest_amount":50000,"tax_saved":15000,"deadline":"March 31"},{"action":"action2","instrument":"product","invest_amount":25000,"tax_saved":7500,"deadline":"March 31"},{"action":"action3","instrument":"product","invest_amount":15000,"tax_saved":4500,"deadline":"March 31"}],';
    prompt +=
      '"regime_comparison":{"old_regime_pros":["pro1","pro2"],"new_regime_pros":["pro1","pro2"],"verdict":"Clear recommendation with reasoning."},';
    prompt +=
      '"key_metric":"Most impactful tax saving with specific rupee numbers."}\n\n';
    prompt +=
      "Use FY2024-25 tax slabs. Calculate real tax numbers for this income level.";
    return prompt;
  }

  function buildInvestPrompt(inc, exp, sav, age, goal) {
    var sr = inc > 0 ? Math.round((sav / inc) * 100) : 0;
    var riskProfile =
      age < 30 ? "Aggressive" : age < 45 ? "Moderate" : "Conservative";
    var prompt =
      "You are a SEBI-registered investment advisor for Indian markets.\n\n";
    prompt +=
      "USER PROFILE:\nMonthly Income: Rs" +
      inc +
      "\nInvestable Surplus: Rs" +
      sav +
      " (" +
      sr +
      "% rate)\nAge: " +
      age +
      "\nRisk Profile: " +
      riskProfile +
      "\nGoal: " +
      goal +
      "\n\n";
    prompt += "Respond ONLY with valid JSON (no markdown). Structure:\n";
    prompt +=
      '{"risk_profile":"' +
      riskProfile +
      '","investment_horizon":"long-term","monthly_investable_amount":' +
      sav +
      ",";
    prompt += '"summary":"2-3 sentence investment overview for this user.",';
    prompt +=
      '"portfolio_allocation":[{"asset":"Large Cap Equity (Nifty 50 Index Fund)","percentage":30,"monthly_amount":' +
      Math.round(sav * 0.3) +
      ',"expected_return":"10-12%","risk":"Medium"},{"asset":"Mid/Small Cap Equity","percentage":25,"monthly_amount":' +
      Math.round(sav * 0.25) +
      ',"expected_return":"14-18%","risk":"High"},{"asset":"Debt (PPF/FD)","percentage":25,"monthly_amount":' +
      Math.round(sav * 0.25) +
      ',"expected_return":"6-8%","risk":"Low"},{"asset":"Gold (SGB/ETF)","percentage":10,"monthly_amount":' +
      Math.round(sav * 0.1) +
      ',"expected_return":"8-10%","risk":"Medium"},{"asset":"International Equity","percentage":10,"monthly_amount":' +
      Math.round(sav * 0.1) +
      ',"expected_return":"12-15%","risk":"High"}],';
    prompt +=
      '"top_fund_picks":[{"fund":"Specific real fund name 1","type":"Large Cap Index","suggested_sip":' +
      Math.round(sav * 0.2) +
      ',"reason":"why this fund"},{"fund":"Specific real fund name 2","type":"Mid Cap","suggested_sip":' +
      Math.round(sav * 0.15) +
      ',"reason":"why this fund"},{"fund":"Specific real fund name 3","type":"ELSS","suggested_sip":' +
      Math.round(sav * 0.15) +
      ',"reason":"why this fund"}],';
    prompt +=
      '"wealth_projection":[{"years":5,"invested":' +
      sav * 60 +
      ',"expected_value":' +
      Math.round(sav * 60 * 1.7) +
      '},{"years":10,"invested":' +
      sav * 120 +
      ',"expected_value":' +
      Math.round(sav * 120 * 2.5) +
      '},{"years":20,"invested":' +
      sav * 240 +
      ',"expected_value":' +
      Math.round(sav * 240 * 5.5) +
      "}],";
    prompt += '"dos":["do1","do2","do3"],"donts":["dont1","dont2","dont3"],';
    prompt +=
      '"key_metric":"Most powerful wealth insight with specific rupee numbers for this user."}\n\n';
    prompt +=
      "Use real Indian fund names (Mirae, HDFC, Axis, Parag Parikh, etc). Calculate accurate projections.";
    return prompt;
  }

  /* SUBMIT */
  async function submitData() {
    const incomeEl = document.getElementById("income");
    const expensesEl = document.getElementById("expenses");
    const ageEl = document.getElementById("age");
    const goalEl = document.getElementById("goal");
    const riskEl = document.getElementById("risk");

    if (!incomeEl || !expensesEl || !ageEl || !goalEl || !riskEl) {
      showErr("Form elements not found.");
      return;
    }

    var income = parseInt(incomeEl.value) || 0;
    var expenses = parseInt(expensesEl.value) || 0;
    var age = parseInt(ageEl.value) || 0;
    var goal = goalEl.value.trim();
    var risk = riskEl.value || "moderate";

    if (!income || !expenses || !age || !goal) {
      showErr("Please fill in all fields.");
      return;
    }
    if (expenses >= income) {
      showErr("Expenses must be less than income.");
      return;
    }

    var btn = document.getElementById("analyzeBtn");
    var btnText = document.getElementById("btnText");
    var loader = document.getElementById("btnLoader");
    var resultPanel = document.getElementById("resultPanel");
    var errorMsg = document.getElementById("errorMsg");

    if (!btn || !btnText || !loader) return;

    btn.disabled = true;
    btnText.textContent = "Analyzing with AI...";
    loader.style.display = "block";
    if (resultPanel) resultPanel.classList.remove("show");
    if (errorMsg) errorMsg.style.display = "none";

    var savings = income - expenses;
    var fullGoal = goal + " (Risk preference: " + risk + ")";
    var prompt;
    if (currentFeature === "fire")
      prompt = buildFirePrompt(income, expenses, savings, age, fullGoal);
    else if (currentFeature === "tax")
      prompt = buildTaxPrompt(income, expenses, savings, age, fullGoal);
    else if (currentFeature === "invest")
      prompt = buildInvestPrompt(income, expenses, savings, age, fullGoal);
    else prompt = buildHealthPrompt(income, expenses, savings, age, fullGoal);

    console.log("Calling Groq for feature:", currentFeature);

    try {
      var res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + GROQ_KEY,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        var errBody = await res.json().catch(function () {
          return {};
        });
        throw new Error(
          (errBody.error && errBody.error.message) ||
            "Groq API error " + res.status,
        );
      }
      var data = await res.json();
      var rawAdvice = data.choices[0].message.content;
      console.log("Groq raw response:", rawAdvice.slice(0, 200));

      var parsed = null;
      try {
        var clean = rawAdvice
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        var s = clean.indexOf("{");
        var e = clean.lastIndexOf("}");
        if (s !== -1 && e !== -1) parsed = JSON.parse(clean.slice(s, e + 1));
      } catch (pe) {
        console.warn("JSON parse failed:", pe.message);
        parsed = null;
      }
      renderResult(savings, income, parsed, currentFeature, rawAdvice);

      // ── Save to Supabase if user is logged in ──
      if (currentUser) {
        try {
          // Upsert the user's financial profile
          await upsertUserProfile({
            user_id: currentUser.id,
            email: currentUser.email,
            income,
            expenses,
            savings,
            age,
            goal,
            risk,
            updated_at: new Date().toISOString(),
          });

          // Save the AI report
          await saveAIReport(
            currentUser.id,
            currentFeature,
            {
              raw: rawAdvice,
              parsed: parsed || null,
              input: { income, expenses, savings, age, goal, risk },
            },
            currentUser.email,
          );

          console.log("✅ Data saved to Supabase successfully");
        } catch (dbErr) {
          // Non-blocking: log but don't interrupt the user experience
          console.warn("Supabase save failed (non-critical):", dbErr.message);
        }
      }
    } catch (err) {
      console.error("submitData error:", err);
      showErr(
        "Analysis failed: " +
          err.message +
          ". Please check your internet connection and try again.",
      );
    } finally {
      btn.disabled = false;
      btnText.textContent = "Analyze with Groq AI";
      loader.style.display = "none";
    }
  }

  function showErr(msg) {
    var el = document.getElementById("errorMsg");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
  }

  /* RENDER */
  function renderResult(savings, income, data, feature, rawAdvice) {
    var panel = document.getElementById("resultPanel");
    var cfg = featureConfig[feature];
    var resultTitle = document.getElementById("resultTitle");
    var resultBadge = document.getElementById("resultBadge");
    var content = document.getElementById("resultContent");

    if (!panel || !resultTitle || !resultBadge || !content) return;

    resultTitle.textContent = cfg.title + " \u2014 Results";
    resultBadge.textContent = cfg.badge;

    var sr = Math.round((savings / income) * 100);
    var sumHTML =
      '<div class="savings-summary">' +
      '<div class="savings-chip"><div class="savings-chip-val pos">' +
      fmt(savings) +
      '</div><div class="savings-chip-label">Monthly Savings</div></div>' +
      '<div class="savings-chip"><div class="savings-chip-val ' +
      (sr >= 20 ? "pos" : "neg") +
      '">' +
      sr +
      '%</div><div class="savings-chip-label">Savings Rate</div></div>' +
      '<div class="savings-chip"><div class="savings-chip-val pos">' +
      fmt(savings * 12) +
      '</div><div class="savings-chip-label">Annual Savings</div></div>' +
      "</div>";
    if (!data) {
      content.innerHTML =
        sumHTML +
        '<div style="font-size:14px;color:var(--text2);line-height:1.7;white-space:pre-wrap;">' +
        rawAdvice +
        "</div>";
      panel.classList.add("show");
      return;
    }
    var h = sumHTML;
    if (feature === "health") h += renderHealth(data);
    else if (feature === "fire") h += renderFire(data);
    else if (feature === "tax") h += renderTax(data);
    else if (feature === "invest") h += renderInvest(data);
    if (data.key_metric)
      h +=
        '<div class="key-insight"><div class="key-insight-icon">\uD83D\uDCA1</div><div class="key-insight-text">' +
        data.key_metric +
        "</div></div>";
    content.innerHTML = h;
    panel.classList.add("show");
    if (feature === "health" && data.score) {
      var ring = document.getElementById("scoreRing");
      if (ring)
        setTimeout(function () {
          ring.style.setProperty("--pct", data.score + "%");
        }, 100);
    }
    document.querySelectorAll(".budget-bar-fill[data-w]").forEach(function (b) {
      setTimeout(function () {
        b.style.width = b.dataset.w;
      }, 150);
    });
  }

  function renderHealth(d) {
    var sc = d.score || 0;
    var gc =
      sc >= 80
        ? "var(--success)"
        : sc >= 60
          ? "var(--accent3)"
          : "var(--danger)";
    var h =
      '<div class="score-ring-container">' +
      '<div class="score-circle" id="scoreRing" style="--pct:0%">' +
      '<div class="score-inner"><div class="score-num" style="color:' +
      gc +
      '">' +
      sc +
      "</div>" +
      '<div class="score-grade">' +
      (d.grade || "") +
      "</div></div></div>" +
      '<div class="score-label">' +
      (d.summary || "") +
      "</div></div>";
    if (d.strengths && d.strengths.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\u2705 Strengths</div><div class="tag-list">' +
        d.strengths
          .map(function (s) {
            return '<span class="tag-success">' + s + "</span>";
          })
          .join("") +
        "</div></div>";
    if (d.weaknesses && d.weaknesses.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\u26A0\uFE0F Areas to Improve</div><div class="tag-list">' +
        d.weaknesses
          .map(function (w) {
            return '<span class="tag-warn">' + w + "</span>";
          })
          .join("") +
        "</div></div>";
    if (d.action_items && d.action_items.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83C\uDFAF Action Plan</div>' +
        d.action_items
          .map(function (a) {
            return (
              '<div class="action-item"><div class="priority-dot priority-' +
              (a.priority || "low").toLowerCase() +
              '"></div><div><div class="action-text">' +
              a.action +
              '</div><div class="action-impact">' +
              a.impact +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div>";
    if (d.monthly_budget_suggestion) {
      var b = d.monthly_budget_suggestion;
      var cs = ["#00d4ff", "#7c3aed", "#10b981", "#f59e0b"];
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCCA Ideal Budget Split</div><div class="budget-bars">' +
        [
          ["Needs", b.needs, cs[0]],
          ["Wants", b.wants, cs[1]],
          ["Savings", b.savings, cs[2]],
          ["Investments", b.investments, cs[3]],
        ]
          .map(function (x) {
            return (
              '<div class="budget-row"><div class="budget-label">' +
              x[0] +
              '</div><div class="budget-bar-bg"><div class="budget-bar-fill" style="background:' +
              x[2] +
              ';width:0%" data-w="' +
              x[1] +
              '%"></div></div><div class="budget-pct">' +
              x[1] +
              "%</div></div>"
            );
          })
          .join("") +
        "</div></div>";
    }
    return h;
  }

  function renderFire(d) {
    var h =
      '<div class="info-grid" style="margin-bottom:16px;">' +
      '<div class="info-box"><div class="info-val">' +
      fmt(d.fire_number || 0) +
      '</div><div class="info-lbl">FIRE Number</div></div>' +
      '<div class="info-box"><div class="info-val">' +
      (d.optimized_retirement_age || "--") +
      '</div><div class="info-lbl">Retire At Age</div></div>' +
      '<div class="info-box"><div class="info-val">' +
      (d.years_to_fire || "--") +
      ' yrs</div><div class="info-lbl">Years to FIRE</div></div>' +
      '<div class="info-box"><div class="info-val">' +
      fmt(d.monthly_investment_needed || 0) +
      '</div><div class="info-lbl">Monthly SIP</div></div>' +
      "</div>";
    if (d.summary)
      h +=
        '<p style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.6">' +
        d.summary +
        "</p>";
    if (d.investment_breakdown && d.investment_breakdown.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCE6 Monthly Investment Split</div>' +
        d.investment_breakdown
          .map(function (i) {
            return (
              '<div class="action-item"><div class="priority-dot" style="background:var(--accent)"></div><div><div class="action-text">' +
              i.instrument +
              " \u2014 " +
              fmt(i.amount || 0) +
              '/mo</div><div class="action-impact">' +
              i.expected_return +
              " \u00B7 " +
              i.reason +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div>";
    if (d.milestones && d.milestones.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83C\uDFC1 Milestones</div><div class="timeline">' +
        d.milestones
          .map(function (m, i) {
            return (
              '<div class="timeline-item"><div class="timeline-dot">' +
              (i + 1) +
              '</div><div class="timeline-content"><div class="timeline-title">Age ' +
              m.age +
              " \u2014 " +
              m.milestone +
              '</div><div class="timeline-sub">Target: ' +
              fmt(m.target_corpus || 0) +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div></div>";
    if (d.lifestyle_tips && d.lifestyle_tips.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCA1 Lifestyle Tips</div><div class="tag-list">' +
        d.lifestyle_tips
          .map(function (t) {
            return '<span class="tag-success">' + t + "</span>";
          })
          .join("") +
        "</div></div>";
    return h;
  }

  function renderTax(d) {
    var h =
      '<div class="compare-grid" style="margin-bottom:16px;">' +
      '<div class="compare-box ' +
      (d.recommended_regime === "Old" ? "highlight" : "") +
      '"><div class="compare-title">Old Regime</div><div class="compare-val">' +
      fmt(d.old_regime_tax || 0) +
      '</div><div class="compare-sub">Annual Tax</div></div>' +
      '<div class="compare-box ' +
      (d.recommended_regime === "New" ? "highlight" : "") +
      '"><div class="compare-title">New Regime</div><div class="compare-val">' +
      fmt(d.new_regime_tax || 0) +
      '</div><div class="compare-sub">Annual Tax</div></div>' +
      "</div>" +
      '<div style="padding:12px;border-radius:10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);margin-bottom:16px;">' +
      '<span style="font-size:12px;color:var(--success);font-weight:600;">\u2705 RECOMMENDED: ' +
      (d.recommended_regime || "--") +
      " Regime</span>" +
      '<span style="font-size:12px;color:var(--muted);margin-left:8px;">Save up to ' +
      fmt(d.potential_savings || 0) +
      "/year</span></div>";
    if (d.summary)
      h +=
        '<p style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.6">' +
        d.summary +
        "</p>";
    if (d.deductions_available && d.deductions_available.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83E\uDDFE Deductions</div>' +
        d.deductions_available
          .map(function (ded) {
            var instr = Array.isArray(ded.instruments)
              ? ded.instruments.join(", ")
              : ded.instruments;
            var lim =
              typeof ded.max_limit === "number"
                ? fmt(ded.max_limit)
                : ded.max_limit;
            return (
              '<div class="action-item"><div class="priority-dot priority-high"></div><div><div class="action-text">Sec ' +
              ded.section +
              " \u2014 Save " +
              fmt(ded.tax_saving || 0) +
              '</div><div class="action-impact">' +
              instr +
              " \u00B7 Limit: " +
              lim +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div>";
    if (d.action_plan && d.action_plan.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCCB Action Plan</div>' +
        d.action_plan
          .map(function (a) {
            return (
              '<div class="action-item"><div class="priority-dot priority-medium"></div><div><div class="action-text">' +
              a.action +
              " \u2192 " +
              fmt(a.tax_saved || 0) +
              ' saved</div><div class="action-impact">' +
              a.instrument +
              " \u00B7 " +
              a.deadline +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div>";
    if (d.regime_comparison && d.regime_comparison.verdict)
      h +=
        '<div class="key-insight"><div class="key-insight-icon">\u2696\uFE0F</div><div class="key-insight-text">' +
        d.regime_comparison.verdict +
        "</div></div>";
    return h;
  }

  function renderInvest(d) {
    var ac = ["#00d4ff", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];
    var h =
      '<div style="margin-bottom:14px;">' +
      '<span style="padding:5px 12px;border-radius:100px;font-size:12px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);color:var(--accent);font-weight:600;">' +
      (d.risk_profile || "--") +
      " Risk</span>" +
      '<span style="padding:5px 12px;border-radius:100px;font-size:12px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);color:#a78bfa;font-weight:600;margin-left:8px;">' +
      (d.investment_horizon || "--") +
      "</span></div>";
    if (d.summary)
      h +=
        '<p style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.6">' +
        d.summary +
        "</p>";
    if (d.portfolio_allocation && d.portfolio_allocation.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCCA Portfolio</div><div class="alloc-list">' +
        d.portfolio_allocation
          .map(function (a, i) {
            return (
              '<div class="alloc-item"><div class="alloc-color" style="background:' +
              ac[i % 5] +
              '"></div><div class="alloc-name">' +
              a.asset +
              '</div><div><div class="alloc-pct">' +
              a.percentage +
              '%</div><div class="alloc-amt">' +
              fmt(a.monthly_amount || 0) +
              "/mo</div></div></div>"
            );
          })
          .join("") +
        "</div></div>";
    if (d.wealth_projection && d.wealth_projection.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83D\uDCC8 Wealth Projection</div><div class="info-grid">' +
        d.wealth_projection
          .map(function (w) {
            return (
              '<div class="info-box"><div class="info-val">' +
              fmt(w.expected_value || 0) +
              '</div><div class="info-lbl">In ' +
              w.years +
              " Years</div></div>"
            );
          })
          .join("") +
        "</div></div>";
    if (d.top_fund_picks && d.top_fund_picks.length)
      h +=
        '<div class="res-section"><div class="res-section-title">\uD83C\uDFC6 Fund Picks</div>' +
        d.top_fund_picks
          .map(function (f) {
            return (
              '<div class="action-item"><div class="priority-dot priority-high"></div><div><div class="action-text">' +
              f.fund +
              " \u00B7 SIP " +
              fmt(f.suggested_sip || 0) +
              '/mo</div><div class="action-impact">' +
              f.type +
              " \u00B7 " +
              f.reason +
              "</div></div></div>"
            );
          })
          .join("") +
        "</div>";
    if ((d.dos && d.dos.length) || (d.donts && d.donts.length))
      h +=
        '<div class="res-section"><div class="res-section-title">\u2705 Do\'s &amp; \u274C Don\'ts</div><div class="tag-list">' +
        (d.dos || [])
          .map(function (x) {
            return '<span class="tag-success">\u2713 ' + x + "</span>";
          })
          .join("") +
        (d.donts || [])
          .map(function (x) {
            return '<span class="tag-warn">\u2717 ' + x + "</span>";
          })
          .join("") +
        "</div></div>";
    return h;
  }

  /* TESTIMONIALS */
  const testimonials = [
    {
      q: "RUPIQ AI found Rs48,000 in tax savings I had no idea about. Switched to old regime on its advice and saved big.",
      a: "Priya S., Software Engineer, Bengaluru",
    },
    {
      q: "The FIRE planner showed me I can retire at 42 if I just increase my SIP by Rs8,000/month. Game changer.",
      a: "Rahul M., Product Manager, Mumbai",
    },
    {
      q: "I was spending 68% of income on needs without realising it. The health score made it painfully clear and fixable.",
      a: "Ananya K., Teacher, Delhi",
    },
    {
      q: "Used the investment guidance and restructured my entire portfolio. The fund picks are actually solid, not generic.",
      a: "Vikram P., CA, Pune",
    },
    {
      q: "Finally an app that actually understands Indian tax law. The 80C breakdown was spot on for my salary range.",
      a: "Deepika R., HR Manager, Chennai",
    },
    {
      q: "Convinced my husband to use it. We now have a joint FIRE plan. Rs3.2Cr corpus target, and we are on track!",
      a: "Neha T., Entrepreneur, Hyderabad",
    },
    {
      q: "Was overwhelmed by investing. RUPIQ broke it down into simple monthly SIPs I could actually start.",
      a: "Siddharth J., Fresher, Kolkata",
    },
  ];
  function buildTrust() {
    var trustScroll = document.getElementById("trustScroll");
    if (!trustScroll) return;

    var all = [...testimonials, ...testimonials];
    var h = all
      .map(function (t) {
        return (
          '<div class="trust-card"><div class="trust-stars">\u2605\u2605\u2605\u2605\u2605</div><div class="trust-quote">"' +
          t.q +
          '"</div><div class="trust-author">\u2014 ' +
          t.a +
          "</div></div>"
        );
      })
      .join("");
    trustScroll.innerHTML = h;
  }
  buildTrust();

  /* SCROLL ANIMATIONS */
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var delay = e.target.dataset.delay || 0;
          setTimeout(function () {
            e.target.classList.add("visible");
          }, Number(delay));
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  document
    .querySelectorAll(".story-step, .feat-card")
    .forEach(function (el, i) {
      el.dataset.delay = i * 100;
      observer.observe(el);
    });

  /* STAT COUNTERS */
  function animateCounters() {
    document.querySelectorAll(".stat-val[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count);
      var curr = 0;
      var step = Math.ceil(target / 40);
      var t = setInterval(function () {
        curr = Math.min(curr + step, target);
        el.textContent = curr;
        if (curr >= target) clearInterval(t);
      }, 30);
    });
  }
  var heroStats = document.querySelector(".hero-stats");
  if (heroStats) {
    new IntersectionObserver(
      function (e) {
        if (e[0].isIntersecting) animateCounters();
      },
      { threshold: 0.5 },
    ).observe(heroStats);
  }

  /* KEYBOARD */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      closeAuth();
    }
  });

  var loginPass = document.getElementById("loginPass");
  var signupPass = document.getElementById("signupPass");
  if (loginPass)
    loginPass.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doLogin();
    });
  if (signupPass)
    signupPass.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doSignup();
    });

  /* EVENT LISTENERS */

  // Auth overlay
  var authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.addEventListener("click", handleAuthClick);

  // Modal overlay
  var modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) modalOverlay.addEventListener("click", handleModalClick);

  // Tab switches
  var tabLogin = document.getElementById("tabLogin");
  var tabSignup = document.getElementById("tabSignup");
  if (tabLogin) tabLogin.addEventListener("click", () => switchTab("login"));
  if (tabSignup) tabSignup.addEventListener("click", () => switchTab("signup"));

  // Auth buttons
  var loginBtn = document.getElementById("loginBtn");
  var signupBtn = document.getElementById("signupBtn");
  var logoutBtn = document.getElementById("logoutBtn");
  if (loginBtn) loginBtn.addEventListener("click", doLogin);
  if (signupBtn) signupBtn.addEventListener("click", doSignup);
  if (logoutBtn) logoutBtn.addEventListener("click", logOut);

  // Nav buttons
  var navLoginBtn = document.getElementById("navLoginBtn");
  var navSignupBtn = document.getElementById("navSignupBtn");
  if (navLoginBtn)
    navLoginBtn.addEventListener("click", () => openAuth("login"));
  if (navSignupBtn)
    navSignupBtn.addEventListener("click", () => openAuth("signup"));

  // Close buttons
  var closeAuthBtn = document.getElementById("closeAuthBtn");
  var closeModalBtn = document.getElementById("closeModalBtn");
  if (closeAuthBtn) closeAuthBtn.addEventListener("click", closeAuth);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  // Analyze button
  var analyzeBtn = document.getElementById("analyzeBtn");
  if (analyzeBtn) analyzeBtn.addEventListener("click", submitData);

  // Feature buttons - attach to all elements that might trigger modal
  document.querySelectorAll("[data-feature]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var feature = this.dataset.feature;
      requireLogin(() => openModal(feature));
    });
  });

  // Make functions globally available for inline event handlers
  window.openAuth = openAuth;
  window.closeAuth = closeAuth;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.requireLogin = requireLogin;
  window.doLogin = doLogin;
  window.doSignup = doSignup;
  window.logOut = logOut;
  window.submitData = submitData;
}); // End DOMContentLoaded
