// import React from 'react';
// import { useState, useEffect } from 'react';
// import ProposalTypeButton from './proposalTypeButton';

// const ProposalsSection: React.FC = () => {
//   const [proposalType, setProposalType] = useState('proposal');

//   return (
//       <div>
//         <div className="flex items-center">
//           <ProposalTypeButton
//             proposalTypeStatus={proposalType}
//             proposalType='proposal'
//             title='Proposals'
//             position='start'
//             onClick={(proposalType: string) => setProposalType(proposalType)}
//           />
//           <ProposalTypeButton
//             proposalTypeStatus={proposalType}
//             proposalType='idea'
//             title='Ideas'
//             position='end'
//             onClick={(proposalType: string) => setProposalType(proposalType)}
//           />
//         </div>
//         <div className="w-full">

//         </div>
//       </div>
//   );
// };

// export default ProposalsSection;