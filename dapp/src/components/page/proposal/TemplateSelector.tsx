import { useState } from 'react';
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../../../constants/proposalTemplates';

interface TemplateSelectorProps {
  onTemplateSelect: (template: ProposalTemplate) => void;
  currentContent: string;
  disabled?: boolean;
}

export default function TemplateSelector({ 
  onTemplateSelect, 
  currentContent,
  disabled = false
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(PROPOSAL_TEMPLATES.map(t => t.category))];

  const filteredTemplates = selectedCategory === 'all'
    ? PROPOSAL_TEMPLATES
    : PROPOSAL_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleTemplateClick = (template: ProposalTemplate) => {
    // Only apply template if current content is empty or just placeholder
    if (!currentContent || currentContent.trim().length < 20) {
      onTemplateSelect(template);
    } else {
      // Ask for confirmation before replacing
      if (confirm('Applying a template will replace your current content. Continue?')) {
        onTemplateSelect(template);
      }
    }
    setIsOpen(false);
  };

  if (disabled) {
    return (
      <div className="template-selector-disabled p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 opacity-50">
        <p className="text-sm text-gray-500">Templates available after entering proposal name</p>
      </div>
    );
  }

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
          disabled={disabled}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpen ? 'Hide Templates' : 'Browse Templates'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-lg">
          {/* Category Filter */}
          <div className="mb-4">
            <p className="text-xs font-medium text-secondary mb-2">Filter by category:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full capitalize ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateClick(template)}
                className="text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {template.name}
                  </h4>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-xs text-secondary mb-3 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Use template
                </div>
              </button>
            ))}
          </div>

          {/* Template Info */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-secondary">
              <strong>Tip:</strong> Templates provide structure but can be fully customized. 
              Replace bracketed text like <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">[Proposal Title]</code> with your content.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}