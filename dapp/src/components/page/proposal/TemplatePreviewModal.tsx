// /components/page/proposal/TemplatePreviewModal.tsx
import { type ProposalTemplate } from '../../../constants/proposalTemplates';

interface TemplatePreviewModalProps {
  template: ProposalTemplate;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: () => void;
}

export default function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate
}: TemplatePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-primary">{template.name}</h3>
              <p className="text-sm text-secondary">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="template-preview">
              <pre className="whitespace-pre-wrap font-mono text-sm">{template.content}</pre>
            </div>
            
            <div className="mt-6 text-sm text-secondary">
              <p className="font-medium mb-2">Template Guidelines:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Replace text in brackets <code>[like this]</code> with your content</li>
                <li>Customize sections to fit your specific proposal</li>
                <li>Add or remove sections as needed</li>
                <li>Ensure all placeholders are filled before submitting</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onUseTemplate();
                onClose();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}