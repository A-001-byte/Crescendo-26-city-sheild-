from transformers import pipeline

_classifier = None

def load_model():
    global _classifier
    if _classifier is None:
        print("[CityShield] Loading fake news detection model...")
        _classifier = pipeline(
            "text-classification",
            model="jy46604790/Fake-News-Bert-Detect",
            truncation=True,
            max_length=512
        )
        print("[CityShield] Model loaded successfully.")
    return _classifier

REAL_THRESHOLD = 0.65

def filter_headlines(headlines: list[str]) -> list[str]:
    classifier = load_model()
    verified = []
    discarded = []
    print("\n[CityShield] Running Fake News Filter...")
    print(f"  Threshold: {REAL_THRESHOLD} (above = REAL, below = FAKE)\n")
    for headline in headlines:
        result = classifier(headline)[0]
        label = result["label"]
        score = result["score"]
        is_real = label == "LABEL_1"
        confidence = score if is_real else 1 - score
        status = "REAL" if confidence >= REAL_THRESHOLD else "FAKE"
        print(f"  [{status}] ({confidence:.2f}) {headline[:60]}...")
        if confidence >= REAL_THRESHOLD and is_real:
            verified.append(headline)
        else:
            discarded.append(headline)
    print(f"\n  Verified Headlines : {len(verified)}")
    print(f"  Discarded Headlines: {len(discarded)}")
    if not verified:
        print("  [WARNING] All headlines filtered -- using originals as fallback")
        return headlines
    return verified


if __name__ == "__main__":
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
