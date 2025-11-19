import mongoose, { Schema, model, models } from 'mongoose';

const UnderwritingSchema = new Schema({
  farmerName: {
    type: String,
    required: true,
  },
  documentId: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  cropType: {
    type: String,
    required: true,
  },
  financials: {
    requestedAmount: Number,
    hectares: Number,
    yield: Number,
  },
  aiAnalysis: {
    riskScore: Number,
    riskTier: String,
    maxCreditLimit: Number,
    explanation: String,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'ON_CHAIN_REGISTERED'],
    default: 'PENDING',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Underwriting = models.Underwriting || model('Underwriting', UnderwritingSchema);

export default Underwriting;

