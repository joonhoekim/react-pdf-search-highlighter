import { useState, useRef, type ChangeEvent } from "react";

interface Props {
    onPdfUploaded: (pdfUrl: string) => void;
}

export function PdfUploader({ onPdfUploaded }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if file is a PDF
        if (file.type !== "application/pdf") {
            setErrorMessage("Please upload a PDF file");
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        // Create an object URL for the file
        const objectUrl = URL.createObjectURL(file);

        // Call the callback with the URL
        onPdfUploaded(objectUrl);
        setIsLoading(false);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="pdf-uploader" style={{ marginBottom: "1rem" }}>
            <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: "none" }}
            />
            <button
                type="button"
                onClick={handleButtonClick}
                disabled={isLoading}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#4a8cf7",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isLoading ? "wait" : "pointer"
                }}
            >
                {isLoading ? "Uploading..." : "Upload PDF"}
            </button>
            {errorMessage && (
                <div style={{ color: "red", marginTop: "0.5rem" }}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
} 