# Prompt Templates & LLM Integration

## Overview

This document provides the final, copy-pasteable prompt templates for Refine and Reinforce operations used by `/api/refine`. Templates are optimized for gpt-oss:20b at temperature ≤ 0.3 with token budget considerations.

## Template Design Principles

### Clarity & Specificity
- Clear instructions with concrete examples
- Specific output format requirements
- Explicit constraints and boundaries
- Testable success criteria

### Token Efficiency  
- Concise language without sacrificing clarity
- Minimal examples that demonstrate key patterns
- Structured format for predictable parsing
- Optimal balance of guidance vs. brevity

### Consistency & Reliability
- Temperature ≤ 0.3 for reproducible results
- Robust to input variations
- Graceful handling of edge cases
- Minimal hallucination risk

## Refine Operation Template

### Purpose
Expand terse user input into a structured, copy-ready prompt suitable for any LLM.

### Template (Copy-Pasteable)
```
You are a prompt engineering expert helping users create clear, effective prompts for LLMs.

TASK: Transform the user's brief instruction into a comprehensive, copy-ready prompt.

INSTRUCTIONS:
1. Expand the core intent into specific, actionable directives
2. Add relevant context and constraints  
3. Specify desired output format and structure
4. Include success criteria where appropriate
5. Maintain the original meaning and scope
6. Keep temperature ≤ 0.3 for consistency

INPUT: {{input}}

OUTPUT REQUIREMENTS:
- Single, well-structured prompt ready to copy-paste
- Clear sections: objective, context, requirements, format
- Specific and testable instructions
- Professional tone appropriate for any LLM
- No meta-commentary or explanations

Generate the refined prompt now:
```

### Parameters
- **Temperature:** 0.2 (default)
- **Max tokens:** 1000 (estimated output length)
- **Token budget:** ~150 tokens for template + input length

### Examples

#### Example 1: Simple Request
**Input:** `"summarize this article"`  
**Expected Output:**
```
Please provide a concise summary of the article below, focusing on:

OBJECTIVE: Create a clear, readable summary that captures the main points and key insights

REQUIREMENTS:
- Extract 3-5 key points from the article
- Maintain factual accuracy and original tone
- Use bullet points for main ideas
- Include one sentence conclusion
- Keep summary to 150-200 words

FORMAT:
**Main Points:**
• [Key point 1]
• [Key point 2] 
• [Key point 3]

**Conclusion:** [One sentence takeaway]

[Paste your article here]
```

#### Example 2: Complex Request
**Input:** `"help me write marketing copy"`  
**Expected Output:**
```
Create compelling marketing copy for your product or service with the following approach:

OBJECTIVE: Develop persuasive, customer-focused copy that drives action

CONTEXT: Provide details about your product, target audience, and marketing goals

REQUIREMENTS:
- Lead with customer benefits, not features
- Include clear value proposition
- Address common objections or concerns
- End with specific call-to-action
- Match tone to your brand voice
- Optimize for your chosen channel (email, web, social, etc.)

FORMAT:
**Headline:** [Attention-grabbing opener]
**Problem:** [Customer pain point]
**Solution:** [How your product helps]
**Benefits:** [Key advantages, 3-4 bullet points]
**Social Proof:** [Testimonial, statistic, or credibility marker]
**Call-to-Action:** [Specific next step]

Please provide: [Product details, target audience, channel, brand tone]
```

## Reinforce Operation Template

### Purpose
Tighten coordination among goals, constraints, tone, and variables in an edited draft prompt.

### Template (Copy-Pasteable)
```
You are a prompt optimization specialist focused on improving coordination and clarity.

TASK: Refine the provided draft prompt to improve internal consistency, clarity, and effectiveness.

FOCUS AREAS:
1. Goal alignment - ensure all parts work toward the same objective
2. Constraint consistency - remove conflicts between requirements  
3. Tone coherence - maintain consistent voice throughout
4. Variable clarity - clarify any ambiguous placeholders
5. Structure optimization - improve logical flow and readability

DRAFT: {{draft}}

OPTIMIZATION PRINCIPLES:
- Preserve the original intent and scope
- Improve clarity without adding unnecessary length
- Ensure all sections support the main objective
- Remove redundancy and conflicting instructions
- Enhance actionability and specificity

OUTPUT: Return the complete optimized prompt with improvements integrated seamlessly.

Generate the refined version now:
```

### Parameters  
- **Temperature:** 0.25 (slightly higher for creative improvements)
- **Max tokens:** 1200 (may be longer than input)
- **Token budget:** ~120 tokens for template + draft length

### Patch Generation
The reinforce operation also generates a compact patch for diff/undo functionality:

```javascript
// Example patch format
{
  "output": "complete refined prompt text...",
  "usage": {"input_tokens": 180, "output_tokens": 220},
  "patch": [
    {"op": "replace", "from": [45, 67], "to": "clearer instruction"},
    {"op": "insert", "at": 120, "to": "\n\nADDITIONAL CONTEXT:\n"},
    {"op": "delete", "from": [200, 215]}
  ]
}
```

### Examples

#### Example 1: Inconsistent Requirements
**Input Draft:**
```
Write a brief summary but include detailed analysis of the data. 
Make it formal yet conversational. Cover everything important but keep it short.
```

**Expected Output:**
```
Create a concise executive summary with focused data insights.

OBJECTIVE: Provide key findings in a professional, accessible format

REQUIREMENTS:
- Highlight 3-4 most significant data points
- Professional tone with clear explanations
- Executive summary length (200-250 words)
- Focus on actionable insights over raw data

FORMAT:
**Key Findings:** [3-4 bullet points with data]
**Implications:** [What this means for decision-making]
**Recommendations:** [1-2 suggested next steps]
```

#### Example 2: Vague Instructions  
**Input Draft:**
```
Help me with my presentation. Make it good and professional.
Add some slides about our company. Make sure it's engaging.
```

**Expected Output:**
```
Create a professional presentation that effectively communicates your key message.

OBJECTIVE: Develop a compelling presentation that engages your audience and achieves your goals

REQUIREMENTS:
- Define your core message and target audience
- Structure with clear introduction, body, and conclusion
- Include relevant company information that supports your message
- Use visual elements to maintain engagement
- Practice delivery for smooth presentation

CONTENT STRUCTURE:
**Opening:** [Hook + objective statement]
**Company Overview:** [2-3 slides covering relevant background]
**Main Content:** [Key points with supporting evidence]
**Call-to-Action:** [Specific next steps for audience]

Please provide: [Presentation purpose, audience, duration, key message]
```

## Token Budget Management

### Input Size Handling
```javascript
// Token estimation logic
function estimateTokens(text) {
  return Math.ceil(text.length / 4); // Rough approximation
}

function validateTokenBudget(input, template) {
  const templateTokens = estimateTokens(template);
  const inputTokens = estimateTokens(input);
  const maxOutput = 1200;
  
  if (templateTokens + inputTokens + maxOutput > 4000) {
    throw new Error('Input too long for token budget');
  }
}
```

### Size-Based Adaptations
- **Short input (<50 tokens):** Full template
- **Medium input (50-200 tokens):** Standard template  
- **Long input (>200 tokens):** Compressed template version
- **Very long input (>500 tokens):** Reject with helpful error

## Error Handling & Edge Cases

### Invalid Inputs
```javascript
// Validation rules
const validation = {
  refine: {
    input: {
      required: true,
      minLength: 5,
      maxLength: 2000,
      pattern: /\S/  // Must contain non-whitespace
    }
  },
  reinforce: {
    draft: {
      required: true,
      minLength: 20,
      maxLength: 5000,
      pattern: /\S/
    }
  }
}
```

### Fallback Strategies
- **Empty input:** Return helpful error message
- **Too long input:** Suggest shortening or chunking approach
- **Non-English input:** Attempt processing but note limitations
- **Gibberish input:** Request clarification

### Quality Checks
```javascript
// Output validation
function validateOutput(output) {
  return {
    hasStructure: output.includes('OBJECTIVE') || output.includes('REQUIREMENTS'),
    appropriate_length: output.length > 100 && output.length < 2000,
    no_meta_commentary: !output.includes('I will') && !output.includes('Here is'),
    maintains_focus: output.toLowerCase().includes(extractKeyTerms(input))
  };
}
```

## Performance Optimization

### Caching Strategy
- Cache common prompt patterns
- Template compilation optimization
- Response caching for identical inputs

### Generation Settings
```javascript
const generationConfig = {
  refine: {
    temperature: 0.2,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  },
  reinforce: {
    temperature: 0.25,
    max_tokens: 1200,
    top_p: 0.9,  
    frequency_penalty: 0.1,
    presence_penalty: 0.0
  }
};
```

## Implementation Integration

### API Route Usage
```javascript
// In app/api/refine/route.ts
import { REFINE_TEMPLATE, REINFORCE_TEMPLATE } from '@/lib/prompts';

async function handleRefine(input, model, temperature) {
  const prompt = REFINE_TEMPLATE.replace('{{input}}', input);
  const response = await ollamaClient.generate({
    model,
    prompt,
    temperature: Math.min(temperature, 0.3),
    max_tokens: 1000
  });
  
  return {
    output: response.text,
    usage: response.usage
  };
}
```

### Testing Templates
```javascript
// Template quality tests
describe('Prompt Templates', () => {
  test('refine template produces structured output', async () => {
    const result = await testTemplate(REFINE_TEMPLATE, 'summarize article');
    expect(result).toMatch(/OBJECTIVE:|REQUIREMENTS:/);
    expect(result.length).toBeGreaterThan(100);
  });
  
  test('reinforce template maintains intent', async () => {
    const draft = 'Write a good summary of the data';
    const result = await testTemplate(REINFORCE_TEMPLATE, draft);
    expect(result).toContain('summary');
    expect(result).toContain('data');
  });
});
```

## Continuous Improvement

### Quality Metrics
- **Coherence:** Output makes logical sense
- **Completeness:** All required elements present
- **Actionability:** Clear next steps for users
- **Consistency:** Similar inputs produce similar quality outputs

### A/B Testing Framework
- Test prompt variations for quality improvements
- Measure user satisfaction and usage patterns  
- Iterate based on real-world performance data

### User Feedback Integration
- Track which outputs users copy vs. discard
- Monitor refinement → reinforcement patterns
- Collect explicit quality ratings

These prompt templates provide the foundation for reliable, high-quality prompt generation that aligns with Promptpad's local-first, consistency-focused approach.