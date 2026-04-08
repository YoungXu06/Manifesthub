import React, { useEffect, useRef, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Custom Quill editor component optimized for React StrictMode
 * Prevents duplicate toolbar and ensures proper cleanup
 */
const QuillEditor = ({ value, onChange, readOnly = false, placeholder = '', className = '', ...props }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastValueRef = useRef(value);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (quillRef.current) {
      // console.log('Cleaning up Quill editor...');
      
      try {
        // Remove all event listeners
        quillRef.current.off('text-change');
        
        // Disable the editor to prevent further interactions
        quillRef.current.disable();
        
        // Clear the container completely
        if (containerRef.current) {
          // Remove all Quill-generated elements
          const toolbars = containerRef.current.querySelectorAll('.ql-toolbar');
          const containers = containerRef.current.querySelectorAll('.ql-container');
          
          toolbars.forEach(toolbar => toolbar.remove());
          containers.forEach(container => container.remove());
          
          // Final cleanup - remove all remaining children
          containerRef.current.innerHTML = '';
        }
      } catch (error) {
        console.warn('Error during Quill cleanup:', error);
      }
      
      quillRef.current = null;
      isInitializedRef.current = false;
    }
  }, []);

  // Initialize Quill editor
  const initializeEditor = useCallback(() => {
    if (isInitializedRef.current || !containerRef.current) {
      return;
    }

    // Ensure container is clean before initialization
    containerRef.current.innerHTML = '';

    try {
      // Add debug info
      // console.log('Initializing Quill editor...');
      
      // Create Quill instance
      const quill = new Quill(containerRef.current, {
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
          'header',
          'bold', 'italic', 'underline', 'strike',
          'list',
          'link'
        ]
      });

      quillRef.current = quill;
      isInitializedRef.current = true;

      // Set initial content
      if (value && value !== '<p><br></p>') {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Set up change handler
      const handleTextChange = () => {
        if (onChange && quillRef.current) {
          const content = quillRef.current.root.innerHTML;
          lastValueRef.current = content;
          onChange(content);
        }
      };

      quill.on('text-change', handleTextChange);

    } catch (error) {
      console.error('Failed to initialize Quill editor:', error);
      cleanup();
    }
  }, [readOnly, placeholder, onChange, value, cleanup]);

  // Initialize editor on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && !isInitializedRef.current) {
        initializeEditor();
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeEditor, cleanup]);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && isInitializedRef.current && value !== lastValueRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      
      if (value !== currentContent) {
        const selection = quillRef.current.getSelection();
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        lastValueRef.current = value;
        
        // Restore selection if it existed
        if (selection) {
          setTimeout(() => {
            if (quillRef.current) {
              quillRef.current.setSelection(selection);
            }
          }, 0);
        }
      }
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillRef.current && isInitializedRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Update placeholder
  useEffect(() => {
    if (quillRef.current && isInitializedRef.current) {
      quillRef.current.root.dataset.placeholder = placeholder;
    }
  }, [placeholder]);

  return (
    <div 
      className={`rich-text-editor-container ${className}`} 
      ref={containerRef} 
      {...props} 
    />
  );
};

export default QuillEditor; 