import logging
from collections import OrderedDict
from typing import Optional

from transformers import pipeline

logger = logging.getLogger(__name__)

_classifier = None
_loaded_model_name: Optional[str] = None
_result_cache: "OrderedDict[str, dict]" = OrderedDict()

MODEL_NAME_PRIMARY = "mrm8488/bert-tiny-finetuned-fake-news-detection"
MODEL_NAME_FALLBACK = "jy46604790/Fake-News-Bert-Detect"
CACHE_MAX_SIZE = 512

# Index of the "REAL" label as determined from the model's id2label at load time.
# Default assumes LABEL_1 = REAL (works for jy46604790/Fake-News-Bert-Detect),
# but is overridden once the model loads.
_real_label_idx: int = 1


def normalize_label_confidence(label: str, score: float):
    """
    Shared utility: convert raw BERT label/score to (is_real, confidence).
    confidence = probability the article is genuine news (0-1).
    Uses _real_label_idx set from the model's id2label at load time.
    """
    label = (label or "").strip()
    label_upper = label.upper()

    if "REAL" in label_upper:
        is_real = True
    elif "FAKE" in label_upper:
        is_real = False
    else:
        try:
            label_idx = int(label.rsplit("_", 1)[-1])
        except (ValueError, IndexError):
            label_idx = -1
        is_real = label_idx == _real_label_idx

    confidence = score if is_real else 1 - score
    return is_real, confidence


def map_credibility_score(is_real: bool, confidence: float) -> float:
    """
    Map model confidence to UI-friendly credibility range.
    REAL -> 0.7-1.0, FAKE -> 0.0-0.3.
    """
    confidence = max(0.0, min(1.0, confidence))
    if is_real:
        score = 0.7 + (0.3 * confidence)
    else:
        score = 0.3 * confidence
    return max(0.0, min(1.0, score))


def load_model():
    global _classifier, _real_label_idx, _loaded_model_name
    if _classifier is None:
        last_exc = None
        for model_name in (MODEL_NAME_PRIMARY, MODEL_NAME_FALLBACK):
            try:
                logger.info("[CityShield] Loading fake news detection model: %s", model_name)
                _classifier = pipeline(
                    "text-classification",
                    model=model_name,
                    truncation=True,
                    max_length=512,
                )
                _loaded_model_name = model_name

                # Determine which label index maps to "REAL" from the model config
                try:
                    id2label = _classifier.model.config.id2label
                    real_idx = next(
                        (k for k, v in id2label.items() if "REAL" in str(v).upper()),
                        None,
                    )
                    if real_idx is not None:
                        _real_label_idx = int(real_idx)
                        logger.info("[CityShield] id2label=%s  real_label_idx=%d", id2label, _real_label_idx)
                    else:
                        logger.warning(
                            "[CityShield] 'REAL' not found in id2label %s — keeping default idx=%d",
                            id2label,
                            _real_label_idx,
                        )
                except Exception as exc:
                    logger.warning("[CityShield] Could not read id2label from model config: %s — using default", exc)

                logger.info("[CityShield] Model loaded successfully.")
                break
            except Exception as exc:
                last_exc = exc
                _classifier = None
                _loaded_model_name = None
                logger.warning("[CityShield] Model load failed for %s: %s", model_name, exc)

        if _classifier is None and last_exc is not None:
            raise last_exc

    return _classifier


REAL_THRESHOLD = 0.65


def _normalize_cache_key(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _cache_get(key: str) -> Optional[dict]:
    if not key:
        return None
    cached = _result_cache.get(key)
    if cached is not None:
        _result_cache.move_to_end(key)
    return cached


def _cache_set(key: str, value: dict) -> None:
    if not key:
        return
    _result_cache[key] = value
    _result_cache.move_to_end(key)
    if len(_result_cache) > CACHE_MAX_SIZE:
        _result_cache.popitem(last=False)


def classify_text(text: str) -> dict:
    """Classify a news text with caching to avoid repeated model runs."""
    key = _normalize_cache_key(text)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    classifier = load_model()
    result = classifier(text)[0]
    print("ML RESULT:", result)
    _cache_set(key, result)
    return result


def filter_headlines(headlines: list[str]) -> list[str]:
    verified = []
    discarded = []
    logger.info("[CityShield] Running Fake News Filter... threshold=%.2f", REAL_THRESHOLD)
    for headline in headlines:
        result = classify_text(headline)
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
