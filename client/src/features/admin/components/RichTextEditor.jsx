import { useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Configurazione semplificata dell'editor
const MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

const FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'link'
];

export default function RichTextEditor({ value, onChange }) {
  const handleChange = useCallback((content) => {
    onChange(content);
  }, [onChange]);

  return (
    <div className="border rounded-lg">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={MODULES}
        formats={FORMATS}
        className="h-[300px]"
      />
    </div>
  );
}