# Terms of Service - Tansu

**Last Updated: October 21, 2025**  
**Effective: October 21, 2025**  

## 1. Introduction

Welcome to Tansu ("the dApp"), a decentralized governance platform operated by Consulting Manao GmbH ("Company", "we", "us"), located in Austria (Company Registration: FN 571029z). By accessing or using the dApp, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the dApp.

Tansu is a decentralized application built on the Stellar blockchain that provides on-chain project governance, community voting, and transparent decision-making for open-source projects.

**Please Note**: We recommend reading our Privacy Policy alongside these Terms to understand how your data is processed. Our architecture is fully decentralized—we do not operate backend servers or store user data.

## 2. Definitions

To help you understand these Terms, we've defined key terms used throughout this document:

**Badge**: A role-based token that determines voting weight and permissions within projects.

**CID (Content Identifier)**: A unique identifier for content stored on IPFS, ensuring immutability and verification.

**Commitment**: A cryptographic commitment used in anonymous voting to hide vote choices until execution.

**IPFS**: InterPlanetary File System, a decentralized storage protocol used for storing proposal content, profiles, and project metadata.

**Maintainer**: An authorized user who can manage project settings, update commit hashes, and execute proposals.

**Member**: A registered user of the Tansu platform with associated profile and voting capabilities.

**Project**: An on-chain registered open-source project with associated governance, metadata, and maintainers.

**Project Key**: A unique identifier derived from the project name, used to reference projects on-chain.

**Proposal**: A governance proposal submitted by community members for voting and potential execution.

**Public Vote**: A transparent voting mechanism where vote choices are visible on-chain.

**Anonymous Vote**: A privacy-preserving voting mechanism using BLS12-381 cryptography to hide individual vote choices.

**Smart Contract**: Self-executing contracts deployed on the Stellar blockchain that govern platform operations.

**Soroban Domains**: A naming service on Stellar that prevents project name squatting and ensures authenticity.

**Stellar Network**: The decentralized blockchain network on which Tansu operates.

**Voting Weight**: The influence a member has in governance decisions, determined by their assigned badges.

**Wallet**: A third-party application that manages Stellar accounts and private keys.

## 3. Eligibility and Account Requirements

To use Tansu's services, you must meet the following requirements:

**Age**: You must be at least 18 years old to use our services.

**Restricted Jurisdictions**: You may not use our services if you reside in or are subject to the laws of FATF (Financial Action Task Force) high-risk or non-cooperative jurisdictions, or if you are subject to sanctions imposed by the United Nations, European Union, or Austria. Current FATF lists are available at fatf-gafi.org. You are also prohibited if using our services is illegal in your country.

**Stellar Wallet**: You must use a third-party Stellar wallet to authenticate your Stellar Account. Tansu does not provide wallet services, and you are responsible for securing your wallet and private keys.

**Member Registration**: You must register as a member to participate in governance activities. Registration requires providing accurate information and may include profile data stored on IPFS.

## 4. Services Description

Tansu provides a comprehensive governance platform with the following core functionalities:

**Project Registration**: On-chain project tracking with domain integration, commit hash verification, and maintainer management. Note: Project registration fees are handled by Soroban Domains, not Tansu.

**Membership System**: Community registration with badge-based roles, voting weight assignment, and profile management.

**Governance (DAO)**: Proposal creation, public and anonymous voting mechanisms, and proposal execution with transparent outcomes.

**IPFS Integration**: Decentralized storage for proposals, member profiles, project metadata, and other content with immutable addressing.

**Anonymous Voting**: BLS12-381 cryptographic commitment schemes with ECDH key management for privacy-preserving governance.

**Donations**: XLM transfer functionality allowing users to donate to projects.

**Collateral System**: Fixed amount set by Tansu in smart contracts, required for proposal creation and voting. Collateral is reimbursed to proposers and voters when proposals are successfully executed.

**Free Service**: Tansu is provided free of charge. Users are only responsible for blockchain transaction fees (gas fees) paid directly to the Stellar Network.

## 5. User Responsibilities

**Lawful Use**: Use services in compliance with Austrian law, your country's laws, and these Terms.

**Wallet Security**: You are responsible for securing your wallet and private keys. We are not liable for compromised wallets or lost keys.

**Accurate Information**: Provide accurate information when using our services.

**Content Compliance**: You are solely responsible for all content you upload. See Section 7 for detailed obligations.

**Role-Specific Responsibilities**:
- **Anonymous Voters**: See Section 6 for key management requirements
- **Project Maintainers**: See Section 8.2 for moderation and revocation duties

## 6. Blockchain Technology and Anonymous Voting Risks

You acknowledge and accept the following risks:

**Transaction Irreversibility**: Blockchain transactions are permanent and cannot be reversed.

**Cryptocurrency Volatility**: XLM prices fluctuate significantly.

**Network Dependencies**: Services rely on Stellar Network, IPFS, Soroban Domains, and other third-party services beyond our control.

**Smart Contract Risks**: Contracts may contain bugs or unexpected behavior.

**Fork Risk**: We follow the canonical Stellar blockchain as determined by the Stellar Development Foundation (SDF).

**Anonymous Voting Risks**:
- ECDH key pairs generated client-side using Web Crypto API
- You must securely download and store private keys before voting
- Lost keys prevent vote decryption and proposal execution
- No recovery mechanism exists

**No Recourse**: Lost keys, failed transactions, or errors cannot be reversed or compensated.

## 7. IPFS Content Storage and Moderation

### 7.1 Infrastructure Provider Role

**Our Role**: We provide infrastructure services for decentralized content storage using IPFS (InterPlanetary File System). We are not a content host, publisher, or content service provider under the Digital Services Act (DSA).

**Content Permanence**: IPFS is a decentralized, peer-to-peer network where content is distributed across multiple nodes. Once content is uploaded to IPFS:
- It receives a unique Content Identifier (CID)
- It may be cached and replicated across the network
- It persists independently of our platform
- It cannot be deleted from the IPFS network

### 7.2 Content Moderation Limitations

**Limited Moderation Capabilities**: As an infrastructure provider, we have limited ability to moderate content on IPFS. We can only unlink content references from our smart contracts - content remains accessible via its CID even after unlinking.

**On-Chain Unlinking**: When we remove content references from our smart contracts, the content is no longer displayed in our dApp interface but remains on IPFS and accessible via direct CID.

**Reporting Mechanisms**: Users can report inappropriate content by contacting legal@consulting-manao.com. Removal is limited to unlinking from our platform.

### 7.3 Content Liability

**User Responsibility**: You are solely liable for all content you upload, including legal compliance, intellectual property rights, accuracy, and appropriateness.

**Platform Immunity**: We are not liable for user-generated content stored on IPFS, except where required by applicable law.

**Maintainer Authority**: Project maintainers have authority to moderate content within their projects and may request content unlinking from our platform.

## 8. Proposal System and Revocation Mechanisms

### 8.1 Proposal Submission and Collateral

**Collateral Requirement**: Proposals require collateral in XLM to prevent spam and ensure serious submissions. The collateral amount is fixed and set by Tansu in the smart contract.

**Voting Collateral**: Voters must also provide collateral to participate in voting, ensuring commitment to the governance process.

**Collateral Reimbursement**: Collateral is reimbursed to proposers and voters when proposals are successfully executed.

**Collateral Forfeiture**: Collateral may be forfeited if:
- The proposal is revoked by the maintainer
- The proposal violates these Terms
- The proposal contains illegal or inappropriate content
- The proposal is found to be fraudulent or deceptive
- The proposal fails to execute due to technical issues

**Non-Refundable Deterrent Deposit**: Collateral serves as a deterrent against malicious proposals and is generally non-refundable except upon successful execution.

### 8.2 Maintainer Authority and Revocation

**Revocation Rights**: Project maintainers have the authority to revoke proposals within their projects.

**Revocation Grounds**: Maintainers may revoke proposals for:
- Terms violations or prohibited activities
- Inappropriate or illegal content
- Technical issues or errors
- Disputes or conflicts
- Any reason at their discretion

**Revocation Process**:
1. Maintainer initiates revocation through the dApp interface
2. Collateral is forfeited to the maintainer
3. Proposal is marked as revoked
4. Voting is terminated
5. Proposal cannot be re-submitted

**Revocation Effect**: Revoked proposals:
- Are removed from active voting
- Cannot be executed
- Result in collateral forfeiture
- Are marked in the proposal history

**Appeals**: Revocation decisions are final and cannot be appealed through our platform.

### 8.3 Soroban Domains Escalation

**Domain Disputes**: For projects using Soroban Domains, disputes may be escalated to the Soroban Domains system.

**Domain Authority**: Soroban Domains maintainers have ultimate authority over domain-related decisions.

**Platform Compliance**: We will comply with Soroban Domains decisions regarding domain ownership and usage.

**Registration Fees**: Project registration fees and related costs are handled by Soroban Domains, not Tansu. We are not responsible for Soroban Domains' fee structure or payment processing.

## 9. Intellectual Property

**Your Content**: You retain ownership of all content you create and upload to our platform.

**License Grant**: By uploading content, you grant us a limited, non-exclusive license to:
- Store and display your content through our services
- Process your content for platform functionality
- Make your content available to other users as intended

**License Scope**: This license is limited to platform operations and does not grant us ownership or commercial rights beyond what is necessary for service provision.

**Third-Party Content**: You must not upload content that infringes on third-party intellectual property rights.

**Platform IP**: Our platform, including smart contracts, user interface, and documentation, is protected by intellectual property laws.

## 10. Privacy and Data Protection

Please review our separate Privacy Policy for complete details on data collection, processing, and your GDPR rights.

**Key Points**:
- No backend servers or centralized databases
- Blockchain data is public and immutable
- IPFS content is permanent
- Browser local storage for session management (no cookies)
- See Section 14 for third-party service providers

**Contact**: legal@consulting-manao.com

## 11. Disclaimers and Limitations of Liability

**Service Availability**: We do not guarantee continuous, uninterrupted access to our services.

**Third-Party Dependencies**: Our services depend on third-party systems (Stellar Network, IPFS, etc.) that are beyond our control.

**No Warranties**: We provide services "as is" without warranties of any kind.

**Limitation of Liability**: Our liability is limited to the maximum extent permitted by Austrian law.

**Force Majeure**: We are not liable for delays or failures due to circumstances beyond our reasonable control.

**Content Liability Disclaimer**: We are not liable for user-generated content stored on IPFS or blockchain, except where required by applicable law.

## 12. Prohibited Activities and Content Moderation

### 12.1 Prohibited Activities

You must not:
- Upload illegal, harmful, or inappropriate content
- Attempt to compromise platform security
- Engage in fraudulent or deceptive practices
- Violate intellectual property rights
- Use services for prohibited purposes
- Interfere with other users' use of the platform
- Create multiple accounts to circumvent restrictions
- Attempt to manipulate voting or governance processes

See Section 7 for technical details on content removal limitations.

### 12.2 Content Moderation

**Reporting**: Users can report inappropriate content by contacting legal@consulting-manao.com.

**Moderation Actions**: We may:
- Unlink content from our platform
- Suspend or terminate accounts
- Cancel proposals
- Take other actions as necessary

**Appeals**: Users may contest moderation actions by contacting legal@consulting-manao.com.

## 13. Service Modifications, Smart Contract Upgrades, and Administrative Rights

### 13.1 General Modification Rights

**Service Changes**: We reserve the right to modify, suspend, or discontinue the dApp or any part thereof at any time, with or without notice, except where notice is required by applicable law.

**No Liability**: We are not liable for any modification, suspension, or discontinuation of services, except in cases of intent (*Vorsatz*) or gross negligence (*grobe Fahrlässigkeit*).

### 13.2 Smart Contract Upgrades and Modifications

**Upgrade Authority**: We retain the right to upgrade, modify, or replace smart contracts deployed on the Stellar blockchain for the following purposes:

**Permitted Modifications**:
- **Feature Additions**: Adding new functionality, improving user experience, or introducing new governance mechanisms
- **Bug Fixes**: Correcting errors, vulnerabilities, or unexpected behavior in smart contract code
- **Security Updates**: Addressing security vulnerabilities, preventing exploits, or enhancing platform security
- **Compliance Updates**: Modifying contracts to comply with new laws, regulations, court orders, or regulatory guidance
- **Performance Optimization**: Improving gas efficiency, transaction speed, or contract execution
- **Data Corrections**: Altering on-chain data to correct errors, resolve disputes, or comply with legal requirements

**Upgrade Process**:
- Multi-admin approval required (threshold signature scheme)
- Timelock period of 7 days for non-emergency upgrades where technically feasible
- Emergency upgrades for security or legal compliance may be immediate
- Users will be notified of material changes via the dApp interface and social media communications

**Backward Compatibility**: We will use reasonable efforts to maintain backward compatibility with existing proposals, voting records, and user data, but cannot guarantee complete compatibility across all upgrades.

**User Impact**: Smart contract upgrades may:
- Change how features work
- Modify voting mechanisms or weight calculations
- Alter collateral requirements or forfeiture conditions
- Update badge assignment or revocation processes
- Affect pending proposals or voting periods

**No Compensation**: Users are not entitled to compensation for changes, losses, or disruptions resulting from smart contract upgrades, except in cases of intent (*Vorsatz*) or gross negligence (*grobe Fahrlässigkeit*).

### 13.3 Administrative Actions and Data Modifications

**Administrative Authority**: We reserve the right to take administrative actions directly on smart contracts and on-chain data, including:

**Project Management**:
- **Project Deletion**: Removing projects from the platform for Terms violations, legal compliance, court orders, or regulatory requirements
- **Project Suspension**: Temporarily disabling projects pending investigation or dispute resolution
- **Maintainer Changes**: Modifying project maintainer lists to resolve disputes, comply with Soroban Domains decisions, or address security concerns

**Proposal Management**:
- **Proposal Cancellation**: Cancelling proposals that violate Terms, contain illegal content, or pose security risks
- **Vote Invalidation**: Invalidating votes found to be fraudulent, manipulated, or technically compromised
- **Forced Execution**: Executing or rejecting proposals to resolve technical issues or comply with legal requirements

**Member Management**:
- **Badge Revocation**: Removing badges from members who violate Terms, engage in malicious activity, or as required by maintainers
- **Account Suspension**: Suspending member accounts for Terms violations, security threats, or legal compliance
- **Data Correction**: Modifying member data to correct errors, remove illegal content references, or comply with GDPR/legal requirements

**Collateral Management**:
- **Collateral Forfeiture**: Forfeiting collateral for revoked proposals or Terms violations
- **Collateral Return**: Returning collateral in cases of technical errors, disputes, or good faith mistakes

**Legal Compliance Actions**: We may take any necessary action on smart contracts or on-chain data to comply with:
- Court orders, subpoenas, or legal process
- Regulatory requirements or guidance from Austrian or EU authorities
- GDPR or data protection obligations
- Anti-money laundering (AML) or counter-terrorism financing (CTF) laws
- Intellectual property enforcement (copyright, trademark)
- Child protection laws or illegal content removal requirements

**Notice**: Where legally permissible and technically feasible, we will provide advance notice of administrative actions. However, emergency situations, security threats, or legal prohibitions may require immediate action without notice.

**Appeals**: Users may contest administrative actions by contacting legal@consulting-manao.com with supporting evidence. We will review appeals in good faith but reserve final discretion.

**Limitation of Liability**: We are not liable for consequences of administrative actions taken in good faith to enforce Terms, ensure security, or comply with legal requirements.

### 13.4 Account Suspension and Termination

**Suspension Grounds**: We may suspend user accounts for:
- Terms violations or prohibited activities
- Suspected fraudulent or malicious behavior
- Security threats to the platform or other users
- Legal compliance or regulatory requirements
- Chargebacks or payment disputes (if applicable)

**Termination Grounds**: Access may be permanently terminated for:
- Repeated or severe Terms violations
- Uploading illegal content (CSAM, terrorism material, etc.)
- Fraudulent activity or attempt to compromise platform security
- Residence in or relocation to restricted jurisdictions
- Court order or regulatory directive

**Effect of Termination**:
- Account access disabled
- Future registrations prohibited
- Pending proposals may be cancelled
- Collateral may be forfeited (depending on reason for termination)
- Data on blockchain and IPFS persists per Section 7

**No Refunds**: Collateral, transaction fees, or other amounts paid are non-refundable upon termination, except where required by law.

### 13.5 Emergency Powers

**Emergency Situations**: In cases of imminent harm, security breaches, legal emergencies, or critical system failures, we may:
- Immediately pause all or part of the smart contract functionality
- Suspend specific features, projects, or user accounts without notice
- Modify smart contracts without timelock periods
- Take any action necessary to protect users, comply with law, or maintain platform integrity

**Emergency Contact**: For urgent security issues, contact: legal@consulting-manao.com with subject "SECURITY EMERGENCY"

## 14. Third-Party Services

Our platform integrates with various third-party services:

**Stellar Network**: Blockchain infrastructure for transactions and smart contracts
- Privacy Policy: https://stellar.org/privacy-policy

**IPFS/Storacha**: Decentralized content storage
- Privacy Policy: https://storacha.com/privacy

**Soroban Domains**: Domain name registration
- Privacy Policy: https://sorobandomains.com/privacy

**GitHub**: Code hosting and version control
- Privacy Policy: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

**Netlify**: Web hosting and deployment
- Privacy Policy: https://www.netlify.com/privacy/

**Cloudflare**: CDN and security services
- Privacy Policy: https://www.cloudflare.com/privacypolicy/

**Third-Party Terms**: Your use of these services is subject to their respective terms and privacy policies.

**No Control**: We have no control over third-party services and are not liable for their actions or policies.

## 15. Indemnification

You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:
- Your use of our services
- Your violation of these Terms
- Your violation of any law or regulation
- Your infringement of third-party rights
- Content you upload or submit

## 16. Force Majeure

We are not liable for delays or failures due to circumstances beyond our reasonable control, including:
- Natural disasters
- Government actions
- Network outages
- Third-party service failures
- Cyber attacks
- Other force majeure events

## 17. Amendments

**Modification Rights**: We may modify these Terms at any time.

**Notice**: Material changes will be communicated through the dApp interface.

**Acceptance**: Continued use constitutes acceptance of modified Terms.

**Effective Date**: Changes become effective immediately upon posting.

## 18. Severability

If any provision of these Terms is found invalid or unenforceable, the remaining provisions remain in full force and effect.

## 19. Entire Agreement

These Terms constitute the entire agreement between you and us regarding the use of our services.

## 20. No Waiver

Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.

## 21. Governing Law and Dispute Resolution

**Governing Law**: These Terms are governed by Austrian law (*österreichisches Recht*). To the extent these Terms constitute general terms and conditions (*Allgemeine Geschäftsbedingungen*), they comply with Austrian law, particularly ABGB (Allgemeines bürgerliches Gesetzbuch) §§ 879-916 regarding unfair contract terms.

**Jurisdiction**: Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the competent courts in Graz, Austria.

**Consumer Protection**: If you are a consumer, you may also bring proceedings in the courts of your country of residence. This does not affect your rights under EU consumer protection law.

**Dispute Resolution**: We encourage users to contact us first at legal@consulting-manao.com to resolve disputes amicably.

**Alternative Dispute Resolution**: We are not obligated to participate in dispute resolution procedures before consumer arbitration boards. EU consumers may use the European Commission's Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr

**Right of Withdrawal**: As our platform provides digital services that begin immediately upon your request (account creation, proposal submission), the 14-day withdrawal right under EU Consumer Rights Directive 2011/83/EU does not apply per Article 16(a). By using our services, you expressly agree to immediate performance and acknowledge loss of withdrawal rights.

## 22. Company Information and Contact

**Consulting Manao GmbH**  
Registered in Austrian Commercial Register (Firmenbuch)  
Landesgericht Graz, FN 571029z  
VAT ID: ATU77780135  
Managing Director: Pamphile Tupui Christophe Roy

**Contact**:  
Email: legal@consulting-manao.com  
Website: tansu.dev

**Contract Language**: These Terms are provided in English. Austrian law applies.

**Last Updated**: October 21, 2025
