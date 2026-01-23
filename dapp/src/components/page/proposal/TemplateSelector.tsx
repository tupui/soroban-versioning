import { useState } from 'react';
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../../../constants/proposalTemplates';

interface TemplateSelectorProps {
  onTemplateSelect: (template: ProposalTemplate) => void;
  currentContent: string;
}

export default function TemplateSelector({ 
  onTemplateSelect, 
  currentContent
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  const handleTemplateClick = (template: ProposalTemplate) => {
    // Always apply template immediately (user can edit afterwards)
    onTemplateSelect(template);
    setIsOpen(false);
  };

  const handlePreviewClick = (template: ProposalTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  return (
    <div className="template-selector mb-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-primary">Start with a template</p>
          <p className="text-xs text-secondary">Choose a structured format for your proposal</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {isOpen ? 'Hide Templates' : 'Browse Templates'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-lg">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {PROPOSAL_TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {template.name}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => handlePreviewClick(template, e)}
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Preview
                  </button>
                </div>
                <p className="text-xs text-secondary mb-3 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Click to apply template
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setPreviewTemplate(null)} />
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{previewTemplate.name}</h3>
                  <p className="text-sm text-secondary">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="template-preview">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{previewTemplate.content}</pre>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onTemplateSelect(previewTemplate);
                    setPreviewTemplate(null);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

