import mongoose, { Document, Schema } from "mongoose";

export type StepType =
  | "FETCH_URL"
  | "LLM_SUMMARIZE"
  | "LLM_GENERAL"
  | "TRANSFORM_TEXT"
  | "ECHO";

export interface Step {
  id: string;
  type: StepType;
  order: number;
  config: Record<string, any>;
}

export interface WorkflowDocument extends Document {
  name: string;
  description?: string;
  trigger: "manual" | "schedule";
  steps: Step[];
  createdAt: Date;
  updatedAt: Date;
}

const StepSchema = new Schema<Step>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["FETCH_URL", "LLM_SUMMARIZE", "LLM_GENERAL", "TRANSFORM_TEXT", "ECHO"],
    },
    order: { type: Number, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const WorkflowSchema = new Schema<WorkflowDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    trigger: {
      type: String,
      required: true,
      enum: ["manual", "schedule"],
      default: "manual",
    },
    steps: {
      type: [StepSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const WorkflowModel = mongoose.model<WorkflowDocument>(
  "Workflow",
  WorkflowSchema
);