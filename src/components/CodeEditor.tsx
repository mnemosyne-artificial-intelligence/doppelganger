import { useEffect, useMemo, useRef } from 'react';
import { highlightCode, SyntaxLanguage } from '../utils/syntaxHighlight';

interface CodeEditorProps {
    value: string;
    onChange?: (val: string) => void;
    language: SyntaxLanguage;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    variables?: Record<string, any>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, placeholder, className, readOnly, variables }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    const displayValue = value || placeholder || '';
    const isPlaceholder = !value && !!placeholder;
    const highlighted = useMemo(() => highlightCode(displayValue, language, variables), [displayValue, language, variables]);

    useEffect(() => {
        const textarea = textareaRef.current;
        const pre = preRef.current;
        if (!textarea || !pre) return;
        const syncScroll = () => {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        };
        const syncFromPre = () => {
            textarea.scrollTop = pre.scrollTop;
            textarea.scrollLeft = pre.scrollLeft;
        };
        textarea.addEventListener('scroll', syncScroll);
        pre.addEventListener('scroll', syncFromPre);
        return () => {
            textarea.removeEventListener('scroll', syncScroll);
            pre.removeEventListener('scroll', syncFromPre);
        };
    }, []);

    return (
        <div className={`code-editor ${className || ''}`}>
            <pre
                ref={preRef}
                className={`code-editor-pre ${isPlaceholder ? 'code-editor-placeholder' : ''}`}
                dangerouslySetInnerHTML={{ __html: highlighted + (displayValue.endsWith('\n') ? '\n' : '') }}
            />
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                spellCheck={false}
                wrap="off"
                readOnly={readOnly}
                className={`code-editor-textarea ${readOnly ? 'code-editor-textarea-readonly' : ''}`}
                aria-label="Code editor"
                tabIndex={readOnly ? -1 : 0}
            />
        </div>
    );
};

export default CodeEditor;
