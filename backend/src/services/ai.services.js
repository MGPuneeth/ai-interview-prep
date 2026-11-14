import { interviewReportModel } from "../models/interviewReport.model.js";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { configDotenv } from "dotenv";
import puppeteer from "puppeteer";
// import OpenAI from "openai";
// import { zodTextFormat } from "openai/helpers/zod";

configDotenv();
// console.log("Gemini api: ", process.env.GOOGLE_GENAI_API_KEY);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
// const ai2 = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. Define the schema using Gemini's native Type enum
const interviewReportSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.NUMBER,
      description:
        "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    },
    technicalQuestions: {
      type: Type.ARRAY,
      description:
        "Technical questions that can be asked in the interview along with their intention and how to answer them",
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The technical question can be asked in the interview",
          },
          intention: {
            type: Type.STRING,
            description:
              "The intention of interviewer behind asking this question",
          },
          answer: {
            type: Type.STRING,
            description:
              "How to answer this question, what points to cover, what approach to take etc.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: Type.ARRAY,
      description:
        "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description:
              "The behavioral question can be asked in the interview",
          },
          intention: {
            type: Type.STRING,
            description:
              "The intention of interviewer behind asking this question",
          },
          answer: {
            type: Type.STRING,
            description:
              "How to answer this question, what points to cover, what approach to take etc.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGap: {
      type: Type.ARRAY,
      description:
        "List of skill gaps in the candidate's profile along with their severity",
      items: {
        type: Type.OBJECT,
        properties: {
          skills: {
            type: Type.STRING,
            description: "The skill which the candidate is lacking",
          },
          severity: {
            type: Type.STRING,
            enum: ["low", "medium", "high"],
            description:
              "The severity of this skill gap ('low', 'medium', 'high')",
          },
        },
        required: ["skills", "severity"],
      },
    },
    preparationPlan: {
      type: Type.ARRAY,
      description: "A day-wise preparation plan for the candidate to follow",
      items: {
        type: Type.OBJECT,
        properties: {
          day: {
            type: Type.NUMBER,
            description:
              "The day number in the preparation plan, starting from 1",
          },
          focus: {
            type: Type.STRING,
            description: "The main focus of this day in the preparation plan",
          },
          task: {
            type: Type.ARRAY,
            description: "List of tasks to be done on this day",
            items: { type: Type.STRING },
          },
        },
        required: ["day", "focus", "task"],
      },
    },
    title: {
      type: Type.STRING,
      description:
        "The title of the job for which the interview report is generated",
    },
  },
  // Ensure all top-level properties are marked as required
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGap",
    "preparationPlan",
    "title",
  ],
};

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  console.log("\n============ model ============\n");

  const prompt = `
You are an expert technical interviewer and career coach. Analyze the following job description and candidate profile to generate a comprehensive interview preparation report.

**Job Description:**
${jobDescription}

**Candidate Resume:**
${resume}

${selfDescription ? `**Candidate Self-Description:**\n${selfDescription}` : ""}

**Instructions:**
1. Analyze both the job requirements and the candidate's profile thoroughly
2. Calculate a match score (0-100) based on how well the candidate fits the role
3. Generate 5-8 technical questions specifically tailored to this role and candidate
4. Generate 3-5 behavioral questions based on the job requirements
5. Identify skill gaps by comparing candidate's skills against job requirements
6. Create a 7-14 day preparation plan addressing the identified gaps
7. Extract the exact job title from the job description

Be specific and practical. The questions should be challenging but fair for the candidate's experience level.

Return the response as a valid JSON object matching the schema provided.
`;
  try {
    // OPTION 1: Using responseSchema (Recommended for Gemini)
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // or "gemini-1.5-flash"
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: interviewReportSchema,
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });

    // console.log("\n====================== Response ==================\n");

    // console.log("Raw Response:", response);

    // console.log("\nText: \n", response.text);

    // // Parse the response
    let data = JSON.parse(response.text);
    console.log("Data:\n", data);

    // console.log("\n====================== Response end ==================\n");
    console.log(response.usageMetadata);
    console.log("\n============ ======= ============\n");

    // // Clean up nested JSON strings if any
    // data.technicalQuestions = fixQuestions(data.technicalQuestions);
    // data.behavioralQuestions = fixQuestions(data.behavioralQuestions);
    // data.skillGaps = fixSkillGaps(data.skillGaps);
    // data.preparationPlan = fixPreparationPlan(data.preparationPlan);

    return data;
  } catch (error) {
    console.error("Error generating interview report:", error);
    throw error;
  }
}

const resumePDFSchema = {
  type: Type.OBJECT,
  properties: {
    html: {
      type: Type.STRING,
      description:
        "The HTML content of the resume which can be converted to PDF using an extension called puppeteer ",
    },
  },
};

async function generateResumePDF({ resume, jobDescription, selfDescription }) {
  // DEBUG CHECK: Ensure inputs are non-empty strings before calling the API
  if (!jobDescription || !resume) {
    throw new Error("Job description and resume content are required.");
  }

  const systemInstruction = `
You are an expert ATS resume tailoring engine that outputs styled HTML.
Your task is to tailor a user's resume for a specific Job Description and format it into a single-page HTML layout based on a two-column sidebar structure.

STRICT GROUNDING & 1-PAGE LIMIT RULES:
1. STRICT 1-PAGE LIMIT: Total content MUST fit on exactly ONE A4 page. Keep entries concise (maximum 2-3 bullet points per project or work experience entry).
2. ABSOLUTELY NO DUMMY DATA OR PLACEHOLDERS (e.g., "John Doe", "Professional Candidate", "Global Solutions").
3. Use ONLY facts, candidate name, contact details, real projects (e.g., "Bank Ledger System", "Sokoban Solver"), education, and tech stacks provided in the prompt.
4. ADAPTATION: Highlight relevant tech stack items and tailor bullet points toward the Job Description without inventing unearned work history.
5. VISUAL STRUCTURE:
   - Use a 2-column layout matching a 35% / 65% split.
   - Left Sidebar (35% width, dark background #1e293b, white text): Personal Info, Links, Skills, and Languages.
   - Main Body (65% width, white background, dark text): Name, Job Title, Professional Summary, Work/Project Experience, and Education.
   - Output MUST be a valid HTML string wrapped in the requested JSON schema.
`;

  const userPrompt = `
### TARGET JOB DESCRIPTION
${jobDescription}

### USER SELF-DESCRIPTION
${selfDescription || "N/A"}

### USER CURRENT RESUME CONTENT
${resume}

### OUTPUT HTML REQUIREMENTS
Generate a complete, self-contained HTML document matching this template structure:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      width: 210mm;
      height: 297mm;
      display: flex;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.35;
      color: #333333;
      overflow: hidden;
    }
    .sidebar {
      width: 30%;
      background-color: #1e293b;
      color: #ffffff;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .sidebar a { color: #38bdf8; text-decoration: none; word-break: break-all; }
    .sidebar h3 {
      font-size: 12px;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255,255,255,0.25);
      padding-bottom: 3px;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
      color: #f8fafc;
    }
    .sidebar-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 10px; }
    .sidebar-item i { width: 14px; text-align: center; color: #38bdf8; }
    
    .skill-group { margin-bottom: 8px; }
    .skill-title { font-weight: 600; font-size: 10px; color: #93c5fd; margin-bottom: 2px; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .skill-tag { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 9.5px; color: #e2e8f0; }

    .main {
      width: 70%;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .header h1 { font-size: 22px; color: #0f172a; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; }
    .header h2 { font-size: 12px; color: #0284c7; font-weight: 600; margin-bottom: 6px; }
    .header p { font-size: 10px; color: #475569; line-height: 1.3; }
    
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1.5px solid #0284c7;
      padding-bottom: 2px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .entry { margin-bottom: 6px; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 10.5px; color: #0f172a; }
    .entry-sub { font-size: 9.5px; color: #0284c7; font-weight: 600; margin-bottom: 2px; }
    .entry-date { font-size: 9.5px; color: #64748b; font-weight: normal; }
    ul { padding-left: 12px; }
    li { margin-bottom: 2px; font-size: 9.5px; color: #334155; }
  </style>
</head>
<body>
  <div class="sidebar">
    <!-- PERSONAL INFO (fa-phone, fa-envelope, fa-location-dot) -->
    <!-- LINKS (fa-globe, fa-github, fa-linkedin) -->
    <!-- SKILLS (Categorized with .skill-tag badges) -->
    <!-- LANGUAGES / CERTIFICATIONS (If present in input) -->
  </div>
  <div class="main">
    <!-- HEADER: Name, Target Title, Brief Summary -->
    <!-- WORK EXPERIENCE / PROJECTS (Using .entry structure) -->
    <!-- EDUCATION -->
  </div>
</body>
</html>

Return ONLY a JSON object matching the requested schema with the generated HTML string in the "html" property.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite", // Recommended for fast, strict structured output
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: resumePDFSchema,
        temperature: 0.3, // Force strict adherence to context and zero creativity/hallucination
      },
    });

    const data = JSON.parse(response.text);

    const pdfBuffer = await generatePDF(data.html);
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating interview report:", error);
    throw error;
  }
}

async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  const pageBuffer = await page.pdf({
    format: "A4",
  });
  // console.log(pageBuffer);

  await browser.close();

  return pageBuffer;
}

export { generateInterviewReport, generateResumePDF };
