import React, { useState } from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import { PdfSearchInput } from "./react-pdf-highlighter";
import { PdfUploader } from "./PdfUploader";

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  searchText: (text: string, color: string) => void;
  clearSearchHighlights: () => void;
  hasSearchHighlights: boolean;
  onPdfUploaded: (pdfUrl: string) => void;
  currentPdfName?: string;
  onChangePdf?: (url: string) => void;
  availablePdfs?: { url: string, name: string }[];
}

type TabType = 'tools' | 'highlights';

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

declare const APP_VERSION: string;

export function Sidebar({
  highlights,
  toggleDocument,
  resetHighlights,
  searchText,
  clearSearchHighlights,
  hasSearchHighlights,
  onPdfUploaded,
  currentPdfName,
  onChangePdf,
  availablePdfs,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('tools');

  return (
    <div className="sidebar" style={{
      width: "25vw",
      display: "flex",
      flexDirection: "column",
      height: "100vh"
    }}>
      {/* 헤더 - 고정됨 */}
      <div className="sidebar-header" style={{
        padding: "0.75rem",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f5f5f5"
      }}>
        <h2 style={{ marginBottom: "0.5rem" }}>
          PDF Highlighter with Search
        </h2>
        <small>
          Alt(Option) + Click and Drag로 영역 하이라이트
        </small>
      </div>

      {/* 탭 네비게이션 - 고정됨 */}
      <div className="sidebar-tabs" style={{
        display: "flex",
        borderBottom: "1px solid #ddd"
      }}>
        <button
          onClick={() => setActiveTab('tools')}
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: activeTab === 'tools' ? "#fff" : "#f5f5f5",
            border: "none",
            borderBottom: activeTab === 'tools' ? "2px solid #4a8cf7" : "none",
            cursor: "pointer",
            fontWeight: activeTab === 'tools' ? "bold" : "normal"
          }}
        >
          도구
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: activeTab === 'highlights' ? "#fff" : "#f5f5f5",
            border: "none",
            borderBottom: activeTab === 'highlights' ? "2px solid #4a8cf7" : "none",
            cursor: "pointer",
            fontWeight: activeTab === 'highlights' ? "bold" : "normal"
          }}
        >
          하이라이트 ({highlights.length})
        </button>
      </div>

      {/* 탭 콘텐츠 - 스크롤 가능 */}
      <div className="sidebar-content" style={{
        flex: 1,
        overflowY: "auto",
        padding: "0.75rem"
      }}>
        {activeTab === 'tools' && (
          <div className="tools-tab">
            <div style={{ marginBottom: "1.5rem" }}>
              <h3>Upload PDF</h3>
              <PdfUploader onPdfUploaded={onPdfUploaded} />
            </div>

            {availablePdfs && availablePdfs.length > 0 && onChangePdf && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3>Select PDF</h3>
                <select
                  value={currentPdfName}
                  onChange={(e) => {
                    const selectedPdf = availablePdfs.find(pdf => pdf.name === e.target.value);
                    if (selectedPdf) {
                      onChangePdf(selectedPdf.url);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                >
                  {availablePdfs.map((pdf) => (
                    <option key={pdf.url} value={pdf.name}>
                      {pdf.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <h3>Search Text</h3>
              <PdfSearchInput
                onSearch={searchText}
                hasSearchHighlights={hasSearchHighlights}
                onClearSearch={clearSearchHighlights}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={toggleDocument}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Toggle PDF
              </button>

              {highlights.length > 0 && (
                <button
                  type="button"
                  onClick={resetHighlights}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'highlights' && (
          <ul className="sidebar__highlights" style={{
            listStyleType: "none",
            padding: 0,
            margin: 0
          }}>
            {highlights.length === 0 ? (
              <div style={{
                padding: "1rem",
                textAlign: "center",
                color: "#666"
              }}>
                하이라이트가 없습니다.
              </div>
            ) : (
              highlights.map((highlight, index) => (
                <li
                  key={highlight.id || index}
                  className="sidebar__highlight"
                  onClick={() => {
                    updateHash(highlight);
                  }}
                  style={{
                    padding: "0.75rem",
                    marginBottom: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                  }}
                >
                  <div>
                    <strong style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: highlight.comment.color || "#000"
                    }}>
                      {highlight.comment.emoji} {highlight.comment.text}
                    </strong>
                    {highlight.content.text ? (
                      <blockquote style={{
                        margin: "0.5rem 0",
                        padding: "0.5rem",
                        borderLeft: "3px solid #ddd",
                        fontSize: "0.9rem",
                        color: "#555"
                      }}>
                        {`${highlight.content.text.slice(0, 90).trim()}…`}
                      </blockquote>
                    ) : null}
                    {highlight.content.image ? (
                      <div
                        className="highlight__image"
                        style={{ marginTop: "0.5rem" }}
                      >
                        <img
                          src={highlight.content.image}
                          alt={"Screenshot"}
                          style={{ maxWidth: "100%", borderRadius: "4px" }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="highlight__location" style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#777",
                    textAlign: "right"
                  }}>
                    Page {highlight.position.pageNumber}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
