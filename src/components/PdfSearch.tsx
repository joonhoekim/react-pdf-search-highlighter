import { useState, useCallback, type FC, type FormEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { IHighlight, NewHighlight, ScaledPosition } from "../types";

export const usePdfSearch = () => {
    const [searchHighlightIds, setSearchHighlightIds] = useState<Set<string>>(new Set());

    const clearSearchHighlights = useCallback((highlights: Array<IHighlight>, updateHighlights: (highlights: Array<IHighlight>) => void) => {
        if (searchHighlightIds.size === 0) return;

        const updatedHighlights = highlights.filter(highlight => !searchHighlightIds.has(highlight.id));
        updateHighlights(updatedHighlights);
        setSearchHighlightIds(new Set());
    }, [searchHighlightIds]);

    const searchText = useCallback(async (
        text: string,
        color: string,
        pdfDocument: PDFDocumentProxy,
        highlights: Array<IHighlight>,
        updateHighlights: (highlights: Array<IHighlight>) => void,
        getNextId: () => string,
        scrollToHighlight: (highlight: IHighlight) => void
    ) => {
        if (!pdfDocument || !text) return;

        console.log("Searching for:", text, "with color:", color);

        let searchPattern: RegExp;
        try {
            // Try to create a RegExp from the search text
            searchPattern = new RegExp(text);
        } catch (e) {
            // If invalid regex, escape special characters and use as literal text
            const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            searchPattern = new RegExp(escapedText);
        }

        // Search through all pages
        const totalPages = pdfDocument.numPages;
        const newHighlights: NewHighlight[] = [];

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            try {
                const page = await pdfDocument.getPage(pageNumber);
                const textContent = await page.getTextContent();

                // Get the viewport with default scale 1.0
                // const viewport = page.getViewport({ scale: 1.0 });

                // Process text content to find matches
                for (const item of textContent.items) {
                    const textItem = item as {
                        str: string;
                        transform: number[];
                        width: number;
                        height?: number;
                    };

                    const str = textItem.str || "";

                    // Skip empty strings
                    if (!str) continue;

                    // Check for matches with the regular expression
                    const matches = str.match(searchPattern);
                    if (!matches || matches.length === 0) continue;

                    // Process each match in the string
                    for (const matchText of matches) {
                        // Skip empty matches
                        if (!matchText) continue;

                        const startIndex = str.indexOf(matchText);
                        if (startIndex === -1) continue;

                        // Extract the transform matrix
                        const [a, b, c, d, e, f] = textItem.transform;

                        // Calculate the width of the match
                        const itemWidth = textItem.width;
                        const matchWidth = (matchText.length / str.length) * itemWidth;

                        // Determine the starting position of the match within the text item
                        const matchStart = (startIndex / str.length) * itemWidth;

                        // Character width estimation - for positional adjustments
                        const charWidth = itemWidth / str.length;

                        // Estimate the font size from the transform matrix
                        // In most cases, the b value represents the vertical scaling
                        const fontSize = Math.abs(b || d || 12);

                        // Create the rectangle for highlighting
                        const x1 = e + matchStart - (charWidth * 0.5);
                        const x2 = e + matchStart + matchWidth + (charWidth * 1);
                        const y1 = f - (fontSize * 0.2);
                        const y2 = f + (fontSize * 0.8);

                        const rect = {
                            // Horizontal positioning
                            x1,
                            x2,

                            // Vertical positioning
                            y1,
                            y2,

                            // Width and height calculated directly
                            width: x2 - x1,
                            height: y2 - y1,

                            // Page number
                            pageNumber
                        };

                        console.log(`Match: "${matchText}" on page ${pageNumber}`, {
                            transform: [a, b, c, d, e, f],
                            rect,
                            fontSize,
                            text: str,
                            matchStart,
                            charWidth
                        });

                        // Create a scaled position with a single rect
                        const scaledPosition: ScaledPosition = {
                            boundingRect: rect,
                            rects: [rect],
                            pageNumber,
                            usePdfCoordinates: true
                        };

                        // Create a highlight object for this match
                        const newHighlight: NewHighlight = {
                            content: {
                                text: matchText
                            },
                            position: scaledPosition,
                            comment: {
                                text: `Match: ${matchText}`,
                                emoji: "🔍",
                                color
                            }
                        };

                        newHighlights.push(newHighlight);
                    }
                }
            } catch (error) {
                console.error(`Error searching page ${pageNumber}:`, error);
            }
        }

        // Add all found highlights
        if (newHighlights.length > 0) {
            const newHighlightWithIds = newHighlights.map(highlight => ({
                ...highlight,
                id: getNextId()
            }));

            // Keep track of search highlight IDs
            setSearchHighlightIds(prevIds => {
                const updatedIds = new Set(prevIds);
                for (const h of newHighlightWithIds) {
                    updatedIds.add(h.id);
                }
                return updatedIds;
            });

            // 검색 결과 하이라이트 저장
            const updatedHighlights = [...newHighlightWithIds, ...highlights];
            updateHighlights(updatedHighlights);

            // 첫 번째 검색 결과로 스크롤하기
            if (newHighlightWithIds.length > 0) {
                setTimeout(() => {
                    scrollToHighlight(newHighlightWithIds[0]);
                }, 100);
            }
        } else {
            alert(`No matches found for: ${text}`);
        }
    }, []);

    return {
        searchHighlightIds,
        clearSearchHighlights,
        searchText,
        hasSearchHighlights: searchHighlightIds.size > 0
    };
};

export const PdfSearchInput: FC<{
    onSearch: (text: string, color: string) => void;
    hasSearchHighlights: boolean;
    onClearSearch: () => void;
}> = ({ onSearch, hasSearchHighlights, onClearSearch }) => {
    const [searchText, setSearchText] = useState("");
    const [searchColor, setSearchColor] = useState("#ff6b6b");

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (searchText.trim()) {
            onSearch(searchText, searchColor);
        }
    };

    return (
        <div className="search-container" style={{ marginBottom: "1rem" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                        type="text"
                        placeholder="Search text (regex supported)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc"
                        }}
                    />
                    <input
                        type="color"
                        value={searchColor}
                        onChange={(e) => setSearchColor(e.target.value)}
                        style={{ width: "40px", padding: "0" }}
                        title="Highlight color"
                    />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        type="submit"
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            backgroundColor: "#4a8cf7",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                        Search
                    </button>
                    {hasSearchHighlights && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            style={{
                                flex: 1,
                                padding: "0.5rem",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};