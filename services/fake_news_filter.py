import logging
from transformers import pipeline

logger = logging.getLogger(__name__)

_classifier = None
# Index of the "REAL" label as determined from the model's id2label at load time.
# Default assumes LABEL_1 = REAL (correct for jy46604790/Fake-News-Bert-Detect),
# but is overridden once the model loads.
_real_label_idx: int = 1


def normalize_label_confidence(label: str, score: float):
    """
    Shared utility: convert raw BERT label/score to (is_real, confidence).
    confidence = probability the article is genuine news (0-1).
    Uses _real_label_idx set from the model's id2label at load time.
    """
    try:
        label_idx = int(label.rsplit("_", 1)[-1])
    except (ValueError, IndexError):
        label_idx = -1
    is_real = label_idx == _real_label_idx
    confidence = score if is_real else 1 - score
    return is_real, confidence


def load_model():
    global _classifier, _real_label_idx
    if _classifier is None:
        logger.info("[CityShield] Loading fake news detection model...")
        _classifier = pipeline(
            "text-classification",
            model="jy46604790/Fake-News-Bert-Detect",
            truncation=True,
            max_length=512
        )
        # Determine which label index maps to "REAL" from the model config
        try:
            id2label = _classifier.model.config.id2label
            real_idx = next(
                (k for k, v in id2label.items() if v.upper() == "REAL"), None
            )
            if real_idx is not None:
                _real_label_idx = int(real_idx)
                logger.info("[CityShield] id2label=%s  real_label_idx=%d", id2label, _real_label_idx)
            else:
                logger.warning("[CityShield] 'REAL' not found in id2label %s — keeping default idx=%d", id2label, _real_label_idx)
        except Exception as exc:
            logger.warning("[CityShield] Could not read id2label from model config: %s — using default", exc)
        logger.info("[CityShield] Model loaded successfully.")
    return _classifier


REAL_THRESHOLD = 0.65


def filter_headlines(headlines: list[str]) -> list[str]:
    classifier = load_model()
    verified = []
    discarded = []
    logger.info("[CityShield] Running Fake News Filter... threshold=%.2f", REAL_THRESHOLD)
    for headline in headlines:
        result = classifier(headline)[0]
        is_real, confidence = normalize_label_confidence(result["label"], result["score"])
        # status reflects the actual filter decision, not just the confidence threshold
        status = "REAL" if (confidence >= REAL_THRESHOLD and is_real) else "FAKE"
        logger.debug("  [%s] (%.2f) %s", status, confidence, headline[:60])
        if confidence >= REAL_THRESHOLD and is_real:
            verified.append(headline)
        else:
            discarded.append(headline)
    logger.info("  Verified: %d  Discarded: %d", len(verified), len(discarded))
    if not verified:
        logger.warning("  [WARNING] All headlines filtered -- using originals as fallback")
        return headlines
    return verified


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    test_headlines = [
        "India raises fuel prices amid global oil surge",
        "SHOCKING: Government secretly replacing water with poison",
        "RBI holds interest rates steady in April meeting",
        "Aliens land in Mumbai, take over Bandra Kurla Complex",
        "Pune floods disrupt supply chains across Maharashtra",
    ]
    print("=== Fake News Filter Test ===\n")
    result = filter_headlines(test_headlines)
    print("\n=== Verified Headlines ===")
    for h in result:
        print(f"  - {h}")
