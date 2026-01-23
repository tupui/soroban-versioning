export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'pep',
    name: 'PEP Format',
    description: 'Python Enhancement Proposal style - structured technical proposal',
    content: `# [PEP X]: [Proposal Title]

## Abstract
A short (~200 word) description of the technical issue being addressed.

## Motivation
Clearly explain why the existing system is inadequate to address the problem.

## Specification
The technical specification should describe the syntax and semantics of any new feature.

## Rationale
The rationale fleshes out the specification by describing what motivated the design.

## Backwards Compatibility
All proposals that introduce backwards incompatibilities must include a section describing these.

## Reference Implementation
This section should contain a reference implementation of the proposal.

## Discussion
- Link to discussion thread: [Forum/Discord link]
- Previous proposals: [Related proposals]

## Copyright
This document is placed in the public domain or under the CC0-1.0-Universal license.`
  },
  {
    id: 'eip',
    name: 'EIP Format',
    description: 'Ethereum Improvement Proposal style - blockchain protocol change',
    content: `# [EIP X]: [Proposal Title]

## Abstract
The abstract is a multi-sentence summary of the proposal.

## Motivation
The motivation section should describe the "why" of the proposal.

## Specification
The technical specification should describe the syntax and semantics of any new feature.

## Rationale
The rationale fleshes out the specification by describing what motivated the design.

## Backwards Compatibility
All EIPs that introduce backwards incompatibilities must include a section describing these.

## Test Cases
Test cases for an implementation are mandatory for EIPs that are affecting consensus changes.

## Reference Implementation
The reference implementation must be completed before any EIP is given status "Final".

## Security Considerations
All EIPs must contain a section that discusses the security implications.

## Copyright
Copyright and related rights waived via CC0.`
  },
  {
    id: 'cap',
    name: 'CAP Format',
    description: 'Celo Improvement Proposal style - governance and economic changes',
    content: `# [CAP X]: [Proposal Title]

## Summary
Provide a brief overview of the proposal and its intended outcome.

## Abstract
A short description of the proposal's purpose and scope.

## Motivation
Explain the problem this proposal aims to solve and why it's important.

## Specification
Detailed technical specification including parameters, formulas, and implementation details.

## Rationale
Justify the design decisions and chosen parameters.

## Risks
Identify potential risks and their mitigation strategies.

## Success Metrics
Define clear, measurable outcomes for evaluating success.

## Timeline
Proposed implementation timeline with milestones.

## Voting
- Voting options: For, Against, Abstain
- Voting period: [X] days
- Quorum: [Y]% of total supply

## Copyright
This work is licensed under the Creative Commons Zero v1.0 Universal.`
  },
  {
    id: 'sep',
    name: 'SEP Format',
    description: 'Stellar Ecosystem Proposal style - Stellar network improvements',
    content: `# [SEP X]: [Proposal Title]

## Abstract
Brief description of the proposed change to the Stellar ecosystem.

## Motivation
Why this change is necessary and what problems it addresses.

## Specification
Detailed technical specification including protocol changes.

## Design Rationale
Explanation of design choices and alternatives considered.

## Security Considerations
Analysis of security implications and potential attack vectors.

## Implementation
Implementation details and testing requirements.

## Backwards Compatibility
Impact on existing systems and migration path.

## Reference Implementation
Link to reference implementation if available.

## Voting and Governance
- Voting mechanism: [Description]
- Execution: [Conditions for execution]

## Copyright
Copyright and related rights waived via CC0.`
  },
  {
    id: 'simple',
    name: 'Simple Proposal',
    description: 'Basic proposal structure for general community decisions',
    content: `# [Proposal Title]

## Summary
Brief description of what this proposal aims to achieve.

## Problem Statement
What problem are we trying to solve?

## Proposed Solution
Detailed explanation of the proposed solution.

## Benefits
Expected benefits and positive outcomes.

## Implementation Plan
Step-by-step plan for implementation.

## Timeline
Estimated timeline with key milestones.

## Cost/Budget
If applicable, detailed budget breakdown.

## Risks and Mitigations
Potential risks and how to address them.

## Voting
- Options: Yes, No, Abstain
- Duration: [Number] days

## Discussion
Link to forum discussion: [URL]`
  }
];

export const getTemplateById = (id: string): ProposalTemplate | undefined => {
  return PROPOSAL_TEMPLATES.find(template => template.id === id);
};
