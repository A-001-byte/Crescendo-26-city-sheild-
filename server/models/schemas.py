from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class Article(BaseModel):
    title: str
    source: str
    published_at: str
    description: Optional[str] = ""
    content: Optional[str] = ""
    url: Optional[str] = ""
    relevance_keywords: Optional[List[str]] = Field(default_factory=list)

    class Config:
        extra = "allow"


class NLPAnalysis(BaseModel):
    title: str
    source: str
    vader_compound: float = 0.0
    vader_negative: float = 0.0
    keyword_score: float = 0.0
    matched_keywords: List[str] = Field(default_factory=list)
    affected_services: List[str] = Field(default_factory=list)
    india_relevance: float = 0.0
    combined_severity: float = 0.0
    crisis_level: str = "low"
    summary: Optional[str] = ""

    class Config:
        extra = "allow"


class ServiceSignal(BaseModel):
    score: float = 0.0
    article_count: int = 0
    top_keywords: List[str] = Field(default_factory=list)

    class Config:
        extra = "allow"


class CRSResult(BaseModel):
    city: str = "Pune"
    overall_crs: float
    alert_level: str
    services: Dict[str, Any] = Field(default_factory=dict)
    ward_scores: Dict[str, float] = Field(default_factory=dict)
    trigger_level: str
    recommended_actions: List[str] = Field(default_factory=list)
    timestamp: str

    class Config:
        extra = "allow"


class AlertDispatch(BaseModel):
    ward: str
    message: str
    severity: str
    channels: List[str] = Field(default_factory=lambda: ["sms", "app"])

    class Config:
        extra = "allow"


class WardData(BaseModel):
    name: str
    risk_score: float
    fuel_score: float
    power_score: float
    food_score: float
    logistics_score: float
    population: int
    fuel_stations: int
    hospitals: int
    buffer_hours: int

    class Config:
        extra = "allow"
