import https from 'https';

/**
 * Calls Gemini API if key is present, otherwise falls back to dynamic local AI mock
 */
export async function generateAIContent(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      return await callGeminiAPI(apiKey, prompt, systemInstruction);
    } catch (error) {
      console.error('Gemini API call failed, falling back to local heuristic model:', error.message);
    }
  }

  return generateMockAIContent(prompt, systemInstruction);
}

function callGeminiAPI(apiKey, prompt, systemInstruction) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(json.error?.message || 'Invalid API response structure'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

/**
 * Intelligent local fallback responder based on parsed queries and system context
 */
function generateMockAIContent(prompt, systemInstruction) {
  const text = prompt.toLowerCase();
  
  // Try to extract context from system instruction
  let studentName = 'Student';
  let cgpa = '8.4';
  let attendance = '78%';
  let subjects = 'DBMS, Operating Systems, DSA';

  if (systemInstruction) {
    const nameMatch = systemInstruction.match(/student name:?\s*([^\n,]+)/i);
    const cgpaMatch = systemInstruction.match(/cgpa:?\s*([0-9.]+)/i);
    const attMatch = systemInstruction.match(/attendance:?\s*([0-9%]+)/i);
    
    if (nameMatch) studentName = nameMatch[1].trim();
    if (cgpaMatch) cgpa = cgpaMatch[1].trim();
    if (attMatch) attendance = attMatch[1].trim();
  }

  // Answer Attendance queries
  if (text.includes('attendance') || text.includes('present') || text.includes('absent')) {
    return `### Attendance Report for ${studentName}
Your overall attendance rate is currently **${attendance}**.

**Subject-wise breakdown:**
- **Database Management Systems (DBMS-301)**: **68%** ⚠️ *Needs Improvement*
- **Operating Systems (CSE-302)**: **85%** ✅ *Good*
- **Data Structures (CSE-101)**: **82%** ✅ *Good*

**AI Suggestion:**
Your attendance in **DBMS** is currently **68%** (below the mandatory 75% threshold). You need to attend the next **4 classes** consecutively to raise your attendance to **75.4%** and avoid exam registration blockages.`;
  }

  // Answer CGPA queries
  if (text.includes('cgpa') || text.includes('gpa') || text.includes('marks') || text.includes('grades')) {
    return `### Academic Performance Overview
Hello ${studentName}, your current Cumulative Grade Point Average (**CGPA**) is **${cgpa}/10.0**.

**Latest Semester Performance:**
- **Operating Systems**: **A** (Excellent, GPA 9.0)
- **Database Systems**: **B+** (Very Good, GPA 8.0)
- **Design & Analysis of Algorithms**: **A+** (Outstanding, GPA 10.0)

**AI Analytics:**
You have a strong grasp of algorithmic design. However, performance in DBMS is slightly dragged down by internal quiz grades. We recommend reviewing database normalization rules to secure an 'A' grade in the end-semester exams.`;
  }

  // Answer Exam queries
  if (text.includes('exam') || text.includes('schedule') || text.includes('timetable') || text.includes('test')) {
    return `### Upcoming Exam Schedules & Deadlines
Here are your critical dates:
1. **Operating Systems Midterm Retest**: Dec 8th, 2026 at 10:00 AM (Room LH-102)
2. **End-Semester Exams**: Begins Dec 15th, 2026. Detailed timetable has been sent to your department portal.
3. **Database Systems Lab Viva**: Dec 12th, 2026 at 2:00 PM.

Make sure to clear any pending assignments before the examinations!`;
  }

  // Answer improvement queries
  if (text.includes('improve') || text.includes('improvement') || text.includes('weak') || text.includes('help')) {
    return `### AI Subject Improvement Guide for ${studentName}
Based on continuous grading and attendance metrics, here is your personalized focus plan:

1. **Database Management Systems (DBMS)**:
   - **Issue**: Current attendance is **68%** and average test score is **64%**.
   - **Recommendation**: Focus on Unit 3 (Normalization & SQL Joins). Attend at least 4 more classes.
2. **Operating Systems (OS)**:
   - **Issue**: Concepts of Deadlocks and Mutex locks have minor errors in quizzes.
   - **Recommendation**: Read chapter 7 of standard text (Galvin) and try the dining philosophers simulator.

Keep it up, you are doing great!`;
  }

  // Answer Unit summaries (e.g. DBMS Unit 3)
  if (text.includes('dbms') && (text.includes('unit 3') || text.includes('summarize') || text.includes('summary'))) {
    return `### AI Course Summary: DBMS Unit 3 (Database Normalization)
Here is a comprehensive summary of Unit 3 to help you study:

1. **Goal of Normalization**:
   To minimize data redundancy and avoid anomalies (Insert, Update, Delete anomalies) by structuring tables logically.

2. **Normal Forms Checklist**:
   - **1NF (First Normal Form)**: All attributes must contain atomic (indivisible) values. No repeating groups.
   - **2NF (Second Normal Form)**: Must be in 1NF + all non-prime attributes must be *fully functionally dependent* on the candidate key (no partial dependencies).
   - **3NF (Third Normal Form)**: Must be in 2NF + no *transitive dependencies* (non-prime attributes cannot determine other non-prime attributes).
   - **BCNF (Boyce-Codd Normal Form)**: A stronger version of 3NF. For any functional dependency $X \\rightarrow Y$, $X$ must be a super key.

3. **Common Exam Question**:
   *Identify the highest normal form of a relation R(A,B,C,D) with functional dependencies.* Make sure you find the candidate keys first by computing attribute closures!`;
  }

  // General fallback chat
  return `### Hello ${studentName}, I am your SMS AI Assistant.
I can help you review performance metrics, predict risks, schedules, and answer questions.

**Try asking me:**
- *"What is my current attendance and how can I improve it?"*
- *"Show my CGPA and marks analysis"*
- *"When is my next exam?"*
- *"Summarize DBMS Unit 3"*

How can I assist you today?`;
}
