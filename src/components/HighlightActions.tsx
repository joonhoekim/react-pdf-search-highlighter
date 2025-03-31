import React, { useRef } from "react";
import type { IHighlight } from "../types";

interface ExportHighlightsProps {
  highlights: Array<IHighlight>;
  documentName?: string;
  buttonText?: string;
  buttonStyle?: React.CSSProperties;
}

interface ImportHighlightsProps {
  onImport: (highlights: Array<IHighlight>) => void;
  buttonText?: string;
  buttonStyle?: React.CSSProperties;
}

/**
 * Component for exporting highlights to a JSON file
 */
export const ExportHighlights: React.FC<ExportHighlightsProps> = ({
  highlights,
  documentName = "document",
  buttonText = "Export Highlights",
  buttonStyle,
}) => {
  const handleExport = () => {
    if (highlights.length === 0) {
      alert('No highlights to export.');
      return;
    }
    
    const highlightsJson = JSON.stringify(highlights, null, 2);
    const blob = new Blob([highlightsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `highlights-${documentName}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      style={{
        padding: "0.5rem",
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        borderRadius: "4px",
        cursor: "pointer",
        ...buttonStyle
      }}
    >
      {buttonText}
    </button>
  );
};

/**
 * Component for importing highlights from a JSON file
 */
export const ImportHighlights: React.FC<ImportHighlightsProps> = ({
  onImport,
  buttonText = "Import Highlights",
  buttonStyle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedHighlights = JSON.parse(content) as Array<IHighlight>;
        onImport(importedHighlights);
      } catch (error) {
        console.error('Failed to import highlights:', error);
        alert('Invalid highlights file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <label
      style={{
        display: "inline-block",
        padding: "0.5rem",
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        borderRadius: "4px",
        cursor: "pointer",
        textAlign: "center",
        ...buttonStyle
      }}
    >
      {buttonText}
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </label>
  );
};

/**
 * Component that combines export and import functionality
 */
export const HighlightActions: React.FC<{
  highlights: Array<IHighlight>;
  documentName?: string;
  onImport: (highlights: Array<IHighlight>) => void;
  containerStyle?: React.CSSProperties;
  exportButtonText?: string;
  importButtonText?: string;
  buttonStyle?: React.CSSProperties;
}> = ({
  highlights,
  documentName = "document",
  onImport,
  containerStyle,
  exportButtonText = "Export",
  importButtonText = "Import",
  buttonStyle,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        ...containerStyle
      }}
    >
      <ExportHighlights
        highlights={highlights}
        documentName={documentName}
        buttonText={exportButtonText}
        buttonStyle={{
          flex: 1,
          ...buttonStyle
        }}
      />
      
      <ImportHighlights
        onImport={onImport}
        buttonText={importButtonText}
        buttonStyle={{
          flex: 1,
          ...buttonStyle
        }}
      />
    </div>
  );
}; 