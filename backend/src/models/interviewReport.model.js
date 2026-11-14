import mongoose from "mongoose";

/**
 *  -- Input --
 * job description
 * resume text
 * sel description
 *
 * -- Output --
 * -matchScore: Number
 * technical Questions: [{question : " ",intention: " ", answer: " "}]
 * behavioural : [{question : " ",intention: " ", answer: " "}]
 * skill gaps: [{skill: "", severity: {type: string, enum: ["low ","medium ","high"] }}]
 * preparation plan : [{ day: Number, focus: string, tasks: [" "] }]
 *
 */

const technicalQuestionsSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Technical question is required"],
    },
    intention: {
      type: String,
      required: [true, "Intention is necessary"],
    },
    answer: {
      type: String,
      required: [true, "Answer is necessary"],
    },
  },
  {
    _id: false,
  },
);
const behaviouralQuestionsSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Behavoiural question is required"],
    },
    intention: {
      type: String,
      required: [true, "Intention is necessary"],
    },
    answer: {
      type: String,
      required: [true, "Answer is necessary"],
    },
  },
  {
    _id: false,
  },
);
const skillGapSchema = new mongoose.Schema(
  {
    skills: {
      type: String,
      required: [true, "Skill is required"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Intention is necessary"],
    },
  },
  {
    _id: false,
  },
);

const preparationPlanSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: [true, "Day is required"],
    },
    focus: {
      type: String,
      required: [true, "Focus is necessary"],
    },
    task: {
      type: [String],
      required: [true, "Task is necessary"],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: String,
      required: [true, "Job description is very much necessary"],
    },
    selfDescription: {
      type: String,
      required: [true, "Self description is very much necessary"],
    },
    resume: {
      type: String,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    technicalQuestions: [technicalQuestionsSchema],
    behaviouralQuestions: [behaviouralQuestionsSchema],
    skillGap: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    title: {
      type: String,
      required: [true, "Job title is necessary"],
    },
  },
  { timestamps: true },
);

const interviewReportModel = mongoose.model(
  "interviewReport",
  interviewReportSchema,
);

export { interviewReportModel };
