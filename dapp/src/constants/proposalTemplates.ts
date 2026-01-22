export interface ProposalTemplate {
    id: string;
    name: string;
    description: string;
    category: 'general' | 'funding' | 'governance' | 'technical';
    content: string;
    includesOutcomes?: boolean; // Whether template includes outcome placeholders
  }
  
  export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Proposal',
      description: 'General purpose proposal with clear structure',
      category: 'general',
      content: `# [Proposal Title]
  
  ## Executive Summary
  Brief overview of what this proposal aims to achieve.
  
  ## Motivation
  Why is this proposal necessary? What problem does it solve?
  
  ## Background & Context
  Current state and relevant background information.
  
  ## Proposed Solution
  Detailed explanation of the proposed solution or change.
  
  ## Implementation Plan
  Steps to implement the proposal, if applicable.
  
  ## Timeline
  Estimated timeline for implementation.
  
  ## Success Metrics
  How will success be measured?
  
  ## Discussion Link
  [Link to forum/discussion thread]
  
  ## Voting Options
  - [ ] Yes
  - [ ] No
  - [ ] Abstain`,
      includesOutcomes: false
    },
    {
      id: 'funding',
      name: 'Funding Request',
      description: 'Request funds from the treasury for a project',
      category: 'funding',
      content: `# Funding Request: [Project Name]
  
  ## Executive Summary
  Clear description of what funding is needed for.
  
  ## Problem Statement
  What problem are you solving for the community/ecosystem?
  
  ## Proposed Solution & Deliverables
  Detailed description of the project and expected deliverables.
  
  ## Team & Experience
  [Optional: Information about the team executing the proposal]
  
  ## Budget Breakdown
  | Item | Amount (XLM) | Justification |
  |------|--------------|---------------|
  | Development | [Amount] | [Details] |
  | Marketing | [Amount] | [Details] |
  | Operations | [Amount] | [Details] |
  | Contingency | [Amount] | [Details] |
  | **Total** | **[Total]** | |
  
  ## Timeline & Milestones
  - **Month 1**: [Milestone 1]
  - **Month 2**: [Milestone 2]
  - **Month 3**: [Milestone 3]
  
  ## Success Metrics & KPIs
  How will success be measured? What are the key performance indicators?
  
  ## Risks & Mitigations
  Potential risks and how they will be mitigated.
  
  ## Previous Work
  Links to previous work or proof of concept.
  
  ## Discussion Link
  [Link to pre-proposal discussion]
  
  ## Voting Instructions
  - ✅ **Yes**: Approve funding for this proposal
  - ❌ **No**: Reject this funding request
  - 🤝 **Abstain**: No position`,
      includesOutcomes: true
    },
    {
      id: 'parameter',
      name: 'Parameter Change',
      description: 'Change protocol parameters or settings',
      category: 'technical',
      content: `# Parameter Change Proposal
  
  ## Parameter: [Parameter Name]
  **Current Value:** [Current value]
  **Proposed Value:** [Proposed value]
  
  ## Rationale
  Why is this change necessary? What benefits does it bring?
  
  ## Technical Details
  Technical implications of the change. Include any required upgrades.
  
  ## Impact Analysis
  - **On Users:** [Impact on end users]
  - **On Protocol:** [Impact on protocol operations]
  - **On Economics:** [Economic implications]
  
  ## Risk Assessment
  | Risk | Likelihood | Impact | Mitigation |
  |------|------------|--------|------------|
  | [Risk 1] | [Low/Medium/High] | [Low/Medium/High] | [Mitigation strategy] |
  | [Risk 2] | [Low/Medium/High] | [Low/Medium/High] | [Mitigation strategy] |
  
  ## Implementation Details
  Step-by-step implementation plan.
  
  ## Testing Plan
  How the change will be tested before full deployment.
  
  ## Rollback Plan
  Procedure to revert the change if issues arise.
  
  ## Discussion Link
  [Link to technical discussion/forum thread]
  
  ## Voting Options
  - ✅ **Yes**: Implement the parameter change
  - ❌ **No**: Keep current parameter value
  - 🤝 **Abstain**: No position`,
      includesOutcomes: false
    },
    {
      id: 'governance',
      name: 'Governance Change',
      description: 'Change to DAO governance structure or processes',
      category: 'governance',
      content: `# Governance Change Proposal
  
  ## Change Summary
  What aspect of governance is being changed?
  
  ## Current State
  How does governance currently work? Include relevant details.
  
  ## Proposed Changes
  Detailed description of the proposed changes.
  
  ## Motivation
  Why are these changes necessary? What problems do they solve?
  
  ## Benefits
  Expected improvements from these changes.
  
  ## Implementation Plan
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
  
  ## Transition Plan
  How the transition will be managed.
  
  ## Impact Assessment
  - **On Voting:** [Impact on voting processes]
  - **On Participation:** [Impact on community participation]
  - **On Operations:** [Impact on day-to-day operations]
  
  ## Discussion Link
  [Link to governance forum discussion]
  
  ## Voting Period
  Suggested voting duration: [Number] days
  
  ## Voting Options
  - ✅ **Yes**: Adopt the governance changes
  - ❌ **No**: Maintain current governance structure
  - 🤝 **Abstain**: No position`,
      includesOutcomes: false
    },
    {
      id: 'partnership',
      name: 'Partnership Proposal',
      description: 'Propose a partnership or collaboration',
      category: 'general',
      content: `# Partnership Proposal: [Partner Name]
  
  ## Executive Summary
  Overview of the proposed partnership.
  
  ## About [Partner Name]
  Background information about the potential partner.
  
  ## Partnership Goals
  What do both parties hope to achieve?
  
  ## Scope of Collaboration
  Areas of collaboration and joint activities.
  
  ## Benefits to Our Ecosystem
  Specific benefits for our community and token holders.
  
  ## Terms & Conditions
  Key terms of the partnership agreement.
  
  ## Resource Requirements
  What resources are needed from our side?
  
  ## Success Metrics
  How will the success of this partnership be measured?
  
  ## Timeline
  Partnership timeline and key milestones.
  
  ## Risks & Mitigations
  Potential risks and how they will be addressed.
  
  ## Previous Discussions
  Links to previous discussions with the partner.
  
  ## Voting Options
  - ✅ **Yes**: Approve the partnership
  - ❌ **No**: Reject the partnership
  - 🤝 **Abstain**: No position`,
      includesOutcomes: true
    }
  ];
  
  // Helper functions
  export const getTemplateById = (id: string): ProposalTemplate | undefined => {
    return PROPOSAL_TEMPLATES.find(template => template.id === id);
  };
  
  export const getTemplatesByCategory = (category: string): ProposalTemplate[] => {
    return PROPOSAL_TEMPLATES.filter(template => template.category === category);
  };