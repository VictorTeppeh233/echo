import re
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DocumentExtractor:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """Extract text from PDF, DOCX, TXT, or MD files."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_type_clean = file_type.lower().replace(".", "")

        if file_type_clean == "pdf":
            return DocumentExtractor._extract_pdf(path)
        elif file_type_clean in ["docx", "doc"]:
            return DocumentExtractor._extract_docx(path)
        elif file_type_clean in ["txt", "md", "markdown", "json", "csv"]:
            return DocumentExtractor._extract_plain_text(path)
        else:
            # Fallback to UTF-8 text read
            return DocumentExtractor._extract_plain_text(path)

    @staticmethod
    def _extract_pdf(path: Path) -> str:
        try:
            import fitz # PyMuPDF
            doc = fitz.open(str(path))
            text_parts = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    text_parts.append(text.strip())
            doc.close()
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"PyMuPDF error reading {path}: {e}")
            raise RuntimeError(f"Could not extract text from PDF: {e}")

    @staticmethod
    def _extract_docx(path: Path) -> str:
        try:
            import docx
            doc = docx.Document(str(path))
            text_parts = []
            for para in doc.paragraphs:
                if para.text.strip():
                    text_parts.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        text_parts.append(row_text)
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"python-docx error reading {path}: {e}")
            raise RuntimeError(f"Could not extract text from DOCX: {e}")

    @staticmethod
    def _extract_plain_text(path: Path) -> str:
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading plain text file {path}: {e}")
            raise RuntimeError(f"Could not read text file: {e}")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
        """Split text into overlapping semantic chunks based on paragraphs and sentences."""
        if not text or not text.strip():
            return []

        # Clean text
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current_chunk = ""

        for para in paragraphs:
            # If paragraph itself is larger than chunk_size, split by sentences
            if len(para) > chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                        current_chunk = f"{current_chunk} {sentence}".strip()
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        # Start next chunk with overlap from end of previous if possible
                        if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                            overlap_prefix = current_chunk[-chunk_overlap:].strip()
                            current_chunk = f"{overlap_prefix} {sentence}".strip()
                        else:
                            current_chunk = sentence
            else:
                if len(current_chunk) + len(para) + 2 <= chunk_size:
                    current_chunk = f"{current_chunk}\n\n{para}".strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                        overlap_prefix = current_chunk[-chunk_overlap:].strip()
                        current_chunk = f"{overlap_prefix}\n\n{para}".strip()
                    else:
                        current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

extractor = DocumentExtractor()
