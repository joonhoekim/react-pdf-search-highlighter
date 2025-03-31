import React, { useState, useEffect, useCallback, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
  usePdfSearch
} from "./react-pdf-highlighter";
import type {
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
} from "./react-pdf-highlighter";

import { Sidebar } from "./Sidebar";
import { Spinner } from "./Spinner";
import { testHighlights as _testHighlights } from "./test-highlights";

import "./style/App.css";
import "../../dist/style.css";

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string; color?: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480";

export function App() {
  const searchParams = new URLSearchParams(document.location.search);
  const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

  const [url, setUrl] = useState(initialUrl);
  const [currentPdfName, setCurrentPdfName] = useState<string>("Default PDF");
  const [uploadedPdfUrls, setUploadedPdfUrls] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Array<IHighlight>>(
    testHighlights[initialUrl] ? [...testHighlights[initialUrl]] : [],
  );
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  const {
    searchHighlightIds,
    clearSearchHighlights: clearSearch,
    searchText: search,
    hasSearchHighlights
  } = usePdfSearch();

  // Store highlights per PDF
  const [highlightsPerPdf, setHighlightsPerPdf] = useState<Record<string, Array<IHighlight>>>(
    testHighlights
  );

  const resetHighlights = () => {
    setHighlights([]);

    // Also update the highlights for current PDF in our storage
    setHighlightsPerPdf(prev => ({
      ...prev,
      [url]: []
    }));
  };

  const clearSearchHighlights = () => {
    clearSearch(highlights, setHighlights);

    // Also update the highlights for current PDF in our storage
    setHighlightsPerPdf(prev => ({
      ...prev,
      [url]: highlights.filter(highlight => !searchHighlightIds.has(highlight.id))
    }));
  };

  const toggleDocument = () => {
    // Save current highlights
    saveCurrentHighlights();

    const newUrl =
      url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

    setUrl(newUrl);
    setCurrentPdfName(newUrl === PRIMARY_PDF_URL ? "Primary PDF" : "Secondary PDF");

    // Load highlights for the selected PDF
    const pdfHighlights = highlightsPerPdf[newUrl] || [];
    setHighlights(pdfHighlights);
  };

  const handlePdfUploaded = (pdfUrl: string) => {
    // Save current highlights before switching
    saveCurrentHighlights();

    // Add to uploaded PDFs list if not already there
    if (!uploadedPdfUrls.includes(pdfUrl)) {
      setUploadedPdfUrls(prev => [...prev, pdfUrl]);
    }

    // Set the new PDF URL
    setUrl(pdfUrl);

    // Generate a name for the uploaded PDF
    const pdfName = `Uploaded PDF ${uploadedPdfUrls.length + 1}`;
    setCurrentPdfName(pdfName);

    // Load empty highlights for the new PDF
    setHighlights(highlightsPerPdf[pdfUrl] || []);
  };

  const saveCurrentHighlights = () => {
    // Store current highlights for the current PDF
    setHighlightsPerPdf(prev => ({
      ...prev,
      [url]: highlights
    }));
  };

  // URL이 변경될 때 하이라이트 저장
  useEffect(() => {
    saveCurrentHighlights();
  }, [url]);  // URL이 변경될 때마다 실행

  useEffect(() => {
    // 컴포넌트가 언마운트될 때 현재 하이라이트 저장
    return () => {
      saveCurrentHighlights();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollViewerTo = useRef((highlight: IHighlight) => { });

  // getHighlightById 함수는 항상 최신 하이라이트를 사용해야 함
  const getHighlightById = useCallback((id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  }, [highlights]);

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, [getHighlightById]);

  // 문서 해시가 변경될 때마다 스크롤 실행
  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false,
      );
    };
  }, [scrollToHighlightFromHash]);

  const addHighlight = (highlight: NewHighlight) => {
    console.log("Saving highlight", highlight);
    const newHighlight = { ...highlight, id: getNextId() };

    setHighlights((prevHighlights) => [
      newHighlight,
      ...prevHighlights,
    ]);
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>,
  ) => {
    console.log("Updating highlight", highlightId, position, content);
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
            id,
            position: { ...originalPosition, ...position },
            content: { ...originalContent, ...content },
            ...rest,
          }
          : h;
      }),
    );
  };

  // 검색 텍스트 함수
  const searchText = (text: string, color: string) => {
    if (!pdfDocument) return;

    search(
      text,
      color,
      pdfDocument,
      highlights,
      setHighlights,
      getNextId,
      (highlight: IHighlight) => scrollViewerTo.current(highlight)
    );
  };

  // 하이라이트 가져오기 함수
  const importHighlights = (importedHighlights: Array<IHighlight>) => {
    // 가져온 하이라이트에 ID가 없는 경우 ID 생성
    const processedHighlights = importedHighlights.map(highlight => {
      if (!highlight.id) {
        return { ...highlight, id: getNextId() };
      }
      return highlight;
    });

    // 중복을 방지하기 위해 ID 기준으로 기존 하이라이트와 병합
    const existingIds = new Set(highlights.map(h => h.id));
    const newHighlights = [
      ...highlights,
      ...processedHighlights.filter(h => !existingIds.has(h.id))
    ];

    setHighlights(newHighlights);

    // 현재 PDF에 대한 하이라이트 저장
    setHighlightsPerPdf(prev => ({
      ...prev,
      [url]: newHighlights
    }));

    alert(`${processedHighlights.length}개의 하이라이트를 가져왔습니다.`);
  };

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
        searchText={searchText}
        clearSearchHighlights={clearSearchHighlights}
        hasSearchHighlights={hasSearchHighlights}
        onPdfUploaded={handlePdfUploaded}
        currentPdfName={currentPdfName}
        onChangePdf={(newUrl) => {
          // Save current highlights
          saveCurrentHighlights();

          // Set new URL
          setUrl(newUrl);

          // Load highlights for the selected PDF
          setHighlights(highlightsPerPdf[newUrl] || []);
        }}
        availablePdfs={[
          { url: PRIMARY_PDF_URL, name: "Primary PDF" },
          { url: SECONDARY_PDF_URL, name: "Secondary PDF" },
          ...uploadedPdfUrls.map((pdfUrl, index) => ({
            url: pdfUrl,
            name: `Uploaded PDF ${index + 1}`
          }))
        ]}
        importHighlights={importHighlights}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
      >
        <div style={{ height: "100%" }}>
          <PdfLoader
            url={url}
            beforeLoad={<Spinner />}
            onPdfDocumentLoaded={(pdfDocument) => {
              setPdfDocument(pdfDocument);
              return pdfDocument;
            }}
          >
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={resetHash}
                pdfScaleValue="auto"
                scrollRef={(scrollTo) => {
                  scrollViewerTo.current = scrollTo;
                  scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection,
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      addHighlight({ content, position, comment });
                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo,
                ) => {
                  const isTextHighlight = !highlight.content?.image;

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) },
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={(popupContent) =>
                        setTip(highlight, (highlight) => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index.toString()}
                    >
                      {component}
                    </Popup>
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>
    </div>
  );
}

