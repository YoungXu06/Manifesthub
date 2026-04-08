import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Simplified Quill Editor that prevents duplicate toolbars
 * Optimized for React StrictMode and form usage
 */
const QuillEditorV2 = ({ 
  value = '', 
  onChange, 
  readOnly = false, 
  placeholder = '', 
  className = '',
  ...props 
}) => {
  const containerRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Initialize Quill once when component mounts
  useEffect(() => {
    let quill = null;
    
    const initQuill = () => {
      if (!containerRef.current || quillInstanceRef.current) {
        return;
      }

      // Clear any existing content
      containerRef.current.innerHTML = '';

      try {
        quill = new Quill(containerRef.current, {
          theme: 'snow',
          readOnly,
          placeholder,
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              [{ 'header': [1, 2, 3, false] }],
              ['link'],
              ['clean']
            ]
          },
          formats: [
            'header', 'bold', 'italic', 'underline', 'strike',
            'list', 'link'
          ]
        });

        quillInstanceRef.current = quill;

        // Set initial content
        if (value && value !== '<p><br></p>') {
          quill.clipboard.dangerouslyPasteHTML(value);
        }

        // Handle text changes
        const handleChange = () => {
          if (onChange && quill) {
            const content = quill.root.innerHTML;
            onChange(content);
          }
        };

        quill.on('text-change', handleChange);
        setMounted(true);

      } catch (error) {
        console.error('Failed to initialize Quill:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initQuill, 10);

    return () => {
      clearTimeout(timer);
      if (quill) {
        try {
          quill.off('text-change');
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      quillInstanceRef.current = null;
      setMounted(false);
    };
  }, []); // Only run on mount/unmount

  // Update content when value changes
  useEffect(() => {
    if (mounted && quillInstanceRef.current && value !== undefined) {
      const currentContent = quillInstanceRef.current.root.innerHTML;
      if (value !== currentContent) {
        const selection = quillInstanceRef.current.getSelection();
        quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value || '');
        
        // Restore cursor position if needed
        if (selection) {
          setTimeout(() => {
            if (quillInstanceRef.current) {
              try {
                quillInstanceRef.current.setSelection(selection);
              } catch (e) {
                // Ignore selection errors
              }
            }
          }, 0);
        }
      }
    }
  }, [value, mounted]);

  // Update readOnly state
  useEffect(() => {
    if (mounted && quillInstanceRef.current) {
      quillInstanceRef.current.enable(!readOnly);
    }
  }, [readOnly, mounted]);

  return (
    <div 
      className={`quill-editor-wrapper ${className}`}
      ref={containerRef}
      {...props}
    />
  );
};

export default QuillEditorV2; 